"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteReviewButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (pending) {
      return;
    }
    if (!window.confirm("Remove this review?")) {
      return;
    }
    setPending(true);
    try {
      const response = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        window.alert(payload.error ?? "Could not remove the review.");
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void remove()}
      className="rounded-lg border border-red-200 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50 disabled:opacity-60"
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
