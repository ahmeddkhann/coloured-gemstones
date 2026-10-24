import { OrderModel } from "@/lib/models/Order";

export async function nextOrderNumber() {
  const day = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  const prefix = `CG-${day}-`;
  const latest = await OrderModel.findOne({
    orderNumber: new RegExp(`^${prefix}`),
  })
    .sort({ orderNumber: -1 })
    .lean();

  const current = latest?.orderNumber
    ? Number(latest.orderNumber.slice(prefix.length))
    : 0;

  return `${prefix}${String(current + 1).padStart(4, "0")}`;
}
