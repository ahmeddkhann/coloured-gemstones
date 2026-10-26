"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCart } from "@/app/_components/cart/CartProvider";
import { useWishlist } from "@/app/_components/wishlist/WishlistProvider";

type Props = {
  gemstoneId: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  image: string;
};

export function ProductActions({
  gemstoneId,
  slug,
  name,
  price,
  stock,
  image,
}: Props) {
  const router = useRouter();
  const { addItem } = useCart();
  const { has, toggle } = useWishlist();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const soldOut = stock <= 0;
  const wished = has(gemstoneId);

  const line = {
    gemstoneId,
    slug,
    name,
    price,
    image,
    stock,
  };

  function addToCart() {
    if (soldOut) {
      return;
    }
    addItem(line, quantity);
    setMessage("Added to cart.");
  }

  function orderNow() {
    if (soldOut) {
      return;
    }
    addItem(line, quantity);
    router.push("/checkout");
  }

  function onWishlist() {
    toggle(line);
  }

  return (
    <div className="mt-8 space-y-4">
      {!soldOut ? (
        <label className="flex items-center gap-3 text-sm text-ink-soft">
          Quantity
          <input
            type="number"
            min={1}
            max={stock}
            value={quantity}
            onChange={(event) => {
              const next = Number(event.target.value);
              if (!Number.isFinite(next)) {
                return;
              }
              setQuantity(Math.min(stock, Math.max(1, Math.floor(next))));
            }}
            className="w-20 rounded-xl border border-gold/30 bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-gold"
          />
        </label>
      ) : (
        <p className="text-sm text-ink-soft">
          This stone is sold out. You can still save it to your wishlist.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={soldOut}
          onClick={addToCart}
          className="rounded-full bg-jewel px-6 py-3 text-sm text-[#f7f1e8] transition hover:bg-[#0b2e22] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to cart
        </button>
        <button
          type="button"
          disabled={soldOut}
          onClick={orderNow}
          className="rounded-full border border-gold/50 px-6 py-3 text-sm text-jewel transition hover:bg-gold/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Order now
        </button>
        <button
          type="button"
          aria-pressed={wished}
          onClick={onWishlist}
          className={`rounded-full border px-6 py-3 text-sm transition ${
            wished
              ? "border-jewel bg-jewel/10 text-jewel"
              : "border-gold/40 text-jewel hover:bg-gold/10"
          }`}
        >
          {wished ? "Wishlisted" : "Wishlist"}
        </button>
      </div>

      {message ? <p className="text-sm text-jewel">{message}</p> : null}
    </div>
  );
}
