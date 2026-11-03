"use client";

import Image from "next/image";
import Link from "next/link";

import { useWishlist } from "@/app/_components/wishlist/WishlistProvider";
import { formatPrice } from "@/lib/currency";
import type { PublicGemstone } from "@/lib/gemstones";
import { cardImageUrl } from "@/lib/media-url";

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
            src={cardImageUrl(cover.url)}
            alt={gemstone.name}
            fill
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs uppercase tracking-[0.18em] text-ink-soft">
            No image
          </div>
        )}
        {soldOut ? (
          <span className="absolute left-3 top-3 rounded-full bg-[#1a1612]/80 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[#f7f1e8]">
            Sold out
          </span>
        ) : null}
      </Link>

      <div className="px-2.5 py-3 sm:px-4 sm:py-4">
        <p className="text-[9px] uppercase tracking-[0.18em] text-gold sm:text-[10px] sm:tracking-[0.22em]">
          {gemstone.type}
        </p>
        <Link href={`/gemstones/${gemstone.slug}`}>
          <h3 className="mt-1 font-serif text-base leading-snug text-jewel hover:underline sm:text-xl">
            {gemstone.name}
          </h3>
        </Link>
        <p className="mt-1.5 text-xs text-ink-soft sm:mt-2 sm:text-sm">
          {gemstone.carat} ct · {formatPrice(gemstone.price)}
        </p>

        <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
          <Link
            href={`/gemstones/${gemstone.slug}`}
            className="rounded-full bg-jewel px-3 py-1.5 text-[11px] text-[#f7f1e8] transition hover:bg-[#0b2e22] sm:px-4 sm:py-2 sm:text-xs"
          >
            View
          </Link>
          <button
            type="button"
            aria-pressed={wished}
            aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
            onClick={onWishlist}
            className={`rounded-full border px-3 py-1.5 text-[11px] transition sm:px-4 sm:py-2 sm:text-xs ${
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
