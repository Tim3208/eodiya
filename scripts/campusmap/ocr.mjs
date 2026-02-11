import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function getArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return fallback;

  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) return fallback;
  return value;
}

function toId(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9\uac00-\ud7a3]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown"
  );
}

function checkTesseractInstalled() {
  const check = spawnSync("tesseract", ["--version"], {
    encoding: "utf8",
    shell: true,
  });

  if (check.status !== 0) {
    const stderr = check.stderr?.trim();
    const stdout = check.stdout?.trim();
    throw new Error(
      `tesseract command is unavailable. ${stderr || stdout || "Install Tesseract OCR first."}`,
    );
  }
}

function runTesseract(imagePath, lang, psm) {
  const args = [
    imagePath,
    "stdout",
    "-l",
    lang,
    "--oem",
    "1",
    "--psm",
    String(psm),
  ];

  const result = spawnSync("tesseract", args, {
    encoding: "utf8",
    shell: true,
    maxBuffer: 1024 * 1024 * 32,
  });

  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || "tesseract failed");
  }

  return result.stdout?.trim() ?? "";
}

async function main() {
  const inputPath = getArg("--in", "data/campusmap/raw/buildings.raw.json");
  const outDir = getArg("--out", "data/campusmap/ocr");
  const lang = getArg("--lang", "kor+eng");
  const psm = Number(getArg("--psm", "6"));
  const limit = Number(getArg("--limit", "0"));

  if (!existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  checkTesseractInstalled();

  await mkdir(outDir, { recursive: true });

  const raw = JSON.parse(await readFile(inputPath, "utf8"));
  const buildings = Array.isArray(raw.buildings) ? raw.buildings : [];
  const target = limit > 0 ? buildings.slice(0, limit) : buildings;

  console.log(`[ocr] Processing ${target.length} buildings.`);

  const outputBuildings = [];

  for (let i = 0; i < target.length; i += 1) {
    const building = target[i];
    const id = building.id || building.sequence || i + 1;
    const name = building.detailTitle || building.name || `building-${i + 1}`;
    const idPrefix = `${String(i + 1).padStart(2, "0")}-${toId(String(id))}`;

    const localImages = Array.isArray(building.localImages)
      ? building.localImages.filter((item) => item?.filePath)
      : [];

    console.log(`[ocr] (${i + 1}/${target.length}) ${name} | images=${localImages.length}`);

    const ocrEntries = [];

    for (let imageIndex = 0; imageIndex < localImages.length; imageIndex += 1) {
      const image = localImages[imageIndex];
      const filePath = image.filePath;

      if (!existsSync(filePath)) {
        ocrEntries.push({
          imageUrl: image.imageUrl,
          filePath,
          textPath: null,
          text: "",
          error: "Image file not found",
        });
        continue;
      }

      const textPath = path.join(
        outDir,
        `${idPrefix}-${String(imageIndex + 1).padStart(2, "0")}.txt`,
      );

      try {
        const text = runTesseract(filePath, lang, psm);
        await writeFile(textPath, `${text}\n`, "utf8");

        ocrEntries.push({
          imageUrl: image.imageUrl,
          filePath,
          textPath,
          text,
          error: null,
        });
      } catch (error) {
        ocrEntries.push({
          imageUrl: image.imageUrl,
          filePath,
          textPath: null,
          text: "",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const mergedText = ocrEntries
      .map((entry) => entry.text)
      .filter(Boolean)
      .join("\n\n");

    outputBuildings.push({
      id: building.id,
      sequence: building.sequence,
      name: building.name,
      detailTitle: building.detailTitle,
      url: building.url,
      floorTextCandidates: building.floorTextCandidates ?? [],
      ocrEntries,
      mergedText,
    });
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    source: inputPath,
    count: outputBuildings.length,
    buildings: outputBuildings,
  };

  const outputPath = path.join(outDir, "buildings.ocr.json");
  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`[ocr] Done. Output: ${outputPath}`);
}

main().catch((error) => {
  console.error("[ocr] Fatal error:", error);
  process.exitCode = 1;
});
