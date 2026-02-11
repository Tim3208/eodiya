import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_ENTRY_URL =
  "https://www.syu.ac.kr/about-sahmyook/college-guide/campusmap/";
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function getArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return fallback;

  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) return fallback;
  return value;
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function safeSlug(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9\uac00-\ud7a3]+/g, "-")
      .replace(/^-+|-+$/g, "") || "item"
  );
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)));
}

function stripTags(value) {
  return decodeHtml(
    value
      .replace(/<br\s*\/?\s*>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim(),
  );
}

function normalizeLine(value) {
  return value.replace(/\s+/g, " ").trim();
}

function toAbsoluteUrl(baseUrl, maybeRelative) {
  try {
    return new URL(maybeRelative, baseUrl).toString();
  } catch {
    return null;
  }
}

function normalizeCharset(charset) {
  if (!charset) return "utf-8";

  const normalized = charset.toLowerCase().replace(/['"]/g, "").trim();
  if (["cp949", "x-windows-949", "ks_c_5601-1987", "euckr"].includes(normalized)) {
    return "euc-kr";
  }
  return normalized;
}

function decodeBytes(bytes, charset) {
  const safeCharset = normalizeCharset(charset);

  try {
    return new TextDecoder(safeCharset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}

async function fetchText(url, retries = 2) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const buffer = new Uint8Array(await response.arrayBuffer());

      const headerCharsetMatch = response
        .headers
        .get("content-type")
        ?.match(/charset=([^;]+)/i);

      let html = decodeBytes(buffer, headerCharsetMatch?.[1]);

      const metaCharsetMatch = html.match(
        /<meta\b[^>]*charset=['"]?([a-zA-Z0-9_\-]+)['"]?[^>]*>/i,
      );

      if (metaCharsetMatch?.[1]) {
        html = decodeBytes(buffer, metaCharsetMatch[1]);
      }

      return html;
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error("Unknown fetch error");
}

async function fetchBinary(url, retries = 2) {
  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "user-agent": USER_AGENT,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, 600 * (attempt + 1)));
      }
    }
  }

  throw lastError ?? new Error("Unknown fetch error");
}

function extractArrayLiteral(source, token) {
  const tokenIndex = source.indexOf(token);
  if (tokenIndex < 0) return null;

  const startIndex = source.indexOf("[", tokenIndex);
  if (startIndex < 0) return null;

  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  let depth = 0;

  for (let i = startIndex; i < source.length; i += 1) {
    const ch = source[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (!inDouble && ch === "'") {
      inSingle = !inSingle;
      continue;
    }

    if (!inSingle && ch === '"') {
      inDouble = !inDouble;
      continue;
    }

    if (inSingle || inDouble) continue;

    if (ch === "[") depth += 1;
    if (ch === "]") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, i + 1);
      }
    }
  }

  return null;
}

function extractObjectLiterals(arrayLiteral) {
  const objects = [];

  let inSingle = false;
  let inDouble = false;
  let escaped = false;
  let depth = 0;
  let objectStart = -1;

  for (let i = 0; i < arrayLiteral.length; i += 1) {
    const ch = arrayLiteral[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (!inDouble && ch === "'") {
      inSingle = !inSingle;
      continue;
    }

    if (!inSingle && ch === '"') {
      inDouble = !inDouble;
      continue;
    }

    if (inSingle || inDouble) continue;

    if (ch === "{") {
      if (depth === 0) objectStart = i;
      depth += 1;
      continue;
    }

    if (ch === "}") {
      depth -= 1;
      if (depth === 0 && objectStart >= 0) {
        objects.push(arrayLiteral.slice(objectStart, i + 1));
        objectStart = -1;
      }
    }
  }

  return objects;
}

function decodeJsString(value) {
  return decodeHtml(
    value
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16)),
      )
      .replace(/\\\\/g, "\\"),
  );
}

function extractSingleQuotedField(objectLiteral, key) {
  const keyPattern = new RegExp(`${key}\\s*:\\s*'`, "m");
  const keyMatch = keyPattern.exec(objectLiteral);
  if (!keyMatch) return "";

  let index = keyMatch.index + keyMatch[0].length;
  let escaped = false;
  let value = "";

  while (index < objectLiteral.length) {
    const ch = objectLiteral[index];
    if (escaped) {
      value += `\\${ch}`;
      escaped = false;
      index += 1;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      index += 1;
      continue;
    }

    if (ch === "'") {
      break;
    }

    value += ch;
    index += 1;
  }

  return decodeJsString(value);
}

function extractEmbeddedBuildings(mainHtml, entryUrl) {
  const arrayLiteral = extractArrayLiteral(mainHtml, "var buildings =");
  if (!arrayLiteral) return [];

  const objectLiterals = extractObjectLiterals(arrayLiteral);
  const buildings = [];

  for (let i = 0; i < objectLiterals.length; i += 1) {
    const literal = objectLiterals[i];

    const latLngMatch = literal.match(
      /position\s*:\s*new\s+kakao\.maps\.LatLng\(([-\d.]+)\s*,\s*([-\d.]+)\)/i,
    );

    const lat = latLngMatch ? Number(latLngMatch[1]) : null;
    const lng = latLngMatch ? Number(latLngMatch[2]) : null;

    const title = extractSingleQuotedField(literal, "title");
    const summary = extractSingleQuotedField(literal, "summary");
    const floorPlanHtml = extractSingleQuotedField(literal, "floorPlan");
    const thumbnail = extractSingleQuotedField(literal, "thumbnail");
    const vrLinkRaw = extractSingleQuotedField(literal, "vrLink");

    const thumbnailUrl = thumbnail ? toAbsoluteUrl(entryUrl, thumbnail) : null;
    const vrLink = vrLinkRaw ? toAbsoluteUrl(entryUrl, vrLinkRaw) : null;

    buildings.push({
      sequence: i + 1,
      name: title || `building-${i + 1}`,
      detailTitle: title || null,
      url: entryUrl,
      lat,
      lng,
      thumbnail: thumbnailUrl,
      summary,
      floorPlanHtml,
      vrLink,
    });
  }

  return buildings;
}

function extractMainLinks(html, entryUrl) {
  const anchorRegex = /<a\b[^>]*href=(['"])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi;
  const dedup = new Map();

  for (const match of html.matchAll(anchorRegex)) {
    const href = match[2];
    const absoluteUrl = toAbsoluteUrl(entryUrl, href);
    if (!absoluteUrl) continue;

    let pathname = "";
    try {
      pathname = new URL(absoluteUrl).pathname;
    } catch {
      continue;
    }

    if (!/\/about-sahmyook\/college-guide\/campusmap\/\d+_[^/]+\/?$/i.test(pathname)) {
      continue;
    }

    const rawText = stripTags(match[3]);
    const sequenceMatch = pathname.match(/\/(\d+)_/);
    const sequence = sequenceMatch ? Number(sequenceMatch[1]) : null;

    if (!dedup.has(absoluteUrl)) {
      dedup.set(absoluteUrl, {
        sequence,
        name: rawText || null,
        url: absoluteUrl,
      });
    }
  }

  return Array.from(dedup.values()).sort((a, b) => {
    if (a.sequence == null && b.sequence == null) return a.url.localeCompare(b.url);
    if (a.sequence == null) return 1;
    if (b.sequence == null) return -1;
    return a.sequence - b.sequence;
  });
}

function extractTitle(html) {
  const ogTitleMatch = html.match(
    /<meta\b[^>]*property=['"]og:title['"][^>]*content=['"]([^'"]+)['"][^>]*>/i,
  );
  if (ogTitleMatch) return decodeHtml(ogTitleMatch[1]).trim();

  const hMatch = html.match(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/i);
  if (hMatch) return stripTags(hMatch[1]);

  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  return titleMatch ? stripTags(titleMatch[1]) : null;
}

function extractImageUrls(html, pageUrl) {
  const urls = new Set();

  for (const match of html.matchAll(
    /<meta\b[^>]*property=['"]og:image['"][^>]*content=['"]([^'"]+)['"][^>]*>/gi,
  )) {
    const absoluteUrl = toAbsoluteUrl(pageUrl, match[1]);
    if (absoluteUrl) urls.add(absoluteUrl);
  }

  for (const imgMatch of html.matchAll(/<img\b[^>]*>/gi)) {
    const tag = imgMatch[0];
    const attrMatch = tag.match(/(?:src|data-src)=['"]([^'"]+)['"]/i);
    if (!attrMatch) continue;

    const absoluteUrl = toAbsoluteUrl(pageUrl, attrMatch[1]);
    if (!absoluteUrl) continue;

    const normalized = absoluteUrl.toLowerCase();
    const isImageAsset = /\.(png|jpe?g|webp|gif)(\?|$)/i.test(normalized);
    const isWordpressUpload = normalized.includes("/wp-content/uploads/");

    if (isImageAsset && isWordpressUpload) {
      urls.add(absoluteUrl);
    }
  }

  return Array.from(urls);
}

function extractFloorTextCandidates(html) {
  const text = html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/(p|li|div|tr|h\d|span)>/gi, "\n")
    .replace(/<[^>]*>/g, " ");

  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeLine(decodeHtml(line)))
    .filter(Boolean);

  const floorPattern = /(지하\s*\d+\s*층|B\s*\d+|\d+\s*층)/i;
  const result = [];
  const seen = new Set();

  for (const line of lines) {
    if (!floorPattern.test(line)) continue;
    if (line.length > 220) continue;

    if (!seen.has(line)) {
      seen.add(line);
      result.push(line);
    }
  }

  return result;
}

async function downloadImages(imageUrls, outputDir, filePrefix) {
  const downloaded = [];

  for (let i = 0; i < imageUrls.length; i += 1) {
    const imageUrl = imageUrls[i];

    let extension = ".jpg";
    try {
      const pathname = new URL(imageUrl).pathname;
      const extCandidate = path.extname(pathname);
      if (extCandidate) extension = extCandidate;
    } catch {
      // Keep default extension.
    }

    const filename = `${filePrefix}-${String(i + 1).padStart(2, "0")}${extension}`;
    const filePath = path.join(outputDir, filename);

    try {
      const fileData = await fetchBinary(imageUrl);
      await writeFile(filePath, fileData);
      downloaded.push({ imageUrl, filePath });
    } catch (error) {
      downloaded.push({
        imageUrl,
        filePath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return downloaded;
}

async function scrapeFromEmbeddedData(mainHtml, entryUrl, outDir, downloadImagesFlag, maxCount) {
  let embedded = extractEmbeddedBuildings(mainHtml, entryUrl);
  if (maxCount > 0) {
    embedded = embedded.slice(0, maxCount);
  }

  if (embedded.length === 0) {
    return null;
  }

  console.log(`[scrape] Embedded building objects found: ${embedded.length}`);

  const result = [];

  for (let i = 0; i < embedded.length; i += 1) {
    const building = embedded[i];
    const floorTextCandidates = extractFloorTextCandidates(building.floorPlanHtml ?? "");

    const imageUrls = [];
    if (building.thumbnail) {
      imageUrls.push(building.thumbnail);
    }

    let localImages = [];
    if (downloadImagesFlag && imageUrls.length > 0) {
      const slug = `${String(building.sequence).padStart(2, "0")}-${safeSlug(building.name)}`;
      localImages = await downloadImages(imageUrls, path.join(outDir, "images"), slug);
    }

    result.push({
      sequence: building.sequence,
      name: building.name,
      url: building.url,
      detailTitle: building.detailTitle,
      detailError: null,
      imageUrls,
      localImages,
      floorTextCandidates,
      summary: building.summary,
      floorPlanHtml: building.floorPlanHtml,
      vrLink: building.vrLink,
      point:
        typeof building.lat === "number" && typeof building.lng === "number"
          ? { lat: building.lat, lng: building.lng }
          : null,
    });
  }

  return result;
}

async function scrapeFromDetailLinks(mainHtml, entryUrl, outDir, downloadImagesFlag, maxCount) {
  let buildings = extractMainLinks(mainHtml, entryUrl);
  if (maxCount > 0) {
    buildings = buildings.slice(0, maxCount);
  }

  console.log(`[scrape] Detail links found: ${buildings.length}`);

  const result = [];

  for (let i = 0; i < buildings.length; i += 1) {
    const building = buildings[i];
    const sequenceLabel = building.sequence != null ? String(building.sequence) : String(i + 1);

    console.log(`[scrape] (${i + 1}/${buildings.length}) ${building.url}`);

    let detailHtml = "";
    let errorMessage = null;

    try {
      detailHtml = await fetchText(building.url);
    } catch (error) {
      errorMessage = error instanceof Error ? error.message : String(error);
      result.push({
        ...building,
        detailTitle: building.name,
        detailError: errorMessage,
        imageUrls: [],
        floorTextCandidates: [],
        localImages: [],
      });
      continue;
    }

    const detailSlug = `${String(sequenceLabel).padStart(2, "0")}-${safeSlug(
      building.name ?? "detail",
    )}`;
    await writeFile(path.join(outDir, "details", `${detailSlug}.html`), detailHtml, "utf8");

    const detailTitle = extractTitle(detailHtml) ?? building.name;
    const imageUrls = extractImageUrls(detailHtml, building.url);
    const floorTextCandidates = extractFloorTextCandidates(detailHtml);

    let localImages = [];
    if (downloadImagesFlag && imageUrls.length > 0) {
      localImages = await downloadImages(imageUrls, path.join(outDir, "images"), detailSlug);
    }

    result.push({
      ...building,
      detailTitle,
      detailError: errorMessage,
      imageUrls,
      floorTextCandidates,
      localImages,
      summary: "",
      floorPlanHtml: "",
      vrLink: "",
      point: null,
    });
  }

  return result;
}

async function main() {
  const entryUrl = getArg("--url", DEFAULT_ENTRY_URL);
  const outDir = getArg("--out", "data/campusmap/raw");
  const maxCount = Number(getArg("--max", "0"));
  const downloadImagesFlag = hasFlag("--download-images");

  await mkdir(outDir, { recursive: true });
  await mkdir(path.join(outDir, "details"), { recursive: true });
  if (downloadImagesFlag) {
    await mkdir(path.join(outDir, "images"), { recursive: true });
  }

  console.log(`[scrape] Fetching entry page: ${entryUrl}`);
  const mainHtml = await fetchText(entryUrl);
  await writeFile(path.join(outDir, "main-page.html"), mainHtml, "utf8");

  let buildings = await scrapeFromEmbeddedData(
    mainHtml,
    entryUrl,
    outDir,
    downloadImagesFlag,
    maxCount,
  );

  let strategy = "embedded-js";
  if (!buildings || buildings.length === 0) {
    strategy = "detail-links";
    buildings = await scrapeFromDetailLinks(
      mainHtml,
      entryUrl,
      outDir,
      downloadImagesFlag,
      maxCount,
    );
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: entryUrl,
    strategy,
    count: buildings.length,
    buildings,
  };

  const outputPath = path.join(outDir, "buildings.raw.json");
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`[scrape] Done. Output: ${outputPath}`);

  if (downloadImagesFlag) {
    const imageCount = buildings.reduce(
      (sum, item) => sum + (Array.isArray(item.localImages) ? item.localImages.length : 0),
      0,
    );
    console.log(`[scrape] Downloaded/attempted images: ${imageCount}`);
  }

  const missingDetails = buildings.filter((item) => item.detailError);
  if (missingDetails.length > 0) {
    console.warn(`[scrape] Failed detail pages: ${missingDetails.length}`);
  }
}

main().catch((error) => {
  console.error("[scrape] Fatal error:", error);
  process.exitCode = 1;
});
