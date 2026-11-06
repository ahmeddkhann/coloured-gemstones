import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { formatPrice } from "@/lib/currency";
import { getCustomerSession } from "@/lib/customer-auth";
import { connectDB } from "@/lib/mongodb";
import { OrderModel } from "@/lib/models/Order";
import { serializeDoc } from "@/lib/serialize";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  createdAt?: string | Date;
  items: Array<{ name: string; quantity: number }>;
};

async function AccountOrders() {
  const session = await getCustomerSession();
  if (!session) {
    redirect("/account/login");
  }

  await connectDB();
  const docs = await OrderModel.find({
    $or: [
      { customerId: session.customerId },
      { "customer.email": session.email },
    ],
  }).sort({ createdAt: -1 });

  const orders = docs.map((doc) => serializeDoc(doc) as OrderRow);

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
          Orders
        </p>
        <h2 className="font-serif text-2xl leading-snug text-jewel sm:text-3xl">
          Your orders
        </h2>
      </header>

      {orders.length === 0 ? (
        <p className="text-sm leading-relaxed text-ink-soft">
          You have not placed any orders yet.
        </p>
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border border-gold/20 bg-card p-5"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 space-y-1.5">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="block truncate font-serif text-lg text-jewel hover:underline sm:text-xl"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs capitalize leading-relaxed text-ink-soft">
                    {order.status}
                    {order.createdAt
                      ? ` · ${new Date(order.createdAt).toLocaleDateString()}`
                      : ""}
                  </p>
                  <p className="break-words text-sm leading-relaxed text-ink-soft">
                    {order.items
                      .map((item) => `${item.name} × ${item.quantity}`)
                      .join(", ")}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium text-jewel">
                  {formatPrice(order.subtotal)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

export default function AccountOrdersPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-ink-soft">Loading orders…</p>}
    >
      <AccountOrders />
    </Suspense>
  );
}
