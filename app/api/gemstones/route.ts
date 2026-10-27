import { handleRouteError, jsonOk, readJson, zodError } from "@/lib/api";
import {
  CATALOG_PAGE_SIZE,
  getGemstonesPage,
  parseGemstoneSort,
} from "@/lib/gemstones";
import { requireAdmin } from "@/lib/require-admin";
import { uniqueGemstoneSlug } from "@/lib/slug";
import { connectDB } from "@/lib/mongodb";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { serializeDoc } from "@/lib/serialize";
import { createGemstoneSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");
    const type = searchParams.get("type") ?? undefined;
    const color = searchParams.get("color") ?? undefined;
    const q = searchParams.get("q");
    const inStock = searchParams.get("inStock");
    const sort = parseGemstoneSort(searchParams.get("sort"));
    const pageParam = Number(searchParams.get("page") ?? "1");
    const limitParam = Number(
      searchParams.get("limit") ?? String(CATALOG_PAGE_SIZE),
    );
    const page = Math.max(1, Number.isFinite(pageParam) ? Math.floor(pageParam) : 1);
    const limit = Math.min(
      50,
      Math.max(
        1,
        Number.isFinite(limitParam) ? Math.floor(limitParam) : CATALOG_PAGE_SIZE,
      ),
    );

    // Text / featured / inStock stay on the API for advanced callers;
    // catalog UI uses type, color, and sort via getGemstonesPage.
    if (featured === "true" || inStock === "true" || q) {
      await connectDB();
      const filter: Record<string, unknown> = {};
      if (featured === "true") {
        filter.featured = true;
      }
      if (type) {
        filter.type = type;
      }
      if (color?.trim()) {
        filter.color = new RegExp(
          `^${color.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i",
        );
      }
      if (inStock === "true") {
        filter.stock = { $gt: 0 };
      }
      if (q) {
        filter.$text = { $search: q };
      }
      const skip = (page - 1) * limit;
      const sortSpec: Record<string, 1 | -1> =
        sort === "price-asc"
          ? { price: 1 }
          : sort === "price-desc"
            ? { price: -1 }
            : { featured: -1, createdAt: -1 };
      const [gemstones, total] = await Promise.all([
        GemstoneModel.find(filter).sort(sortSpec).skip(skip).limit(limit),
        GemstoneModel.countDocuments(filter),
      ]);
      return jsonOk({
        items: gemstones.map(serializeDoc),
        page,
        limit,
        total,
        hasMore: skip + gemstones.length < total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      });
    }

    const result = await getGemstonesPage({ page, limit, type, color, sort });
    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return auth.error;
    }

    const body = await readJson(request);
    const parsed = createGemstoneSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    await connectDB();
    const slug = await uniqueGemstoneSlug(parsed.data.name);
    const gemstone = await GemstoneModel.create({ ...parsed.data, slug });
    return jsonOk(serializeDoc(gemstone), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
