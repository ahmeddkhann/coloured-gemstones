import Link from "next/link";
import { redirect } from "next/navigation";

import { ReviewForm } from "@/app/account/_components/ReviewForm";
import { getCustomerSession } from "@/lib/customer-auth";
import { connectDB } from "@/lib/mongodb";
import { OrderModel } from "@/lib/models/Order";
import { ReviewModel } from "@/lib/models/Review";
import { serializeDoc } from "@/lib/serialize";

type EligibleItem = {
  gemstoneId: string;
  orderId: string;
  orderNumber: string;
  name: string;
  slug: string;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string;
  createdAt?: string | Date;
  gemstoneId: string;
};

export default async function AccountReviewsPage() {
  const session = await getCustomerSession();
  if (!session) {
    redirect("/account/login");
  }

  await connectDB();

  const [deliveredOrders, existingReviews] = await Promise.all([
    OrderModel.find({
      status: "delivered",
      $or: [
        { customerId: session.customerId },
        { "customer.email": session.email },
      ],
    }).sort({ createdAt: -1 }),
    ReviewModel.find({ customerId: session.customerId }).sort({ createdAt: -1 }),
  ]);

  const reviewedGemstoneIds = new Set(
    existingReviews.map((review) => String(review.gemstoneId)),
  );

  const eligible: EligibleItem[] = [];
  const seen = new Set<string>();

  for (const order of deliveredOrders) {
    for (const item of order.items) {
      const gemstoneId = String(item.gemstoneId);
      if (reviewedGemstoneIds.has(gemstoneId) || seen.has(gemstoneId)) {
        continue;
      }
      seen.add(gemstoneId);
      eligible.push({
        gemstoneId,
        orderId: String(order._id),
        orderNumber: order.orderNumber,
        name: item.name,
        slug: item.slug,
      });
    }
  }

  const reviews = existingReviews.map((doc) => {
    const row = serializeDoc(doc) as ReviewRow;
    return row;
  });

  const orderItemNames = new Map<string, { name: string; slug: string }>();
  for (const order of deliveredOrders) {
    for (const item of order.items) {
      orderItemNames.set(String(item.gemstoneId), {
        name: item.name,
        slug: item.slug,
      });
    }
  }

  return (
    <main className="space-y-10">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
          Reviews
        </p>
        <h2 className="font-serif text-2xl leading-snug text-jewel sm:text-3xl">
          Your reviews
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
          You can review gemstones from delivered orders.
        </p>
      </header>

      <section className="space-y-4">
        <h3 className="font-serif text-xl leading-snug text-jewel">
          Leave a review
        </h3>
        {eligible.length === 0 ? (
          <p className="text-sm leading-relaxed text-ink-soft">
            No delivered purchases waiting for a review.
          </p>
        ) : (
          <ul className="space-y-6">
            {eligible.map((item) => (
              <li
                key={`${item.orderId}-${item.gemstoneId}`}
                className="rounded-2xl border border-gold/20 bg-card p-5"
              >
                <div className="min-w-0 space-y-1">
                  <Link
                    href={`/gemstones/${item.slug}`}
                    className="block break-words font-medium text-jewel hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="text-xs leading-relaxed text-ink-soft">
                    From order {item.orderNumber}
                  </p>
                </div>
                <ReviewForm
                  gemstoneId={item.gemstoneId}
                  orderId={item.orderId}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <h3 className="font-serif text-xl leading-snug text-jewel">Submitted</h3>
        {reviews.length === 0 ? (
          <p className="text-sm leading-relaxed text-ink-soft">No reviews yet.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((review) => {
              const stone = orderItemNames.get(review.gemstoneId);
              return (
                <li
                  key={review.id}
                  className="rounded-2xl border border-gold/20 bg-card p-5"
                >
                  <p className="break-words font-medium text-jewel">
                    {stone ? (
                      <Link
                        href={`/gemstones/${stone.slug}`}
                        className="hover:underline"
                      >
                        {stone.name}
                      </Link>
                    ) : (
                      "Gemstone"
                    )}
                  </p>
                  <p className="mt-1 text-sm text-gold">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </p>
                  <p className="mt-2 break-words text-sm leading-relaxed text-ink-soft">
                    {review.comment}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
