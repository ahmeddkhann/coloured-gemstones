import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { DeleteReviewButton } from "@/app/admin/_components/DeleteReviewButton";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { ReviewModel } from "@/lib/models/Review";

async function ReviewsList() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  await connectDB();
  const reviews = await ReviewModel.find().sort({ createdAt: -1 }).limit(200).lean();
  const customerIds = [...new Set(reviews.map((r) => String(r.customerId)))];
  const gemstoneIds = [...new Set(reviews.map((r) => String(r.gemstoneId)))];

  const [customers, gemstones] = await Promise.all([
    customerIds.length
      ? CustomerModel.find({ _id: { $in: customerIds } }).select("name email").lean()
      : [],
    gemstoneIds.length
      ? GemstoneModel.find({ _id: { $in: gemstoneIds } }).select("name slug").lean()
      : [],
  ]);

  const customerById = new Map(
    customers.map((c) => [String(c._id), c]),
  );
  const gemstoneById = new Map(
    gemstones.map((g) => [String(g._id), g]),
  );

  return (
    <main className="w-full flex-1 px-5 py-10 lg:px-10">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Moderation</p>
      <h1 className="mt-3 font-serif text-4xl text-jewel">Reviews</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Remove any customer review from the storefront.
      </p>

      {reviews.length === 0 ? (
        <p className="mt-10 text-sm text-ink-soft">No reviews yet.</p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-[var(--admin-border)] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--admin-border)] text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Gemstone</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Rating</th>
                <th className="px-4 py-3 font-medium">Comment</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => {
                const customer = customerById.get(String(review.customerId));
                const gemstone = gemstoneById.get(String(review.gemstoneId));
                return (
                  <tr
                    key={String(review._id)}
                    className="border-b border-[var(--admin-border)] last:border-b-0"
                  >
                    <td className="px-4 py-3">
                      {gemstone ? (
                        <Link
                          href={`/admin/gemstones/${gemstone._id}`}
                          className="text-jewel hover:underline"
                        >
                          {gemstone.name}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div>{customer?.name ?? "—"}</div>
                      <div className="text-xs text-[var(--admin-muted)]">
                        {customer?.email ?? ""}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gold">
                      {"★".repeat(review.rating)}
                      {"☆".repeat(5 - review.rating)}
                    </td>
                    <td className="max-w-sm px-4 py-3 text-[var(--admin-muted)]">
                      {review.comment}
                    </td>
                    <td className="px-4 py-3">
                      <DeleteReviewButton id={String(review._id)} />
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

export default function AdminReviewsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Loading reviews…
        </main>
      }
    >
      <ReviewsList />
    </Suspense>
  );
}
