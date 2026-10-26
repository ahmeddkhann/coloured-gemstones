"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useCart } from "@/app/_components/cart/CartProvider";
import { formatPrice } from "@/lib/currency";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/30 bg-background px-4 py-3 text-sm outline-none focus:border-gold";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, ready, subtotal, itemCount } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (ready && itemCount === 0) {
      router.replace("/cart");
    }
  }, [ready, itemCount, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            name: name.trim(),
            email: email.trim(),
            phone: phone.trim(),
            address: address.trim(),
            notes: notes.trim() || undefined,
          },
          items: items.map((item) => ({
            gemstoneId: item.gemstoneId,
            quantity: item.quantity,
          })),
        }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        data?: { orderNumber: string };
      };

      if (!response.ok || !payload.ok || !payload.data?.orderNumber) {
        setError(payload.error ?? "Could not place the order.");
        return;
      }

      router.push(
        `/order/success?order=${encodeURIComponent(payload.data.orderNumber)}`,
      );
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  if (!ready || itemCount === 0) {
    return (
      <main className="flex flex-1 items-center justify-center text-ink-soft">
        Preparing checkout…
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-5 py-12">
      <Link href="/cart" className="text-sm text-ink-soft hover:text-jewel">
        ← Back to cart
      </Link>
      <p className="mt-6 text-xs uppercase tracking-[0.28em] text-gold">
        Checkout
      </p>
      <h1 className="mt-3 font-serif text-4xl text-jewel">Place your order</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Cash on delivery. We will confirm by email.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={submit} className="space-y-4">
          <label className="block text-sm">
            Full name
            <input
              className={fieldClass}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </label>
          <label className="block text-sm">
            Email
            <input
              type="email"
              className={fieldClass}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </label>
          <label className="block text-sm">
            Phone
            <input
              type="tel"
              className={fieldClass}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
            />
          </label>
          <label className="block text-sm">
            Delivery address
            <textarea
              className={`${fieldClass} min-h-24`}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              autoComplete="street-address"
            />
          </label>
          <label className="block text-sm">
            Notes (optional)
            <textarea
              className={`${fieldClass} min-h-20`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          {error ? <p className="text-sm text-red-700">{error}</p> : null}

          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-jewel px-6 py-3 text-sm text-[#f7f1e8] disabled:opacity-60"
          >
            {pending ? "Placing order…" : "Place order"}
          </button>
        </form>

        <aside className="h-fit rounded-2xl border border-gold/25 bg-card p-5">
          <h2 className="font-serif text-2xl text-jewel">Order summary</h2>
          <ul className="mt-4 space-y-3">
            {items.map((item) => (
              <li key={item.gemstoneId} className="flex gap-3 text-sm">
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-background">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-jewel">{item.name}</p>
                  <p className="text-ink-soft">
                    Qty {item.quantity} · {formatPrice(item.price)}
                  </p>
                </div>
                <p className="shrink-0 text-jewel">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-5 border-t border-gold/20 pt-4 text-lg text-jewel">
            Total{" "}
            <span className="font-serif text-2xl">{formatPrice(subtotal)}</span>
          </p>
        </aside>
      </div>
    </main>
  );
}
