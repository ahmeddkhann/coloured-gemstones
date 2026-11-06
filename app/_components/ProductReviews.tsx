import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";
import { ReviewModel } from "@/lib/models/Review";

type ReviewView = {
  id: string;
  rating: number;
  comment: string;
  createdAt?: Date;
  customerName: string;
};

export async function ProductReviews({ gemstoneId }: { gemstoneId: string }) {
  await connectDB();
  const docs = await ReviewModel.find({ gemstoneId })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const customerIds = [...new Set(docs.map((doc) => String(doc.customerId)))];
  const customers = customerIds.length
    ? await CustomerModel.find({ _id: { $in: customerIds } })
        .select("name")
        .lean()
    : [];
  const nameById = new Map(
    customers.map((customer) => [String(customer._id), customer.name]),
  );

  const reviews: ReviewView[] = docs.map((doc) => ({
    id: String(doc._id),
    rating: doc.rating,
    comment: doc.comment,
    createdAt: doc.createdAt,
    customerName: nameById.get(String(doc.customerId)) ?? "Customer",
  }));

  const average =
    reviews.length === 0
      ? 0
      : reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

  return (
    <section className="mt-16 border-t border-gold/20 pt-12">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Reviews</p>
      <h2 className="mt-3 font-serif text-3xl text-jewel">What buyers say</h2>
      {reviews.length === 0 ? (
        <p className="mt-4 text-sm text-ink-soft">
          No reviews yet for this stone.
        </p>
      ) : (
        <>
          <p className="mt-3 text-sm text-ink-soft">
            <span className="text-gold">
              {"★".repeat(Math.round(average))}
              {"☆".repeat(5 - Math.round(average))}
            </span>{" "}
            {average.toFixed(1)} average · {reviews.length} review
            {reviews.length === 1 ? "" : "s"}
          </p>
          <ul className="mt-8 space-y-5">
            {reviews.map((review) => (
              <li
                key={review.id}
                className="border-t border-gold/15 pt-5 first:border-t-0 first:pt-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="font-medium text-jewel">{review.customerName}</p>
                  <p className="text-sm text-gold">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </p>
                </div>
                <p className="mt-2 text-sm leading-7 text-ink-soft">
                  {review.comment}
                </p>
                {review.createdAt ? (
                  <p className="mt-2 text-xs text-ink-soft">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
