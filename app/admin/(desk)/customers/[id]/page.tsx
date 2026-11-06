import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";

import { DeleteReviewButton } from "@/app/admin/_components/DeleteReviewButton";
import { getAdminSession } from "@/lib/auth";
import { formatPrice } from "@/lib/currency";
import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { OrderModel } from "@/lib/models/Order";
import { ReviewModel } from "@/lib/models/Review";
import { serializeDoc } from "@/lib/serialize";

type OrderRow = {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  createdAt?: string | Date;
};

async function CustomerDetail({ id }: { id: string }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  if (!isValidObjectId(id)) {
    notFound();
  }

  await connectDB();
  const customer = await CustomerModel.findById(id).lean();
  if (!customer) {
    notFound();
  }

  const [orders, reviews] = await Promise.all([
    OrderModel.find({
      $or: [
        { customerId: customer._id },
        { "customer.email": customer.email },
      ],
    }).sort({ createdAt: -1 }),
    ReviewModel.find({ customerId: customer._id }).sort({ createdAt: -1 }).lean(),
  ]);

  const gemstoneIds = [...new Set(reviews.map((r) => String(r.gemstoneId)))];
  const gemstones = gemstoneIds.length
    ? await GemstoneModel.find({ _id: { $in: gemstoneIds } })
        .select("name")
        .lean()
    : [];
  const gemstoneById = new Map(
    gemstones.map((g) => [String(g._id), g.name]),
  );

  const orderRows = orders.map((doc) => serializeDoc(doc) as OrderRow);

  return (
    <main className="w-full flex-1 px-5 py-8 lg:px-10">
      <Link
        href="/admin/customers"
        className="text-sm text-[var(--admin-muted)] hover:text-jewel"
      >
        ← Back to customers
      </Link>

      <p className="mt-6 text-sm text-[var(--admin-muted)]">Customer</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">
        {customer.name}
      </h1>
      <p className="mt-1 text-sm text-[var(--admin-muted)]">{customer.email}</p>

      <section className="mt-8 rounded-2xl border border-[var(--admin-border)] bg-white p-5">
        <h2 className="text-lg font-semibold text-[var(--admin-ink)]">Profile</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">
              Phone
            </dt>
            <dd className="mt-1">{customer.phone}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">
              Address
            </dt>
            <dd className="mt-1">{customer.address}</dd>
          </div>
        </dl>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--admin-ink)]">Orders</h2>
        {orderRows.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--admin-muted)]">No orders.</p>
        ) : (
          <ul className="mt-4 divide-y divide-[var(--admin-border)] rounded-2xl border border-[var(--admin-border)] bg-white">
            {orderRows.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-jewel hover:underline"
                  >
                    {order.orderNumber}
                  </Link>
                  <p className="mt-1 text-xs capitalize text-[var(--admin-muted)]">
                    {order.status}
                    {order.createdAt
                      ? ` · ${new Date(order.createdAt).toLocaleDateString()}`
                      : ""}
                  </p>
                </div>
                <p>{formatPrice(order.subtotal)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-[var(--admin-ink)]">Reviews</h2>
        {reviews.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--admin-muted)]">No reviews.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {reviews.map((review) => (
              <li
                key={String(review._id)}
                className="rounded-2xl border border-[var(--admin-border)] bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      {gemstoneById.get(String(review.gemstoneId)) ?? "Gemstone"}
                    </p>
                    <p className="mt-1 text-sm text-gold">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </p>
                    <p className="mt-2 text-sm text-[var(--admin-muted)]">
                      {review.comment}
                    </p>
                  </div>
                  <DeleteReviewButton id={String(review._id)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Loading customer…
        </main>
      }
    >
      <CustomerDetailLoader params={params} />
    </Suspense>
  );
}

async function CustomerDetailLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CustomerDetail id={id} />;
}
