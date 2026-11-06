"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/30 bg-background px-4 py-3 text-sm outline-none focus:border-gold";

export function ReviewForm({
  gemstoneId,
  orderId,
}: {
  gemstoneId: string;
  orderId: string;
}) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gemstoneId, orderId, rating, comment }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Could not submit the review.");
        return;
      }
      setComment("");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3">
      <label className="block text-sm">
        Rating
        <select
          className={fieldClass}
          value={rating}
          onChange={(event) => setRating(Number(event.target.value))}
        >
          {[5, 4, 3, 2, 1].map((value) => (
            <option key={value} value={value}>
              {value} star{value === 1 ? "" : "s"}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Review
        <textarea
          className={fieldClass}
          rows={3}
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          required
          maxLength={2000}
        />
      </label>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-jewel px-5 py-2.5 text-sm text-[#f7f1e8] disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
