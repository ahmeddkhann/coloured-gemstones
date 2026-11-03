import "server-only";

import { connectDB } from "@/lib/mongodb";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { getGemstoneBySlug, type PublicGemstone } from "@/lib/gemstones";

export type CatalogStoneForAi = {
  id: string;
  slug: string;
  name: string;
  type: string;
  color: string;
  cut: string;
  clarity: string;
  origin: string;
  carat: number;
  price: number;
  stock: number;
};

export async function getInStockCatalogForAi(): Promise<CatalogStoneForAi[]> {
  await connectDB();
  const docs = await GemstoneModel.find({ stock: { $gt: 0 } })
    .select("name slug type color cut clarity origin carat price stock")
    .sort({ featured: -1, createdAt: -1 })
    .limit(80);

  return docs.map((doc) => {
    const raw = doc.toObject() as {
      _id: { toString(): string };
      name: string;
      slug: string;
      type: string;
      color: string;
      cut: string;
      clarity: string;
      origin: string;
      carat: number;
      price: number;
      stock: number;
    };
    return {
      id: raw._id.toString(),
      slug: raw.slug,
      name: raw.name,
      type: raw.type,
      color: raw.color,
      cut: raw.cut,
      clarity: raw.clarity,
      origin: raw.origin,
      carat: raw.carat,
      price: raw.price,
      stock: raw.stock,
    };
  });
}

export function formatCatalogForPrompt(stones: CatalogStoneForAi[]): string {
  if (stones.length === 0) {
    return "(No in-stock gemstones are listed right now.)";
  }

  return stones
    .map(
      (stone, index) =>
        `${index + 1}. slug=${stone.slug} | ${stone.name} | type=${stone.type} | colour=${stone.color} | cut=${stone.cut} | ${stone.carat}ct | price=${stone.price} | stock=${stone.stock} | origin=${stone.origin}`,
    )
    .join("\n");
}

export async function hydrateGemstonesBySlugs(
  slugs: string[],
): Promise<PublicGemstone[]> {
  const unique = [...new Set(slugs.map((slug) => slug.trim()).filter(Boolean))];
  const items: PublicGemstone[] = [];

  for (const slug of unique) {
    const stone = await getGemstoneBySlug(slug);
    if (stone && stone.stock > 0) {
      items.push(stone);
    }
  }

  return items;
}
