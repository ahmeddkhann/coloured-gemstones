import { isValidObjectId } from "mongoose";

import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { PriceHistoryModel } from "@/lib/models/PriceHistory";
import { requireAdmin } from "@/lib/require-admin";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return auth.error;
    }

    const url = new URL(request.url);
    const gemstoneIdsParam = url.searchParams.get("gemstoneIds") ?? "";
    const fromParam = url.searchParams.get("from");
    const toParam = url.searchParams.get("to");

    const gemstoneIds = gemstoneIdsParam
      .split(",")
      .map((id) => id.trim())
      .filter((id) => isValidObjectId(id));

    const filter: Record<string, unknown> = {};
    if (gemstoneIds.length > 0) {
      filter.gemstoneId = { $in: gemstoneIds };
    }

    if (fromParam || toParam) {
      const changedAt: Record<string, Date> = {};
      if (fromParam) {
        const from = new Date(fromParam);
        if (Number.isNaN(from.getTime())) {
          return jsonError("Invalid from date.", 400);
        }
        changedAt.$gte = from;
      }
      if (toParam) {
        const to = new Date(toParam);
        if (Number.isNaN(to.getTime())) {
          return jsonError("Invalid to date.", 400);
        }
        changedAt.$lte = to;
      }
      filter.changedAt = changedAt;
    }

    await connectDB();
    const history = await PriceHistoryModel.find(filter)
      .sort({ changedAt: 1 })
      .lean();

    const ids = [
      ...new Set(history.map((row) => String(row.gemstoneId))),
    ];
    const stones = ids.length
      ? await GemstoneModel.find({ _id: { $in: ids } }).select("name").lean()
      : [];
    const nameById = new Map(
      stones.map((stone) => [String(stone._id), stone.name]),
    );

    return jsonOk(
      history.map((row) => ({
        id: String(row._id),
        gemstoneId: String(row.gemstoneId),
        gemstoneName: nameById.get(String(row.gemstoneId)) ?? "Gemstone",
        oldPrice: row.oldPrice,
        newPrice: row.newPrice,
        changedAt: row.changedAt,
      })),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
