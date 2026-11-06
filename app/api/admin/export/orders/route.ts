import { handleRouteError } from "@/lib/api";
import { csvResponse, toCsv } from "@/lib/csv";
import { connectDB } from "@/lib/mongodb";
import { OrderModel } from "@/lib/models/Order";
import { requireAdmin } from "@/lib/require-admin";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return auth.error;
    }

    await connectDB();
    const orders = await OrderModel.find().sort({ createdAt: -1 }).lean();

    const headers = [
      "orderNumber",
      "status",
      "paymentMethod",
      "subtotal",
      "customerName",
      "customerEmail",
      "customerPhone",
      "customerAddress",
      "items",
      "createdAt",
    ];

    const rows = orders.map((order) => [
      order.orderNumber,
      order.status,
      order.paymentMethod,
      order.subtotal,
      order.customer.name,
      order.customer.email,
      order.customer.phone,
      order.customer.address,
      order.items
        .map(
          (item: { name: string; quantity: number; price: number }) =>
            `${item.name} x${item.quantity} @ ${item.price}`,
        )
        .join("; "),
      order.createdAt ? new Date(order.createdAt).toISOString() : "",
    ]);

    return csvResponse(
      `orders-${new Date().toISOString().slice(0, 10)}.csv`,
      toCsv(headers, rows),
    );
  } catch (error) {
    return handleRouteError(error);
  }
}
