"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  id: string;
  name: string;
  className?: string;
};

export function DeleteGemstoneButton({ id, name, className }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function remove() {
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) {
      return;
    }

    setPending(true);
    try {
      const response = await fetch(`/api/gemstones/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        window.alert(payload.error ?? "Could not delete the gemstone.");
        return;
      }
      router.push("/admin/gemstones");
      router.refresh();
    } catch {
      window.alert("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => void remove()}
      className={
        className ??
        "rounded-full border border-red-700/40 px-5 py-2 text-sm text-red-700 disabled:opacity-50"
      }
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
