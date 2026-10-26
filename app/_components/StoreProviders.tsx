"use client";

import { CartProvider } from "@/app/_components/cart/CartProvider";
import { WishlistProvider } from "@/app/_components/wishlist/WishlistProvider";

export function StoreProviders({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <WishlistProvider>{children}</WishlistProvider>
    </CartProvider>
  );
}
