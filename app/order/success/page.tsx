"use client";

import Link from "next/link";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { useCart } from "@/app/_components/cart/CartProvider";

function SuccessContent() {
  const searchParams = useSearchParams();
  const order = searchParams.get("order");
  const { clear, ready } = useCart();

  useEffect(() => {
    if (ready) {
      clear();
    }
  }, [ready, clear]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Confirmed</p>
      <h1 className="mt-3 font-serif text-4xl text-jewel">Thank you</h1>
      <p className="mt-4 text-sm leading-7 text-ink-soft">
        Your order is placed. We will email you shortly and arrange delivery
        with cash on delivery.
      </p>
      {order ? (
        <p className="mt-6 rounded-full border border-gold/30 px-5 py-2 text-sm text-jewel">
          Order number{" "}
          <span className="font-medium tracking-wide">{order}</span>
        </p>
      ) : null}
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Link
          href="/#collection"
          className="rounded-full bg-jewel px-6 py-3 text-sm text-[#f7f1e8]"
        >
          Continue browsing
        </Link>
        <Link
          href="/"
          className="rounded-full border border-gold/40 px-6 py-3 text-sm text-jewel hover:bg-gold/10"
        >
          Home
        </Link>
      </div>
    </main>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Confirming your order…
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
