import { isValidObjectId } from "mongoose";

import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { OrderModel } from "@/lib/models/Order";
import { ReviewModel } from "@/lib/models/Review";
import { requireCustomer } from "@/lib/require-customer";
import { serializeDoc } from "@/lib/serialize";
import { createReviewSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const auth = await requireCustomer();
    if (auth.error) {
      return auth.error;
    }

    const body = await readJson(request);
    const parsed = createReviewSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    if (
      !isValidObjectId(parsed.data.gemstoneId) ||
      !isValidObjectId(parsed.data.orderId)
    ) {
      return jsonError("Invalid review target.", 400);
    }

    await connectDB();

    const order = await OrderModel.findById(parsed.data.orderId);
    if (!order || order.status !== "delivered") {
      return jsonError("You can only review delivered purchases.", 403);
    }

    const ownsOrder =
      (order.customerId &&
        String(order.customerId) === auth.customer.customerId) ||
      order.customer.email.toLowerCase() === auth.customer.email.toLowerCase();

    if (!ownsOrder) {
      return jsonError("You can only review your own purchases.", 403);
    }

    const purchased = order.items.some(
      (item: { gemstoneId: unknown }) =>
        String(item.gemstoneId) === parsed.data.gemstoneId,
    );
    if (!purchased) {
      return jsonError("That gemstone is not on this order.", 400);
    }

    const existing = await ReviewModel.findOne({
      customerId: auth.customer.customerId,
      gemstoneId: parsed.data.gemstoneId,
    });
    if (existing) {
      return jsonError("You already reviewed this gemstone.", 409);
    }

    const review = await ReviewModel.create({
      customerId: auth.customer.customerId,
      gemstoneId: parsed.data.gemstoneId,
      orderId: parsed.data.orderId,
      rating: parsed.data.rating,
      comment: parsed.data.comment.trim(),
    });

    return jsonOk(serializeDoc(review), 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
