import type { CatalogStoneForAi } from "@/lib/chat/catalog-for-ai";

export type PreferenceInput = {
  types: string[];
  colours: string[];
  budget: string;
  occasion: string;
  caratFeel: string;
  notes?: string;
};

/** Stones need at least this many preference hits to be recommended. */
export const MIN_PREFERENCE_MATCHES = 2;

export type PreferenceDimension =
  | "type"
  | "colour"
  | "budget"
  | "occasion"
  | "carat"
  | "notes";

export type ScoredStone = {
  stone: CatalogStoneForAi;
  score: number;
  matched: PreferenceDimension[];
};

const OCCASION_HINTS: Record<string, string[]> = {
  engagement: [
    "sapphire",
    "ruby",
    "emerald",
    "diamond",
    "ring",
    "bridal",
    "engagement",
  ],
  gift: ["gift", "present", "sapphire", "ruby", "emerald", "tourmaline", "spinel"],
  collection: [
    "collection",
    "rare",
    "paraiba",
    "padparadscha",
    "alexandrite",
    "museum",
  ],
  everyday: ["everyday", "wear", "sapphire", "ruby", "spinel", "garnet", "durable"],
  investment: [
    "investment",
    "paraiba",
    "padparadscha",
    "alexandrite",
    "burma",
    "kashmir",
    "mozambique",
  ],
};

function norm(value: string) {
  return value.trim().toLowerCase();
}

function stoneHaystack(stone: CatalogStoneForAi) {
  return norm(
    [stone.name, stone.type, stone.color, stone.cut, stone.origin, stone.clarity].join(
      " ",
    ),
  );
}

function matchesBudget(price: number, budget: string): boolean {
  switch (budget) {
    case "under-1k":
      return price < 1000;
    case "1k-5k":
      return price >= 1000 && price < 5000;
    case "5k-25k":
      return price >= 5000 && price < 25000;
    case "25k-plus":
      return price >= 25000;
    default:
      return false;
  }
}

function matchesCaratFeel(carat: number, feel: string): boolean {
  switch (feel) {
    case "delicate":
      return carat > 0 && carat < 1.5;
    case "medium":
      return carat >= 1.5 && carat <= 4;
    case "statement":
      return carat > 4;
    default:
      return false;
  }
}

function matchesOccasion(stone: CatalogStoneForAi, occasion: string): boolean {
  const hints = OCCASION_HINTS[occasion];
  if (!hints?.length) {
    return false;
  }
  const hay = stoneHaystack(stone);
  return hints.some((hint) => hay.includes(hint));
}

function matchesNotes(stone: CatalogStoneForAi, notes: string): boolean {
  const tokens = notes
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 3);
  if (tokens.length === 0) {
    return false;
  }
  const hay = stoneHaystack(stone);
  return tokens.some((token) => hay.includes(token));
}

/** Preferences the shopper actually set (excludes empty / "any"). */
export function activePreferenceDimensions(
  preferences: PreferenceInput,
): PreferenceDimension[] {
  const active: PreferenceDimension[] = [];
  if (preferences.types.length > 0) active.push("type");
  if (preferences.colours.some((c) => c.trim())) active.push("colour");
  if (preferences.budget !== "any") active.push("budget");
  if (preferences.occasion !== "any") active.push("occasion");
  if (preferences.caratFeel !== "any") active.push("carat");
  if (preferences.notes?.trim()) active.push("notes");
  return active;
}

export function scoreStoneAgainstPreferences(
  stone: CatalogStoneForAi,
  preferences: PreferenceInput,
): ScoredStone {
  const matched: PreferenceDimension[] = [];
  const hay = stoneHaystack(stone);

  if (preferences.types.length > 0) {
    const typeNorm = norm(stone.type);
    const hit = preferences.types.some((type) => {
      const t = norm(type);
      return typeNorm === t || typeNorm.includes(t) || t.includes(typeNorm);
    });
    if (hit) matched.push("type");
  }

  const colours = preferences.colours.map(norm).filter(Boolean);
  if (colours.length > 0) {
    const colorNorm = norm(stone.color);
    const hit = colours.some(
      (colour) =>
        colorNorm.includes(colour) ||
        colour.includes(colorNorm) ||
        hay.includes(colour),
    );
    if (hit) matched.push("colour");
  }

  if (preferences.budget !== "any" && matchesBudget(stone.price, preferences.budget)) {
    matched.push("budget");
  }

  if (
    preferences.occasion !== "any" &&
    matchesOccasion(stone, preferences.occasion)
  ) {
    matched.push("occasion");
  }

  if (
    preferences.caratFeel !== "any" &&
    matchesCaratFeel(stone.carat, preferences.caratFeel)
  ) {
    matched.push("carat");
  }

  if (preferences.notes?.trim() && matchesNotes(stone, preferences.notes)) {
    matched.push("notes");
  }

  return { stone, score: matched.length, matched };
}

/**
 * Recommend stones with ≥ MIN_PREFERENCE_MATCHES hits.
 * Keep only the highest score; if several stones share that top score, return all of them.
 */
export function pickRecommendationsByPreferenceScore(
  catalog: CatalogStoneForAi[],
  preferences: PreferenceInput,
): {
  winners: ScoredStone[];
  active: PreferenceDimension[];
  maxScore: number;
} {
  const active = activePreferenceDimensions(preferences);
  if (active.length < MIN_PREFERENCE_MATCHES) {
    return { winners: [], active, maxScore: 0 };
  }

  const scored = catalog
    .map((stone) => scoreStoneAgainstPreferences(stone, preferences))
    .filter((entry) => entry.score >= MIN_PREFERENCE_MATCHES);

  if (scored.length === 0) {
    return { winners: [], active, maxScore: 0 };
  }

  const maxScore = Math.max(...scored.map((entry) => entry.score));
  const winners = scored
    .filter((entry) => entry.score === maxScore)
    .sort((a, b) => a.stone.name.localeCompare(b.stone.name));

  return { winners, active, maxScore };
}

export function buildMatchReason(
  winners: ScoredStone[],
  active: PreferenceDimension[],
  maxScore: number,
): string {
  if (active.length < MIN_PREFERENCE_MATCHES) {
    return `Please set at least ${MIN_PREFERENCE_MATCHES} preferences (for example type and colour, or budget and size) so we can shortlist stones.`;
  }

  if (winners.length === 0) {
    return `No in-stock stone matched ${MIN_PREFERENCE_MATCHES} or more of your preferences. Try broadening type, colour, budget, or size.`;
  }

  const labels = winners[0]?.matched.join(", ") ?? "your preferences";
  if (winners.length === 1) {
    return `Best match: ${winners[0].stone.name} — matched ${maxScore} preferences (${labels}).`;
  }

  return `Top matches tied on ${maxScore} preferences (${labels}) — showing all ${winners.length} equal best fits.`;
}
