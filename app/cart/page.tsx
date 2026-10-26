"use client";

import Image from "next/image";
import Link from "next/link";

import { useCart } from "@/app/_components/cart/CartProvider";
import { formatPrice } from "@/lib/currency";

export default function CartPage() {
  const { items, ready, subtotal, setQuantity, removeItem, itemCount } =
    useCart();

  if (!ready) {
    return (
      <main className="flex flex-1 items-center justify-center text-ink-soft">
        Opening your bag…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Bag</p>
      <h1 className="mt-3 font-serif text-4xl text-jewel">Your cart</h1>
      <p className="mt-2 text-sm text-ink-soft">
        {itemCount === 0
          ? "Your bag is empty."
          : `${itemCount} item${itemCount === 1 ? "" : "s"} ready to order.`}
      </p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-gold/30 px-6 py-12 text-center">
          <p className="text-ink-soft">Browse the collection to add a stone.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/#collection"
              className="rounded-full bg-jewel px-5 py-2 text-sm text-[#f7f1e8]"
            >
              View collection
            </Link>
            <Link
              href="/wishlist"
              className="rounded-full border border-gold/40 px-5 py-2 text-sm text-jewel hover:bg-gold/10"
            >
              Wishlist
            </Link>
          </div>
        </div>
      ) : (
        <>
          <ul className="mt-8 space-y-4">
            {items.map((item) => (
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
                    {item.stock <= 0 ? " · Sold out" : null}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-xs text-ink-soft">
                      Qty
                      <input
                        type="number"
                        min={1}
                        max={Math.max(1, item.stock)}
                        value={item.quantity}
                        disabled={item.stock <= 0}
                        onChange={(event) =>
                          setQuantity(
                            item.gemstoneId,
                            Number(event.target.value),
                          )
                        }
                        className="w-16 rounded-lg border border-gold/30 bg-background px-2 py-1 text-sm outline-none focus:border-gold"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => removeItem(item.gemstoneId)}
                      className="text-xs text-red-700 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
                <p className="shrink-0 text-sm text-jewel">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-gold/20 pt-6">
            <p className="text-lg text-jewel">
              Subtotal{" "}
              <span className="font-serif text-2xl">{formatPrice(subtotal)}</span>
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/wishlist"
                className="rounded-full border border-gold/40 px-5 py-2 text-sm text-jewel hover:bg-gold/10"
              >
                Wishlist
              </Link>
              <Link
                href="/checkout"
                className="rounded-full bg-jewel px-6 py-2 text-sm text-[#f7f1e8] hover:bg-[#0b2e22]"
              >
                Checkout
              </Link>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
