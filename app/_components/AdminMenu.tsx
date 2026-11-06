"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminMenu() {
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
      aria-label="Admin desk"
      title="Admin desk"
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
        <path d="M12 3 4.5 6.5v4.2c0 4.7 3.2 9 7.5 10.3 4.3-1.3 7.5-5.6 7.5-10.3V6.5L12 3Z" />
        <path d="M9.5 12.2 11 13.7l3.5-3.5" />
      </svg>
    </button>
  );
}
