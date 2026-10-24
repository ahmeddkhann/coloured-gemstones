import mongoose, { isValidObjectId } from "mongoose";

import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { ORDER_STATUSES } from "@/lib/constants";
import {
  sendNewOrderToAdmin,
  sendOrderReceivedToCustomer,
} from "@/lib/mail";
import { connectDB } from "@/lib/mongodb";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { OrderModel } from "@/lib/models/Order";
import { nextOrderNumber } from "@/lib/order-number";
import { requireAdmin } from "@/lib/require-admin";
import { serializeDoc } from "@/lib/serialize";
import { checkoutSchema } from "@/lib/validations";

export async function GET(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return auth.error;
    }

    await connectDB();
    const status = new URL(request.url).searchParams.get("status");
    const filter: Record<string, unknown> = {};
    if (status && (ORDER_STATUSES as readonly string[]).includes(status)) {
      filter.status = status;
    }

    const orders = await OrderModel.find(filter).sort({ createdAt: -1 });
    return jsonOk(orders.map(serializeDoc));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    await connectDB();

    const items: Array<{
      gemstoneId: mongoose.Types.ObjectId;
      name: string;
      slug: string;
      price: number;
      quantity: number;
      image: string;
    }> = [];
    let subtotal = 0;

    for (const line of parsed.data.items) {
      if (!isValidObjectId(line.gemstoneId)) {
        return jsonError("One of the items is invalid.", 400);
      }

      const stone = await GemstoneModel.findById(line.gemstoneId);
      if (!stone) {
        return jsonError("A gemstone in the cart is no longer available.", 400);
      }
      if (stone.stock < line.quantity) {
        return jsonError(`${stone.name} does not have enough stock.`, 400);
      }

      items.push({
        gemstoneId: stone._id,
        name: stone.name,
        slug: stone.slug,
        price: stone.price,
        quantity: line.quantity,
        image: stone.images[0]?.url ?? "",
      });
      subtotal += stone.price * line.quantity;
    }

    const orderNumber = await nextOrderNumber();

    try {
      await mongoose.connection.transaction(async (session) => {
        for (const item of items) {
          const updated = await GemstoneModel.findOneAndUpdate(
            { _id: item.gemstoneId, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { session, returnDocument: "after" },
          );
          if (!updated) {
            throw new Error("STOCK");
          }
        }

        await OrderModel.create(
          [
            {
              orderNumber,
              customer: parsed.data.customer,
              items,
              subtotal,
              status: "pending",
              paymentMethod: "cod",
              statusHistory: [{ status: "pending", at: new Date() }],
              stockRestored: false,
            },
          ],
          { session },
        );
      });
    } catch (error) {
      if (error instanceof Error && error.message === "STOCK") {
        return jsonError("Stock changed. Please review your cart.", 409);
      }
      throw error;
    }

    const order = await OrderModel.findOne({ orderNumber });
    if (!order) {
      return jsonError("Order could not be created.", 500);
    }

    const mailPayload = {
      orderNumber: order.orderNumber,
      customer: parsed.data.customer,
      items: items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      subtotal,
      status: "pending" as const,
    };

    await Promise.allSettled([
      sendOrderReceivedToCustomer(mailPayload),
      sendNewOrderToAdmin(mailPayload),
    ]);

    return jsonOk({ orderNumber: order.orderNumber, id: order._id.toString() }, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
