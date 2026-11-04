import "server-only";

import {
  formatCatalogForPrompt,
  getInStockCatalogForAi,
  hydrateGemstonesBySlugs,
  type CatalogStoneForAi,
} from "@/lib/chat/catalog-for-ai";
import {
  MIN_PREFERENCE_MATCHES,
  buildMatchReason,
  pickRecommendationsByPreferenceScore,
} from "@/lib/chat/preference-score";
import { getRagContext } from "@/lib/chat/rag";
import { chatWithGroq, type GroqChatMessage } from "@/lib/groq";
import type { PublicGemstone } from "@/lib/gemstones";

export type RecommendPreferences = {
  types: string[];
  colours: string[];
  budget: string;
  occasion: string;
  caratFeel: string;
  notes?: string;
};

const REASON_SYSTEM_PROMPT = `You are the catalogue recommender for Coloured Gemstones.

RULES
- The shortlist slugs are already chosen by preference matching. Do NOT change or invent slugs.
- Return JSON only, no markdown fences: {"reason":"...","questions":["..."]}
- "reason" is a short British-English explanation for why these stones fit (mention matched preferences).
- "questions" is optional (0–2 short follow-up preference questions).
- If the shortlist is empty, explain briefly how to broaden preferences.`;

function parseReasonJson(raw: string): {
  reason: string;
  questions: string[];
} {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const jsonText =
    start >= 0 && end > start ? raw.slice(start, end + 1) : raw;

  const parsed = JSON.parse(jsonText) as {
    reason?: unknown;
    questions?: unknown;
  };

  const reason =
    typeof parsed.reason === "string" && parsed.reason.trim()
      ? parsed.reason.trim()
      : "";
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions
        .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
        .slice(0, 2)
    : [];

  return { reason, questions };
}

async function polishReasonWithGroq(input: {
  preferences: RecommendPreferences;
  winners: Array<{
    slug: string;
    name: string;
    score: number;
    matched: string[];
  }>;
  fallbackReason: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  catalog: CatalogStoneForAi[];
  signal?: AbortSignal;
}): Promise<{ reason: string; questions: string[] }> {
  if (!process.env.GROQ_API_KEY?.trim()) {
    return { reason: input.fallbackReason, questions: [] };
  }

  try {
    const ragContext = await getRagContext(
      [
        input.preferences.types.join(" "),
        input.preferences.colours.join(" "),
        input.preferences.budget,
        input.preferences.occasion,
        input.preferences.caratFeel,
        input.preferences.notes ?? "",
        "available gemstones catalogue",
      ].join(" "),
    );

    const messages: GroqChatMessage[] = [
      {
        role: "system",
        content: `${REASON_SYSTEM_PROMPT}\n\nKnowledge context:\n${ragContext.trim() || "(No extra knowledge.)"}\n\nLive in-stock catalogue:\n${formatCatalogForPrompt(input.catalog)}`,
      },
      ...input.history.slice(-8).map((message) => ({
        role: message.role,
        content: message.content,
      })),
      {
        role: "user",
        content: JSON.stringify({
          task: "explain_preference_matches",
          preferences: input.preferences,
          minMatchesRequired: MIN_PREFERENCE_MATCHES,
          shortlist: input.winners,
          fallbackReason: input.fallbackReason,
        }),
      },
    ];

    const raw = await chatWithGroq(messages, { signal: input.signal });
    const polished = parseReasonJson(raw);
    return {
      reason: polished.reason || input.fallbackReason,
      questions: polished.questions,
    };
  } catch (error) {
    console.error("Recommend reason polish failed", error);
    return { reason: input.fallbackReason, questions: [] };
  }
}

/**
 * Recommend by preference score:
 * - Need ≥2 matched preferences to qualify
 * - Highest score wins
 * - If several stones share the top score, recommend all of them
 */
export async function recommendFromPreferences(
  preferences: RecommendPreferences,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
  signal?: AbortSignal,
): Promise<{
  items: PublicGemstone[];
  reason: string;
  questions: string[];
  reply?: string;
  maxScore?: number;
  minMatchesRequired?: number;
}> {
  const catalog: CatalogStoneForAi[] = await getInStockCatalogForAi();

  if (catalog.length === 0) {
    return {
      items: [],
      reason: "We are sourcing new stones right now.",
      questions: [],
      minMatchesRequired: MIN_PREFERENCE_MATCHES,
      maxScore: 0,
    };
  }

  const { winners, active, maxScore } = pickRecommendationsByPreferenceScore(
    catalog,
    preferences,
  );
  const fallbackReason = buildMatchReason(winners, active, maxScore);
  const slugs = winners.map((entry) => entry.stone.slug);
  const items = await hydrateGemstonesBySlugs(slugs);

  const { reason, questions } = await polishReasonWithGroq({
    preferences,
    winners: winners.map((entry) => ({
      slug: entry.stone.slug,
      name: entry.stone.name,
      score: entry.score,
      matched: entry.matched,
    })),
    fallbackReason,
    history,
    catalog,
    signal,
  });

  return {
    items,
    reason: items.length > 0 || winners.length === 0 ? reason : fallbackReason,
    questions,
    maxScore,
    minMatchesRequired: MIN_PREFERENCE_MATCHES,
  };
}
