import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_POINT = { lat: 37.64389, lng: 127.10572 };

function getArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return fallback;

  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) return fallback;
  return value;
}

function normalizeLine(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function toSafeId(value) {
  return (
    normalizeLine(value)
      .toLowerCase()
      .replace(/[^a-z0-9\uac00-\ud7a3]+/g, "-")
      .replace(/^-+|-+$/g, "") || "place"
  );
}

function uniq(items) {
  const out = [];
  const seen = new Set();

  for (const item of items) {
    const v = normalizeLine(item);
    if (!v) continue;
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }

  return out;
}

function ensurePoint(point) {
  if (
    point &&
    typeof point === "object" &&
    typeof point.lat === "number" &&
    typeof point.lng === "number"
  ) {
    return {
      lat: Number(point.lat.toFixed(6)),
      lng: Number(point.lng.toFixed(6)),
    };
  }

  return { ...DEFAULT_POINT };
}

function normalizeCategory(value) {
  return value === "건물 내부" ? "건물 내부" : "건물";
}

function ensureUniqueId(rawId, usedIds) {
  let id = toSafeId(rawId);

  if (!usedIds.has(id)) {
    usedIds.add(id);
    return id;
  }

  let idx = 2;
  while (usedIds.has(`${id}-${idx}`)) {
    idx += 1;
  }

  id = `${id}-${idx}`;
  usedIds.add(id);
  return id;
}

function buildCampusPlaces(rawPlaces) {
  const usedIds = new Set();

  return rawPlaces
    .map((place, index) => {
      const name = normalizeLine(place.name);
      const building = normalizeLine(place.building || place.name);
      if (!name || !building) return null;

      const floor = normalizeLine(place.floor || "");
      const category = normalizeCategory(place.category);
      const id = ensureUniqueId(place.id || `${building}-${floor || index + 1}`, usedIds);

      const aliases = uniq([
        ...(Array.isArray(place.aliases) ? place.aliases : []),
        name,
        building,
        floor || null,
      ]);

      const description = normalizeLine(place.description || "");

      const normalized = {
        id,
        name,
        building,
        ...(floor ? { floor } : {}),
        category,
        aliases,
        ...(description ? { description } : {}),
        point: ensurePoint(place.point),
      };

      return normalized;
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.category !== b.category) {
        return a.category === "건물" ? -1 : 1;
      }

      const byBuilding = a.building.localeCompare(b.building, "ko");
      if (byBuilding !== 0) return byBuilding;

      const aFloor = a.floor ?? "";
      const bFloor = b.floor ?? "";
      const byFloor = aFloor.localeCompare(bFloor, "ko");
      if (byFloor !== 0) return byFloor;

      return a.name.localeCompare(b.name, "ko");
    });
}

function toTsModule(campusPlaces, metadata) {
  const body = JSON.stringify(campusPlaces, null, 2);
  const source = metadata?.source ? ` | source: ${metadata.source}` : "";
  const generatedAt = metadata?.generatedAt || new Date().toISOString();

  return `import type { CampusPlace } from "../lib/types";\n\n// Auto-generated file.\n// generatedAt: ${generatedAt}${source}\nexport const campusPlaces: CampusPlace[] = ${body};\n`;
}

async function main() {
  const inputPath = getArg("--in", "data/campusmap/places.draft.json");
  const outputPath = getArg("--out", "src/data/places.ts");

  if (!existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  const payload = JSON.parse(await readFile(inputPath, "utf8"));
  const rawPlaces = Array.isArray(payload.places) ? payload.places : [];

  const campusPlaces = buildCampusPlaces(rawPlaces);
  const moduleText = toTsModule(campusPlaces, payload);

  await writeFile(outputPath, moduleText, "utf8");

  console.log(
    `[generate] Wrote ${campusPlaces.length} places to ${path.normalize(outputPath)}`,
  );
}

main().catch((error) => {
  console.error("[generate] Fatal error:", error);
  process.exitCode = 1;
});
