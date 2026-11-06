import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";

import { formatPrice } from "@/lib/currency";
import { getCustomerSession } from "@/lib/customer-auth";
import { connectDB } from "@/lib/mongodb";
import { OrderModel } from "@/lib/models/Order";
import { serializeDoc } from "@/lib/serialize";

type OrderDetail = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  paymentMethod: string;
  createdAt?: string | Date;
  customerId?: string;
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

async function AccountOrderDetail({ id }: { id: string }) {
  const session = await getCustomerSession();
  if (!session) {
    redirect("/account/login");
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
  const ownsOrder =
    String(order.customerId ?? "") === session.customerId ||
    order.customer.email.toLowerCase() === session.email.toLowerCase();

  if (!ownsOrder) {
    notFound();
  }

  return (
    <main className="space-y-8">
      <div className="space-y-2">
        <Link
          href="/account/orders"
          className="inline-block text-sm text-ink-soft hover:text-jewel"
        >
          ← Back to orders
        </Link>
        <p className="pt-4 text-[11px] uppercase tracking-[0.22em] text-gold">
          Order
        </p>
        <h2 className="break-all font-serif text-2xl leading-snug text-jewel sm:text-3xl">
          {order.orderNumber}
        </h2>
        <p className="text-sm capitalize leading-relaxed text-ink-soft">
          {order.status} · {order.paymentMethod.toUpperCase()}
          {order.createdAt
            ? ` · ${new Date(order.createdAt).toLocaleDateString()}`
            : ""}
        </p>
      </div>

      <section className="rounded-2xl border border-gold/20 bg-card p-5">
        <h3 className="font-serif text-xl text-jewel">Items</h3>
        <ul className="mt-4 space-y-4">
          {order.items.map((item) => (
            <li key={`${item.slug}-${item.price}`} className="flex gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-background">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/gemstones/${item.slug}`}
                  className="text-sm font-medium text-jewel hover:underline"
                >
                  {item.name}
                </Link>
                <p className="mt-1 text-xs text-ink-soft">
                  Qty {item.quantity} · {formatPrice(item.price)}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-right font-serif text-2xl text-jewel">
          {formatPrice(order.subtotal)}
        </p>
      </section>

      <section className="rounded-2xl border border-gold/20 bg-card p-5">
        <h3 className="font-serif text-xl text-jewel">Delivery details</h3>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-gold">Name</dt>
            <dd className="mt-1 text-jewel">{order.customer.name}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase tracking-[0.16em] text-gold">Phone</dt>
            <dd className="mt-1 text-jewel">{order.customer.phone}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-[0.16em] text-gold">Address</dt>
            <dd className="mt-1 text-jewel">{order.customer.address}</dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-gold/20 bg-card p-5">
        <h3 className="font-serif text-xl text-jewel">Status history</h3>
        <ol className="mt-4 space-y-3">
          {order.statusHistory.map((entry, index) => (
            <li key={`${entry.status}-${index}`} className="text-sm">
              <span className="capitalize text-jewel">{entry.status}</span>
              <span className="text-ink-soft">
                {" "}
                · {new Date(entry.at).toLocaleString()}
              </span>
              {entry.note ? (
                <p className="mt-1 text-ink-soft">{entry.note}</p>
              ) : null}
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}

export default function AccountOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={<p className="text-sm text-ink-soft">Loading order…</p>}
    >
      <AccountOrderDetailLoader params={params} />
    </Suspense>
  );
}

async function AccountOrderDetailLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AccountOrderDetail id={id} />;
}
