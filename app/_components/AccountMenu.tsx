"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccountMenu() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function goToAdmin() {
    if (pending) {
      return;
    }
    setPending(true);
    try {
      const response = await fetch("/api/auth/me");
      const payload = (await response.json()) as { ok: boolean };
      if (response.ok && payload.ok) {
        router.push("/admin");
      } else {
        router.push("/admin/login");
      }
    } catch {
      router.push("/admin/login");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      aria-label="Admin account"
      disabled={pending}
      onClick={() => void goToAdmin()}
      className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-jewel transition hover:bg-gold/10 disabled:opacity-60"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      >
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19.2c.8-3.2 3.5-5.2 7-5.2s6.2 2 7 5.2" />
      </svg>
    </button>
  );
}
