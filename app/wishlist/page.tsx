"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { useCart } from "@/app/_components/cart/CartProvider";
import { useWishlist } from "@/app/_components/wishlist/WishlistProvider";
import { formatPrice } from "@/lib/currency";

export default function WishlistPage() {
  const { items, ready, remove } = useWishlist();
  const { addItem } = useCart();
  const [note, setNote] = useState("");

  if (!ready) {
    return (
      <main className="flex flex-1 items-center justify-center text-ink-soft">
        Opening your wishlist…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Saved</p>
      <h1 className="mt-3 font-serif text-4xl text-jewel">Wishlist</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {items.length === 0
          ? "No stones saved yet."
          : `${items.length} saved stone${items.length === 1 ? "" : "s"}.`}
      </p>

      {note ? <p className="mt-4 text-sm text-jewel">{note}</p> : null}

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-gold/30 px-6 py-12 text-center">
          <p className="text-ink-soft">
            Tap Wishlist on a stone in the collection to save it here.
          </p>
          <Link
            href="/#collection"
            className="mt-6 inline-block rounded-full bg-jewel px-5 py-2 text-sm text-[#f7f1e8]"
          >
            View collection
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-4">
          {items.map((item) => {
            const soldOut = item.stock <= 0;
            return (
              <li
                key={item.gemstoneId}
                className="flex gap-4 rounded-2xl border border-gold/20 bg-card p-3"
              >
                <Link
                  href={`/gemstones/${item.slug}`}
                  className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-background"
                >
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="96px"
                    />
                  ) : null}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/gemstones/${item.slug}`}
                    className="font-serif text-lg text-jewel hover:underline"
                  >
                    {item.name}
                  </Link>
                  <p className="mt-1 text-sm text-ink-soft">
                    {formatPrice(item.price)}
                    {soldOut ? " · Sold out" : null}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link
                      href={`/gemstones/${item.slug}`}
                      className="rounded-full border border-gold/40 px-3 py-1.5 text-xs text-jewel hover:bg-gold/10"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      disabled={soldOut}
                      onClick={() => {
                        addItem(item, 1);
                        setNote(`Added “${item.name}” to cart.`);
                      }}
                      className="rounded-full bg-jewel px-3 py-1.5 text-xs text-[#f7f1e8] disabled:opacity-50"
                    >
                      Add to cart
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(item.gemstoneId)}
                      className="rounded-full border border-red-700/40 px-3 py-1.5 text-xs text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
