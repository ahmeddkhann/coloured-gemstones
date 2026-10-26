"use client";

import Link from "next/link";

import { AccountMenu } from "@/app/_components/AccountMenu";
import { useCart } from "@/app/_components/cart/CartProvider";
import { useWishlist } from "@/app/_components/wishlist/WishlistProvider";

export function Header() {
  const { itemCount } = useCart();
  const { count: wishlistCount } = useWishlist();

  return (
    <header className="sticky top-0 z-40 border-b border-gold/25 bg-[#f7f1e8]/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl tracking-wide text-jewel">
            Coloured
          </span>
          <span className="text-xs uppercase tracking-[0.28em] text-gold">
            Gemstones
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm text-ink-soft sm:gap-6">
          <Link href="/#collection" className="hidden hover:text-jewel sm:inline">
            Collection
          </Link>
          <Link
            href="/wishlist"
            aria-label={`Wishlist${wishlistCount ? `, ${wishlistCount} items` : ""}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-jewel transition hover:bg-gold/10"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M12 20s-7-4.4-7-9.2A3.8 3.8 0 0 1 12 7.5a3.8 3.8 0 0 1 7 3.3C19 15.6 12 20 12 20z" />
            </svg>
            {wishlistCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-jewel px-1 text-[10px] text-[#f7f1e8]">
                {wishlistCount > 99 ? "99+" : wishlistCount}
              </span>
            ) : null}
          </Link>
          <Link
            href="/cart"
            aria-label={`Cart${itemCount ? `, ${itemCount} items` : ""}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-jewel transition hover:bg-gold/10"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            >
              <path d="M6 7h15l-1.5 9h-12z" />
              <path d="M6 7 5 3H2" />
              <circle cx="9" cy="20" r="1.2" fill="currentColor" stroke="none" />
              <circle cx="17" cy="20" r="1.2" fill="currentColor" stroke="none" />
            </svg>
            {itemCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-jewel px-1 text-[10px] text-[#f7f1e8]">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            ) : null}
          </Link>
          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}
