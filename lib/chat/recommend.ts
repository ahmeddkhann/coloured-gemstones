import "server-only";

import {
  formatCatalogForPrompt,
  getInStockCatalogForAi,
  hydrateGemstonesBySlugs,
  type CatalogStoneForAi,
} from "@/lib/chat/catalog-for-ai";
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

const RECOMMEND_SYSTEM_PROMPT = `You are the catalogue recommender for Coloured Gemstones.

RULES
- Recommend ONLY from the provided live catalogue. Never invent stones, slugs, prices, or stock.
- Return JSON only, no markdown fences: {"slugs":["..."],"reason":"...","questions":["..."]}
- "slugs" must be 1–3 catalogue slugs that best match the shopper preferences. If nothing fits, return an empty slugs array and explain in reason.
- "reason" is a short British-English explanation for the shopper.
- "questions" is optional (0–2 short follow-up preference questions).
- Prefer in-stock stones. Respect budget bands when given.
- If the catalogue is empty, return {"slugs":[],"reason":"We are sourcing new stones right now.","questions":[]}.`;

function parseRecommendJson(raw: string): {
  slugs: string[];
  reason: string;
  questions: string[];
} {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  const jsonText =
    start >= 0 && end > start ? raw.slice(start, end + 1) : raw;

  const parsed = JSON.parse(jsonText) as {
    slugs?: unknown;
    reason?: unknown;
    questions?: unknown;
  };

  const slugs = Array.isArray(parsed.slugs)
    ? parsed.slugs.filter((slug): slug is string => typeof slug === "string")
    : [];
  const reason =
    typeof parsed.reason === "string" && parsed.reason.trim()
      ? parsed.reason.trim()
      : "Here are stones from our catalogue that may suit you.";
  const questions = Array.isArray(parsed.questions)
    ? parsed.questions
        .filter((q): q is string => typeof q === "string" && q.trim().length > 0)
        .slice(0, 2)
    : [];

  return { slugs: slugs.slice(0, 3), reason, questions };
}

export async function recommendFromPreferences(
  preferences: RecommendPreferences,
  history: Array<{ role: "user" | "assistant"; content: string }> = [],
  signal?: AbortSignal,
): Promise<{
  items: PublicGemstone[];
  reason: string;
  questions: string[];
  reply?: string;
}> {
  const catalog: CatalogStoneForAi[] = await getInStockCatalogForAi();
  const allowed = new Set(catalog.map((stone) => stone.slug));
  const liveCatalog = formatCatalogForPrompt(catalog);
  const ragContext = await getRagContext(
    [
      preferences.types.join(" "),
      preferences.colours.join(" "),
      preferences.budget,
      preferences.occasion,
      preferences.caratFeel,
      preferences.notes ?? "",
      "available gemstones catalogue",
    ].join(" "),
  );

  const messages: GroqChatMessage[] = [
    {
      role: "system",
      content: `${RECOMMEND_SYSTEM_PROMPT}\n\nKnowledge context:\n${ragContext.trim() || "(No extra knowledge.)"}\n\nLive in-stock catalogue:\n${liveCatalog}`,
    },
    ...history.slice(-8).map((message) => ({
      role: message.role,
      content: message.content,
    })),
    {
      role: "user",
      content: JSON.stringify({
        task: "recommend_gemstones",
        preferences,
      }),
    },
  ];

  const raw = await chatWithGroq(messages, { signal });

  let recommendation: {
    slugs: string[];
    reason: string;
    questions: string[];
  };
  try {
    recommendation = parseRecommendJson(raw);
  } catch {
    console.error("Recommend JSON parse failed", raw);
    return {
      items: [],
      reason:
        "I could not form a clean shortlist. Try adjusting preferences or ask in chat.",
      questions: [],
      reply: raw.slice(0, 600),
    };
  }

  const validSlugs = recommendation.slugs.filter((slug) => allowed.has(slug));
  const items = await hydrateGemstonesBySlugs(validSlugs);

  return {
    items,
    reason:
      items.length > 0
        ? recommendation.reason
        : catalog.length === 0
          ? "We are sourcing new stones right now."
          : recommendation.reason ||
            "Nothing in stock matched closely — try broader preferences.",
    questions: recommendation.questions,
  };
}
