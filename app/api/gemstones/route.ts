import { handleRouteError, jsonOk, readJson, zodError } from "@/lib/api";
import { GEMSTONE_TYPES } from "@/lib/constants";
import { connectDB } from "@/lib/mongodb";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { requireAdmin } from "@/lib/require-admin";
import { serializeDoc } from "@/lib/serialize";
import { uniqueGemstoneSlug } from "@/lib/slug";
import { createGemstoneSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const featured = searchParams.get("featured");
    const type = searchParams.get("type");
    const q = searchParams.get("q");
    const inStock = searchParams.get("inStock");

    const filter: Record<string, unknown> = {};

    if (featured === "true") {
      filter.featured = true;
    }
    if (type && (GEMSTONE_TYPES as readonly string[]).includes(type)) {
      filter.type = type;
    }
    if (inStock === "true") {
      filter.stock = { $gt: 0 };
    }
    if (q) {
      filter.$text = { $search: q };
    }

    const gemstones = await GemstoneModel.find(filter).sort({ createdAt: -1 });
    return jsonOk(gemstones.map(serializeDoc));
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
