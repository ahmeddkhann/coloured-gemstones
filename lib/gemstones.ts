import "server-only";

import { GEMSTONE_TYPES } from "@/lib/constants";
import { connectDB } from "@/lib/mongodb";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { serializeDoc } from "@/lib/serialize";

export const CATALOG_PAGE_SIZE = 10;

export type PublicGemstone = {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  color: string;
  cut: string;
  clarity: string;
  origin: string;
  carat: number;
  price: number;
  stock: number;
  featured: boolean;
  images: { url: string; publicId: string }[];
};

export type GemstoneSort = "featured" | "price-asc" | "price-desc";

export type GemstoneListFilters = {
  page?: number;
  limit?: number;
  type?: string;
  color?: string;
  sort?: GemstoneSort | string;
};

function buildFilter(filters: GemstoneListFilters) {
  const query: Record<string, unknown> = {};
  if (
    filters.type &&
    (GEMSTONE_TYPES as readonly string[]).includes(filters.type)
  ) {
    query.type = filters.type;
  }
  if (filters.color?.trim()) {
    query.color = new RegExp(
      `^${escapeRegex(filters.color.trim())}$`,
      "i",
    );
  }
  return query;
}

function buildSort(sort?: string): Record<string, 1 | -1> {
  if (sort === "price-asc") {
    return { price: 1 };
  }
  if (sort === "price-desc") {
    return { price: -1 };
  }
  return { featured: -1, createdAt: -1 };
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function parseGemstoneSort(value?: string | null): GemstoneSort {
  if (value === "price-asc" || value === "price-desc") {
    return value;
  }
  return "featured";
}

export async function getGemstonesPage(filters: GemstoneListFilters = {}) {
  const safePage = Math.max(1, Math.floor(filters.page ?? 1) || 1);
  const safeLimit = Math.min(
    500,
    Math.max(1, Math.floor(filters.limit ?? CATALOG_PAGE_SIZE) || CATALOG_PAGE_SIZE),
  );
  const skip = (safePage - 1) * safeLimit;
  const query = buildFilter(filters);
  const sort = buildSort(filters.sort);

  await connectDB();

  const [docs, total] = await Promise.all([
    GemstoneModel.find(query).sort(sort).skip(skip).limit(safeLimit),
    GemstoneModel.countDocuments(query),
  ]);

  return {
    items: docs.map((doc) => serializeDoc(doc) as PublicGemstone),
    page: safePage,
    limit: safeLimit,
    total,
    hasMore: skip + docs.length < total,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}

export async function getGemstoneFilterOptions() {
  await connectDB();
  const colors = (await GemstoneModel.distinct("color"))
    .map((color) => String(color).trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

  return {
    types: [...GEMSTONE_TYPES],
    colors,
  };
}

export async function getGemstoneBySlug(slug: string) {
  await connectDB();
  const doc = await GemstoneModel.findOne({ slug });
  if (!doc) {
    return null;
  }
  return serializeDoc(doc) as PublicGemstone;
}

export function buildCatalogQuery(params: {
  page?: number;
  type?: string;
  color?: string;
  sort?: string;
}) {
  const search = new URLSearchParams();
  if (params.page && params.page > 1) {
    search.set("page", String(params.page));
  }
  if (params.type) {
    search.set("type", params.type);
  }
  if (params.color) {
    search.set("color", params.color);
  }
  if (params.sort && params.sort !== "featured") {
    search.set("sort", params.sort);
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
