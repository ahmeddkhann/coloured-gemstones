import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";

import { OrderStatusForm } from "@/app/admin/_components/OrderStatusForm";
import { type OrderStatus } from "@/lib/constants";
import { formatPrice } from "@/lib/currency";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { OrderModel } from "@/lib/models/Order";
import { serializeDoc } from "@/lib/serialize";

type OrderDetail = {
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
    address: string;
    notes?: string;
  };
  items: Array<{
    name: string;
    slug: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  statusHistory: Array<{
    status: string;
    note?: string;
    at: string | Date;
  }>;
};

async function OrderDetailPage({ id }: { id: string }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  if (!isValidObjectId(id)) {
    notFound();
  }

  await connectDB();
  const doc = await OrderModel.findById(id);
  if (!doc) {
    notFound();
  }

  const order = serializeDoc(doc) as OrderDetail;

  return (
    <main className="w-full flex-1 px-5 py-10 lg:px-10">
      <Link
        href="/admin/orders"
        className="text-sm text-ink-soft hover:text-jewel"
      >
        ← Back to orders
      </Link>

      <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold">Order</p>
          <h1 className="mt-3 font-serif text-4xl text-jewel">
            {order.orderNumber}
          </h1>
          <p className="mt-2 text-sm capitalize text-ink-soft">
            {order.status} · {order.paymentMethod.toUpperCase()} ·{" "}
            {formatDate(order.createdAt)}
          </p>
        </div>
        <p className="font-serif text-3xl text-jewel">
          {formatPrice(order.subtotal)}
        </p>
      </div>

      <div className="mt-10 grid gap-8 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-gold/20 bg-card p-5">
            <h2 className="font-serif text-2xl text-jewel">Customer</h2>
            <dl className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-gold">
                  Name
                </dt>
                <dd className="mt-1 text-jewel">{order.customer.name}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-gold">
                  Email
                </dt>
                <dd className="mt-1 text-jewel">{order.customer.email}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-gold">
                  Phone
                </dt>
                <dd className="mt-1 text-jewel">{order.customer.phone}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs uppercase tracking-[0.16em] text-gold">
                  Address
                </dt>
                <dd className="mt-1 whitespace-pre-wrap text-jewel">
                  {order.customer.address}
                </dd>
              </div>
              {order.customer.notes ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-[0.16em] text-gold">
                    Notes
                  </dt>
                  <dd className="mt-1 text-ink-soft">{order.customer.notes}</dd>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-2xl border border-gold/20 bg-card p-5">
            <h2 className="font-serif text-2xl text-jewel">Items</h2>
            <ul className="mt-4 space-y-3">
              {order.items.map((item, index) => (
                <li
                  key={`${item.slug}-${index}`}
                  className="flex gap-3 border-b border-gold/10 pb-3 last:border-0 last:pb-0"
                >
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-background">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    ) : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-jewel">{item.name}</p>
                    <p className="text-xs text-ink-soft">
                      Qty {item.quantity} · {formatPrice(item.price)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm text-jewel">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="space-y-8">
          <section className="rounded-2xl border border-gold/20 bg-card p-5">
            <h2 className="font-serif text-2xl text-jewel">Update status</h2>
            <div className="mt-4">
              <OrderStatusForm
                orderId={order.id}
                currentStatus={order.status}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gold/20 bg-card p-5">
            <h2 className="font-serif text-2xl text-jewel">History</h2>
            {order.statusHistory.length === 0 ? (
              <p className="mt-4 text-sm text-ink-soft">No history yet.</p>
            ) : (
              <ol className="mt-4 space-y-3">
                {[...order.statusHistory].reverse().map((entry, index) => (
                  <li key={`${entry.status}-${index}`} className="text-sm">
                    <p className="capitalize text-jewel">{entry.status}</p>
                    <p className="text-xs text-ink-soft">
                      {formatDate(entry.at)}
                      {entry.note ? ` · ${entry.note}` : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
          </section>
        </div>
      </div>
    </main>
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
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Loading order…
        </main>
      }
    >
      <OrderDetailLoader params={params} />
    </Suspense>
  );
}

async function OrderDetailLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <OrderDetailPage id={id} />;
}
