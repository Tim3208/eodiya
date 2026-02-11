import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

function getArg(flag, fallback) {
  const index = process.argv.indexOf(flag);
  if (index < 0) return fallback;

  const value = process.argv[index + 1];
  if (!value || value.startsWith("--")) return fallback;
  return value;
}

function normalizeLine(value) {
  return value.replace(/\s+/g, " ").trim();
}

function toSafeId(value) {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9\uac00-\ud7a3]+/g, "-")
      .replace(/^-+|-+$/g, "") || "unknown"
  );
}

function normalizeFloorLabel(rawLabel) {
  const label = normalizeLine(rawLabel);

  const basementMatch = label.match(/^지하\s*(\d+)\s*층$/);
  if (basementMatch) {
    return { key: `B${basementMatch[1]}`, label: `지하 ${basementMatch[1]}층` };
  }

  const bMatch = label.match(/^B\s*(\d+)$/i);
  if (bMatch) {
    return { key: `B${bMatch[1]}`, label: `지하 ${bMatch[1]}층` };
  }

  const floorMatch = label.match(/^(\d+)\s*층$/);
  if (floorMatch) {
    return { key: `${floorMatch[1]}F`, label: `${floorMatch[1]}층` };
  }

  return { key: label, label };
}

function cleanCandidateText(value) {
  return normalizeLine(
    value
      .replace(/\u00a0/g, " ")
      .replace(/[•●◦▪◆◇▶▷►]/g, " ")
      .replace(/\s*-\s*/g, " - "),
  );
}

function splitOutsideParentheses(text, separators) {
  const output = [];
  let token = "";
  let parenDepth = 0;
  let bracketDepth = 0;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];

    if (ch === "(") {
      parenDepth += 1;
      token += ch;
      continue;
    }
    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      token += ch;
      continue;
    }
    if (ch === "[") {
      bracketDepth += 1;
      token += ch;
      continue;
    }
    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      token += ch;
      continue;
    }

    if (parenDepth === 0 && bracketDepth === 0 && separators.has(ch)) {
      const normalized = normalizeLine(token);
      if (normalized) output.push(normalized);
      token = "";
      continue;
    }

    token += ch;
  }

  const normalized = normalizeLine(token);
  if (normalized) output.push(normalized);

  return output;
}

function normalizeItemText(item) {
  return normalizeLine(
    item
      .replace(/^[-–—•●◦▪◆◇▶▷►\s]+/, "")
      .replace(/\s+/g, " ")
      .replace(/\s*[,;]\s*$/g, ""),
  );
}

function isUsefulItem(item) {
  if (item.length < 2) return false;
  if (/^\d+$/.test(item)) return false;
  if (/^(주소|전화|팩스|문의|홈페이지)\b/.test(item)) return false;
  if (/(md_txt_bullet|\/span|<[^>]+>)/i.test(item)) return false;
  return true;
}

function splitPotentialItems(text) {
  const normalized = cleanCandidateText(text);
  if (!normalized) return [];

  const primarySplit = splitOutsideParentheses(normalized, new Set(["/", "|"]));
  const results = [];

  for (const item of primarySplit) {
    const trimmed = normalizeItemText(item);
    if (!isUsefulItem(trimmed)) continue;

    const hasComma = /[,，]/.test(trimmed);
    const englishCommaList = /^[A-Za-z0-9&().\-\s]+[,，]\s*[A-Za-z0-9&().\-\s]+$/;

    if (hasComma && !englishCommaList.test(trimmed)) {
      const commaSplit = splitOutsideParentheses(trimmed, new Set([",", "，"]))
        .map((value) => normalizeItemText(value))
        .filter(isUsefulItem);

      if (commaSplit.length >= 2) {
        results.push(...commaSplit);
        continue;
      }
    }

    results.push(trimmed);
  }

  return results;
}

function addFloorItem(floorMap, floorKey, floorLabel, item) {
  if (!item) return;

  if (!floorMap.has(floorKey)) {
    floorMap.set(floorKey, {
      floor: floorKey,
      label: floorLabel,
      items: [],
      _seen: new Set(),
    });
  }

  const entry = floorMap.get(floorKey);
  if (!entry._seen.has(item)) {
    entry._seen.add(item);
    entry.items.push(item);
  }
}

function parseFloorsFromText(text) {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeLine(line))
    .filter(Boolean);

  const floorMap = new Map();
  const unmatched = [];
  let currentFloor = null;

  const fullLinePattern = /^(지하\s*\d+\s*층|B\s*\d+|\d+\s*층)\s*[:：\-]?\s*(.*)$/i;
  const floorOnlyPattern = /^(지하\s*\d+\s*층|B\s*\d+|\d+\s*층)$/i;

  for (const line of lines) {
    const fullMatch = line.match(fullLinePattern);

    if (fullMatch) {
      const floorInfo = normalizeFloorLabel(fullMatch[1]);
      currentFloor = floorInfo;

      const detail = normalizeLine(fullMatch[2] ?? "");
      if (detail) {
        const items = splitPotentialItems(detail);
        if (items.length > 0) {
          for (const item of items) {
            addFloorItem(floorMap, floorInfo.key, floorInfo.label, item);
          }
        } else {
          addFloorItem(floorMap, floorInfo.key, floorInfo.label, detail);
        }
      }

      continue;
    }

    const floorOnlyMatch = line.match(floorOnlyPattern);
    if (floorOnlyMatch) {
      currentFloor = normalizeFloorLabel(floorOnlyMatch[1]);
      continue;
    }

    if (
      currentFloor &&
      !/^https?:\/\//i.test(line) &&
      !/^(주소|전화|팩스|문의|홈페이지)/.test(line)
    ) {
      const items = splitPotentialItems(line);
      if (items.length > 0) {
        for (const item of items) {
          addFloorItem(floorMap, currentFloor.key, currentFloor.label, item);
        }
      } else {
        addFloorItem(floorMap, currentFloor.key, currentFloor.label, line);
      }
      continue;
    }

    unmatched.push(line);
  }

  const floors = Array.from(floorMap.values())
    .map((entry) => ({
      floor: entry.floor,
      label: entry.label,
      items: entry.items,
    }))
    .sort((a, b) => {
      const toRank = (floor) => {
        const basement = floor.match(/^B(\d+)$/i);
        if (basement) return -Number(basement[1]);

        const normal = floor.match(/^(\d+)F$/i);
        if (normal) return Number(normal[1]);

        return Number.MAX_SAFE_INTEGER;
      };

      return toRank(a.floor) - toRank(b.floor);
    });

  return { floors, unmatched };
}

function toDescriptionFromFloors(floors) {
  if (!floors.length) return undefined;

  const parts = floors
    .filter((floor) => floor.items.length > 0)
    .map((floor) => `${floor.label}: ${floor.items.join(", ")}`);

  return parts.length > 0 ? parts.join(" | ") : undefined;
}

async function main() {
  const inputPath = getArg("--in", "data/campusmap/ocr/buildings.ocr.json");
  const outDir = getArg("--out", "data/campusmap");

  if (!existsSync(inputPath)) {
    throw new Error(`Input file not found: ${inputPath}`);
  }

  await mkdir(outDir, { recursive: true });

  const payload = JSON.parse(await readFile(inputPath, "utf8"));
  const buildings = Array.isArray(payload.buildings) ? payload.buildings : [];

  const parsedBuildings = buildings.map((building) => {
    const floorCandidates = Array.isArray(building.floorTextCandidates)
      ? building.floorTextCandidates.join("\n")
      : "";

    const ocrText = typeof building.mergedText === "string" ? building.mergedText : "";
    const mergedSourceText = [floorCandidates, ocrText].filter(Boolean).join("\n");

    const { floors, unmatched } = parseFloorsFromText(mergedSourceText);

    return {
      id: building.id,
      sequence: building.sequence,
      name: building.detailTitle || building.name,
      buildingName: building.name,
      url: building.url,
      point:
        building.point &&
        typeof building.point.lat === "number" &&
        typeof building.point.lng === "number"
          ? { lat: building.point.lat, lng: building.point.lng }
          : null,
      floors,
      description: toDescriptionFromFloors(floors),
      unmatched: unmatched.slice(0, 20),
    };
  });

  const result = {
    generatedAt: new Date().toISOString(),
    source: inputPath,
    count: parsedBuildings.length,
    buildings: parsedBuildings,
  };

  const floorsPath = path.join(outDir, "buildings.floors.json");
  await writeFile(floorsPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");

  const placeDraft = [];
  const usedIds = new Set();

  const ensureUniqueId = (rawId) => {
    let id = toSafeId(rawId);
    if (!usedIds.has(id)) {
      usedIds.add(id);
      return id;
    }

    let index = 2;
    while (usedIds.has(`${id}-${index}`)) {
      index += 1;
    }
    id = `${id}-${index}`;
    usedIds.add(id);
    return id;
  };

  for (const building of parsedBuildings) {
    const buildingId = ensureUniqueId(
      building.id ?? normalizeLine(building.name).replace(/\s+/g, "-"),
    );
    const buildingName = building.buildingName ?? building.name;

    placeDraft.push({
      id: buildingId,
      name: building.name,
      building: buildingName,
      category: "건물",
      aliases: [building.name].filter(Boolean),
      description: building.description,
      floors: building.floors,
      point: building.point,
      sourceUrl: building.url,
    });

    for (const floor of building.floors) {
      if (!Array.isArray(floor.items) || floor.items.length === 0) continue;

      placeDraft.push({
        id: ensureUniqueId(`${buildingId}-${floor.floor.toLowerCase()}`),
        name: `${buildingName} ${floor.label}`,
        building: buildingName,
        floor: floor.label,
        category: "건물 내부",
        aliases: [buildingName, floor.label],
        description: floor.items.join(", "),
        floorItems: floor.items,
        point: building.point,
        sourceUrl: building.url,
      });
    }
  }

  const placeDraftPath = path.join(outDir, "places.draft.json");
  await writeFile(
    placeDraftPath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        note:
          "building entries include map coordinates when available; verify and adjust before production use.",
        places: placeDraft,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );

  console.log(`[floors] Done: ${floorsPath}`);
  console.log(`[floors] Draft places: ${placeDraftPath}`);
}

main().catch((error) => {
  console.error("[floors] Fatal error:", error);
  process.exitCode = 1;
});
