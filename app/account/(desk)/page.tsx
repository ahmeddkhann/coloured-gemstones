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
};

async function AccountOverview() {
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
  })
    .sort({ createdAt: -1 })
    .limit(5);

  const orders = docs.map((doc) => serializeDoc(doc) as OrderRow);

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
          Overview
        </p>
        <h2 className="font-serif text-2xl leading-snug text-jewel sm:text-3xl">
          Welcome back
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
          Track recent orders, leave reviews, and update your details.
        </p>
      </header>

      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h3 className="font-serif text-xl leading-snug text-jewel">
            Recent orders
          </h3>
          <Link
            href="/account/orders"
            className="shrink-0 text-sm text-jewel underline"
          >
            View all
          </Link>
        </div>

        {orders.length === 0 ? (
          <p className="text-sm leading-relaxed text-ink-soft">
            No orders yet.{" "}
            <Link href="/" className="text-jewel underline">
              Browse the collection
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-gold/20 border-y border-gold/20">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 space-y-1">
                  <Link
                    href={`/account/orders/${order.id}`}
                    className="block truncate font-medium text-jewel hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="text-xs capitalize leading-relaxed text-ink-soft">
                    {order.status}
                    {order.createdAt
                      ? ` · ${new Date(order.createdAt).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium text-jewel">
                  {formatPrice(order.subtotal)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default function AccountOverviewPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-ink-soft">Loading overview…</p>}
    >
      <AccountOverview />
    </Suspense>
  );
}
