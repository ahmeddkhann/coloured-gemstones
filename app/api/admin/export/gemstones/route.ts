import { handleRouteError } from "@/lib/api";
import { csvResponse, toCsv } from "@/lib/csv";
import { connectDB } from "@/lib/mongodb";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return auth.error;
    }

    await connectDB();
    const stones = await GemstoneModel.find().sort({ createdAt: -1 }).lean();

    const headers = [
      "id",
      "name",
      "slug",
      "type",
      "color",
      "cut",
      "clarity",
      "origin",
      "carat",
      "price",
      "stock",
      "featured",
      "createdAt",
      "updatedAt",
    ];

    const rows = stones.map((stone) => [
      String(stone._id),
      stone.name,
      stone.slug,
      stone.type,
      stone.color,
      stone.cut,
      stone.clarity,
      stone.origin,
      stone.carat,
      stone.price,
      stone.stock,
      stone.featured ? "yes" : "no",
      stone.createdAt ? new Date(stone.createdAt).toISOString() : "",
      stone.updatedAt ? new Date(stone.updatedAt).toISOString() : "",
    ]);

    return csvResponse(
      `gemstones-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(headers, rows),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
