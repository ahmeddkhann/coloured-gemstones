"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export type GemstoneListItem = {
  id: string;
  name: string;
  type: string;
  price: number;
  stock: number;
  featured: boolean;
  images: { url: string; publicId: string }[];
};

type Props = {
  gemstones: GemstoneListItem[];
};

export function GemstoneList({ gemstones: initial }: Props) {
  const router = useRouter();
  const [gemstones, setGemstones] = useState(initial);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function remove(id: string, name: string) {
    if (!window.confirm(`Delete “${name}”? This cannot be undone.`)) {
      return;
    }

    setError("");
    setPendingId(id);

    try {
      const response = await fetch(`/api/gemstones/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Could not delete the gemstone.");
        return;
      }
      setGemstones((list) => list.filter((item) => item.id !== id));
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPendingId(null);
    }
  }

  if (gemstones.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-gold/30 px-6 py-12 text-center">
        <p className="text-ink-soft">No gemstones yet.</p>
        <Link
          href="/admin/gemstones/new"
          className="mt-4 inline-block rounded-full bg-jewel px-5 py-2 text-sm text-[#f7f1e8]"
        >
          Add gemstone
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-8">
      {error ? <p className="mb-4 text-sm text-red-700">{error}</p> : null}
      <div className="overflow-x-auto rounded-2xl border border-gold/25 bg-card">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-gold/20 text-xs uppercase tracking-[0.16em] text-gold">
            <tr>
              <th className="px-4 py-3 font-medium">Stone</th>
              <th className="px-4 py-3 font-medium">Type</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Stock</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {gemstones.map((stone) => {
              const cover = stone.images[0];
              return (
                <tr key={stone.id} className="border-b border-gold/10 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-background">
                        {cover ? (
                          <Image
                            src={cover.url}
                            alt=""
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : null}
                      </div>
                      <Link
                        href={`/admin/gemstones/${stone.id}`}
                        className="font-medium text-jewel hover:underline"
                      >
                        {stone.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-4 py-3 capitalize text-ink-soft">{stone.type}</td>
                  <td className="px-4 py-3">{stone.price.toLocaleString()}</td>
                  <td className="px-4 py-3">{stone.stock}</td>
                  <td className="px-4 py-3">{stone.featured ? "Yes" : "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/gemstones/${stone.id}`}
                        className="rounded-full border border-gold/40 px-3 py-1 text-xs text-jewel hover:bg-gold/10"
                      >
                        View
                      </Link>
                      <Link
                        href={`/admin/gemstones/${stone.id}/edit`}
                        className="rounded-full border border-gold/40 px-3 py-1 text-xs text-jewel hover:bg-gold/10"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={pendingId === stone.id}
                        onClick={() => void remove(stone.id, stone.name)}
                        className="rounded-full border border-red-700/40 px-3 py-1 text-xs text-red-700 disabled:opacity-50"
                      >
                        {pendingId === stone.id ? "Deleting…" : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
