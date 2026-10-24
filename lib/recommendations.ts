import "server-only";

import { GemstoneModel } from "@/lib/models/Gemstone";
import { serializeDoc } from "@/lib/serialize";

type CatalogStone = {
  id: string;
  name: string;
  type: string;
  color: string;
  price: number;
  slug: string;
};

function serializeStone(doc: { toObject?: () => unknown }) {
  return serializeDoc(doc) as CatalogStone & Record<string, unknown>;
}

async function fallbackRecommendations(current: {
  _id: { toString(): string };
  type: string;
  price: number;
}) {
  const others = await GemstoneModel.find({
    _id: { $ne: current._id },
    stock: { $gt: 0 },
    $or: [
      { type: current.type },
      {
        price: {
          $gte: current.price * 0.7,
          $lte: current.price * 1.3,
        },
      },
    ],
  }).limit(6);

  return others.slice(0, 3).map(serializeStone);
}

export async function recommendForSlug(slug: string) {
  const current = await GemstoneModel.findOne({ slug });
  if (!current) {
    return null;
  }

  const catalog = await GemstoneModel.find({
    _id: { $ne: current._id },
    stock: { $gt: 0 },
  }).select("name type color price slug");

  const compact: CatalogStone[] = catalog.map((stone) => ({
    id: stone._id.toString(),
    name: stone.name,
    type: stone.type,
    color: stone.color,
    price: stone.price,
    slug: stone.slug,
  }));

  const apiKey = process.env.DEEPSEEK_API_KEY;
  const apiUrl =
    process.env.DEEPSEEK_API_URL ??
    "https://api.deepseek.com/chat/completions";
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  if (!apiKey || compact.length === 0) {
    const items = await fallbackRecommendations(current);
    return { items, reason: "Similar type or price from the catalogue." };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        model,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              'Return JSON only: { "ids": ["..."], "reason": "..." }. Recommend at most 3 ids from the catalogue.',
          },
          {
            role: "user",
            content: JSON.stringify({
              current: {
                name: current.name,
                type: current.type,
                color: current.color,
                cut: current.cut,
                origin: current.origin,
                carat: current.carat,
                price: current.price,
              },
              catalog: compact,
            }),
          },
        ],
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`DeepSeek ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty DeepSeek response");
    }

    const parsed = JSON.parse(content) as { ids?: unknown; reason?: unknown };
    const allowed = new Set(compact.map((stone) => stone.id));
    const ids = Array.isArray(parsed.ids)
      ? parsed.ids.filter((id): id is string => typeof id === "string" && allowed.has(id)).slice(0, 3)
      : [];

    if (ids.length === 0) {
      throw new Error("No valid ids");
    }

    const stones = await GemstoneModel.find({ _id: { $in: ids } });
    const byId = new Map(stones.map((stone) => [stone._id.toString(), stone]));
    const items = ids
      .map((id) => byId.get(id))
      .filter((stone): stone is NonNullable<typeof stone> => Boolean(stone))
      .map(serializeStone);

    return {
      items,
      reason:
        typeof parsed.reason === "string"
          ? parsed.reason
          : "Suggested stones you may also like.",
    };
  } catch (error) {
    console.error("DeepSeek recommendation fallback", error);
    const items = await fallbackRecommendations(current);
    return { items, reason: "Similar type or price from the catalogue." };
  }
}
