"use client";

import { CartProvider } from "@/app/_components/cart/CartProvider";
import { StoreFloats } from "@/app/_components/StoreFloats";
import { WishlistProvider } from "@/app/_components/wishlist/WishlistProvider";

type Props = {
  children: React.ReactNode;
  whatsappNumber?: string;
};

export function StoreProviders({ children, whatsappNumber = "" }: Props) {
  return (
    <CartProvider>
      <WishlistProvider>
        {children}
        <StoreFloats whatsappNumber={whatsappNumber} />
      </WishlistProvider>
    </CartProvider>
  );
}
