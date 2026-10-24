import { isValidObjectId } from "mongoose";

import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { sendStatusUpdateToCustomer } from "@/lib/mail";
import { connectDB } from "@/lib/mongodb";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { OrderModel } from "@/lib/models/Order";
import { requireAdmin } from "@/lib/require-admin";
import { serializeDoc } from "@/lib/serialize";
import { updateOrderSchema } from "@/lib/validations";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return auth.error;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return jsonError("Order not found.", 404);
    }

    await connectDB();
    const order = await OrderModel.findById(id);
    if (!order) {
      return jsonError("Order not found.", 404);
    }

    return jsonOk(serializeDoc(order));
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return auth.error;
    }

    const { id } = await params;
    if (!isValidObjectId(id)) {
      return jsonError("Order not found.", 404);
    }

    const body = await readJson(request);
    const parsed = updateOrderSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    await connectDB();
    const order = await OrderModel.findById(id);
    if (!order) {
      return jsonError("Order not found.", 404);
    }

    if (order.status === parsed.data.status) {
      return jsonOk(serializeDoc(order));
    }

    order.status = parsed.data.status;
    order.statusHistory.push({
      status: parsed.data.status,
      note: parsed.data.note,
      at: new Date(),
    });

    if (parsed.data.status === "cancelled" && !order.stockRestored) {
      for (const item of order.items) {
        await GemstoneModel.findByIdAndUpdate(item.gemstoneId, {
          $inc: { stock: item.quantity },
        });
      }
      order.stockRestored = true;
    }

    await order.save();

    await sendStatusUpdateToCustomer(
      {
        orderNumber: order.orderNumber,
        customer: {
          name: order.customer.name,
          email: order.customer.email,
          phone: order.customer.phone,
          address: order.customer.address,
          notes: order.customer.notes,
        },
        items: order.items.map(
          (item: { name: string; quantity: number; price: number }) => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          }),
        ),
        subtotal: order.subtotal,
        status: parsed.data.status,
      },
      parsed.data.status,
    );

    return jsonOk(serializeDoc(order));
  } catch (error) {
    return handleRouteError(error);
  }
}
