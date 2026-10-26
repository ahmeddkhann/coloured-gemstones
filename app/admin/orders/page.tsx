import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ORDER_STATUSES, type OrderStatus } from "@/lib/constants";
import { formatPrice } from "@/lib/currency";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { OrderModel } from "@/lib/models/Order";
import { serializeDoc } from "@/lib/serialize";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  subtotal: number;
  paymentMethod: string;
  createdAt?: string | Date;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  items: Array<{ name: string; quantity: number }>;
};

async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const statusFilter =
    params.status &&
    (ORDER_STATUSES as readonly string[]).includes(params.status)
      ? (params.status as OrderStatus)
      : null;

  await connectDB();
  const filter = statusFilter ? { status: statusFilter } : {};
  const docs = await OrderModel.find(filter).sort({ createdAt: -1 });
  const orders = docs.map((doc) => serializeDoc(doc) as OrderRow);

  return (
    <main className="w-full flex-1 px-5 py-10 lg:px-10">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Desk</p>
      <h1 className="mt-3 font-serif text-4xl text-jewel">Orders</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {orders.length} order{orders.length === 1 ? "" : "s"}
        {statusFilter ? ` · ${statusFilter}` : ""}.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip href="/admin/orders" active={!statusFilter} label="All" />
        {(["pending", "cancelled", "delivered"] as const).map((status) => (
          <FilterChip
            key={status}
            href={`/admin/orders?status=${status}`}
            active={statusFilter === status}
            label={status}
          />
        ))}
      </div>

      {orders.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-gold/30 px-6 py-14 text-center text-ink-soft">
          No orders{statusFilter ? ` with status “${statusFilter}”` : " yet"}.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-gold/25 bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-gold/20 text-xs uppercase tracking-[0.16em] text-gold">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Items</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium"> </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const itemCount = order.items.reduce(
                  (sum, item) => sum + item.quantity,
                  0,
                );
                return (
                  <tr
                    key={order.id}
                    className="border-b border-gold/10 last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-jewel">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-jewel">{order.customer.name}</p>
                      <p className="text-xs text-ink-soft">
                        {order.customer.email}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {itemCount} item{itemCount === 1 ? "" : "s"}
                    </td>
                    <td className="px-4 py-3">{formatPrice(order.subtotal)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="rounded-full border border-gold/40 px-3 py-1 text-xs text-jewel hover:bg-gold/10"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

function FilterChip({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-3 py-1.5 text-xs capitalize transition ${
        active
          ? "bg-jewel text-[#f7f1e8]"
          : "border border-gold/30 text-ink-soft hover:bg-gold/10 hover:text-jewel"
      }`}
    >
      {label}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className="rounded-full border border-gold/30 px-2.5 py-0.5 text-xs capitalize text-jewel">
      {status}
    </span>
  );
}

function formatDate(value?: string | Date) {
  if (!value) {
    return "—";
  }
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Loading orders…
        </main>
      }
    >
      <OrdersPage searchParams={searchParams} />
    </Suspense>
  );
}
