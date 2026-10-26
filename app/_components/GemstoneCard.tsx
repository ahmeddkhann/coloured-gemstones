"use client";

import Image from "next/image";
import Link from "next/link";

import { useWishlist } from "@/app/_components/wishlist/WishlistProvider";
import { formatPrice } from "@/lib/currency";
import type { PublicGemstone } from "@/lib/gemstones";

type Props = {
  gemstone: Pick<
    PublicGemstone,
    "id" | "name" | "slug" | "type" | "carat" | "price" | "stock" | "images"
  >;
};

export function GemstoneCard({ gemstone }: Props) {
  const cover = gemstone.images[0];
  const soldOut = gemstone.stock <= 0;
  const { has, toggle } = useWishlist();
  const wished = has(gemstone.id);

  function onWishlist(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    toggle({
      gemstoneId: gemstone.id,
      slug: gemstone.slug,
      name: gemstone.name,
      price: gemstone.price,
      image: cover?.url ?? "",
      stock: gemstone.stock,
    });
  }

  return (
    <article className="group overflow-hidden rounded-2xl border border-gold/20 bg-background transition hover:border-gold/50">
      <Link
        href={`/gemstones/${gemstone.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-[linear-gradient(135deg,#0f3d2e22,#b8860b22)]"
      >
        {cover ? (
          <Image
            src={cover.url}
            alt={gemstone.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : null}
        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#1a1612]/80 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#f7f1e8]">
            Sold out
          </span>
        ) : null}
      </Link>

      <div className="px-4 py-4">
        <p className="text-[10px] uppercase tracking-[0.22em] text-gold">
          {gemstone.type}
        </p>
        <Link href={`/gemstones/${gemstone.slug}`}>
          <h3 className="mt-1 font-serif text-xl text-jewel hover:underline">
            {gemstone.name}
          </h3>
        </Link>
        <p className="mt-2 text-sm text-ink-soft">
          {gemstone.carat} ct · {formatPrice(gemstone.price)}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/gemstones/${gemstone.slug}`}
            className="rounded-full bg-jewel px-4 py-2 text-xs text-[#f7f1e8] transition hover:bg-[#0b2e22]"
          >
            View
          </Link>
          <button
            type="button"
            aria-pressed={wished}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            onClick={onWishlist}
            className={`rounded-full border px-4 py-2 text-xs transition ${
              wished
                ? "border-jewel bg-jewel/10 text-jewel"
                : "border-gold/40 text-jewel hover:bg-gold/10"
            }`}
          >
            {wished ? "Wishlisted" : "Wishlist"}
          </button>
        </div>
      </div>
    </article>
  );
}
