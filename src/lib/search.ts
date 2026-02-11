import type { CampusPlace } from "./types";

const normalize = (text: string) => text.trim().toLowerCase().replace(/\s+/g, "");
const NO_MATCH_SCORE = 999;
const ROOM_NUMBER_PAREN_PATTERN = /\(\s*\d+\s*호\s*\)$/u;

const GENERIC_DETAIL_TERMS = new Set(
  [
    "강의실",
    "대강의실",
    "중강의실",
    "소강의실",
    "세미나실",
    "실습실",
    "실험실",
    "주차장",
    "자료실",
    "학생공간",
    "각 동아리방",
    "휴게실",
  ].map(normalize),
);

type MatchField = {
  text: string;
  baseScore: number;
};

type InternalDetail = {
  title: string;
  aliases: string[];
};

type SearchCandidate = {
  key: string;
  place: CampusPlace;
  title: string;
  subtitle: string;
  fields: MatchField[];
  scoreOffset?: number;
};

export type PlaceSearchResult = {
  key: string;
  place: CampusPlace;
  title: string;
  subtitle: string;
};

function formatLocation(place: CampusPlace): string {
  return place.floor ? `${place.building} ${place.floor}` : place.building;
}

function cleanDetailText(text: string): string {
  return text
    .replace(/^\s*(지하\s*\d+층|B\s*\d+|\d+\s*층)\s*:\s*/iu, "")
    .replace(/[•●◦▪◆◇▶▷►]/g, " ")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitOutsideParentheses(text: string, separators: Set<string>): string[] {
  const output: string[] = [];
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
      const normalized = cleanDetailText(token);
      if (normalized) output.push(normalized);
      token = "";
      continue;
    }

    token += ch;
  }

  const normalized = cleanDetailText(token);
  if (normalized) output.push(normalized);

  return output;
}

function normalizeItemText(item: string): string {
  return cleanDetailText(item)
    .replace(/^[-–—•●◦▪◆◇▶▷►\s]+/, "")
    .replace(/[.;,]$/g, "")
    .trim();
}

function splitDetailItems(description: string): string[] {
  const normalized = cleanDetailText(description);
  if (!normalized) return [];

  const primarySplit = splitOutsideParentheses(normalized, new Set(["|", "/"]));
  const results: string[] = [];
  const englishCommaList = /^[A-Za-z0-9&().\-\s]+[,，]\s*[A-Za-z0-9&().\-\s]+$/;

  for (const item of primarySplit) {
    const trimmed = normalizeItemText(item);
    if (!trimmed) continue;

    const hasComma = /[,，]/.test(trimmed);
    if (hasComma && !englishCommaList.test(trimmed)) {
      const commaSplit = splitOutsideParentheses(trimmed, new Set([",", "，"]))
        .map((value) => normalizeItemText(value))
        .filter(Boolean);

      if (commaSplit.length >= 2) {
        results.push(...commaSplit);
        continue;
      }
    }

    results.push(trimmed);
  }

  return results;
}

function isGenericDetailTerm(value: string): boolean {
  return GENERIC_DETAIL_TERMS.has(normalize(value));
}

function toDisplayTitle(rawItem: string): string {
  const cleaned = normalizeItemText(rawItem);
  if (ROOM_NUMBER_PAREN_PATTERN.test(cleaned)) {
    return cleaned.replace(ROOM_NUMBER_PAREN_PATTERN, "").trim();
  }
  return cleaned;
}

function buildDetailAliases(rawItem: string, title: string): string[] {
  const aliasSet = new Set<string>();
  const cleanedRaw = normalizeItemText(rawItem);
  const noParen = cleanedRaw.replace(/\([^)]*\)/g, "").replace(/\s+/g, " ").trim();

  if (cleanedRaw) aliasSet.add(cleanedRaw);
  if (title) aliasSet.add(title);
  if (noParen) aliasSet.add(noParen);

  return Array.from(aliasSet).filter((alias) => alias.length >= 2);
}

function extractInternalDetails(description?: string): InternalDetail[] {
  if (!description) return [];

  const detailMap = new Map<string, InternalDetail>();
  const parts = splitDetailItems(description);

  for (const rawItem of parts) {
    const title = toDisplayTitle(rawItem);
    if (!title || title.length < 2) continue;
    if (isGenericDetailTerm(title)) continue;

    const aliases = buildDetailAliases(rawItem, title);
    if (aliases.length === 0) continue;

    const key = normalize(title);
    const existing = detailMap.get(key);
    if (existing) {
      existing.aliases = Array.from(new Set([...existing.aliases, ...aliases]));
      continue;
    }

    detailMap.set(key, { title, aliases });
  }

  return Array.from(detailMap.values());
}

function buildDetailIndex(list: CampusPlace[]): {
  detailsByPlaceId: Map<string, InternalDetail[]>;
  detailFrequency: Map<string, number>;
} {
  const detailsByPlaceId = new Map<string, InternalDetail[]>();
  const detailFrequency = new Map<string, number>();

  list.forEach((place) => {
    if (place.category !== "건물 내부") return;

    const details = extractInternalDetails(place.description);
    detailsByPlaceId.set(place.id, details);

    details.forEach((detail) => {
      const key = normalize(detail.title);
      detailFrequency.set(key, (detailFrequency.get(key) ?? 0) + 1);
    });
  });

  return { detailsByPlaceId, detailFrequency };
}

function detailScoreOffset(title: string, frequencyMap: Map<string, number>): number {
  const count = frequencyMap.get(normalize(title)) ?? 1;
  if (count >= 5) return 2;
  if (count >= 3) return 1;
  return 0;
}

function buildBaseCandidate(place: CampusPlace): SearchCandidate {
  return {
    key: place.id,
    place,
    title: place.name,
    subtitle: `${formatLocation(place)} · ${place.category}`,
    fields: [
      { text: place.name, baseScore: 0 },
      ...place.aliases.map((alias) => ({ text: alias, baseScore: 2 })),
      { text: formatLocation(place), baseScore: 4 },
      { text: place.category, baseScore: 6 },
      { text: place.description ?? "", baseScore: 10 },
    ],
  };
}

function buildInternalDetailCandidates(
  place: CampusPlace,
  detailsByPlaceId: Map<string, InternalDetail[]>,
  frequencyMap: Map<string, number>,
): SearchCandidate[] {
  if (place.category !== "건물 내부") return [];

  const details = detailsByPlaceId.get(place.id) ?? [];
  const location = formatLocation(place);

  return details.map((detail, index) => ({
    key: `${place.id}::detail::${index}`,
    place,
    title: detail.title,
    subtitle: location,
    scoreOffset: detailScoreOffset(detail.title, frequencyMap),
    fields: [
      { text: detail.title, baseScore: 1 },
      ...detail.aliases.map((alias) => ({ text: alias, baseScore: 2 })),
      { text: location, baseScore: 5 },
      { text: place.name, baseScore: 5 },
      ...place.aliases.map((alias) => ({ text: alias, baseScore: 6 })),
    ],
  }));
}

function scoreField(normalizedValue: string, query: string, baseScore: number): number {
  if (!normalizedValue) return NO_MATCH_SCORE;
  if (normalizedValue === query) return baseScore;
  if (normalizedValue.startsWith(query)) return baseScore + 1;
  if (normalizedValue.includes(query)) return baseScore + 2;
  return NO_MATCH_SCORE;
}

function scoreCandidate(candidate: SearchCandidate, query: string): number {
  const baseScore = candidate.fields.reduce((best, field) => {
    const next = scoreField(normalize(field.text), query, field.baseScore);
    return Math.min(best, next);
  }, NO_MATCH_SCORE);

  if (baseScore >= NO_MATCH_SCORE) return baseScore;
  return baseScore + (candidate.scoreOffset ?? 0);
}

export function searchPlaces(query: string, list: CampusPlace[]): PlaceSearchResult[] {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  const { detailsByPlaceId, detailFrequency } = buildDetailIndex(list);

  const candidates = list.flatMap((place) => [
    buildBaseCandidate(place),
    ...buildInternalDetailCandidates(place, detailsByPlaceId, detailFrequency),
  ]);

  return candidates
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(candidate, normalizedQuery),
    }))
    .filter(({ score }) => score < NO_MATCH_SCORE)
    .sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score;
      if (a.candidate.title !== b.candidate.title) {
        return a.candidate.title.localeCompare(b.candidate.title, "ko");
      }
      return a.candidate.place.name.localeCompare(b.candidate.place.name, "ko");
    })
    .map(({ candidate }) => ({
      key: candidate.key,
      place: candidate.place,
      title: candidate.title,
      subtitle: candidate.subtitle,
    }))
    .slice(0, 20);
}
