"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Admin = { name: string; email: string };

export function AccountMenu() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const meRes = await fetch("/api/auth/me");
      const me = (await meRes.json()) as { ok: boolean; data?: Admin };

      if (cancelled) {
        return;
      }
      setAdmin(me.ok && me.data ? me.data : null);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Account"
        onClick={() => setOpen((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/40 text-jewel transition hover:bg-gold/10"
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
      {open ? (
        <div className="absolute right-0 mt-2 w-52 rounded-xl border border-gold/20 bg-card p-2 shadow-lg">
          {admin ? (
            <>
              <p className="truncate px-3 py-2 text-xs text-ink-soft">
                {admin.name}
              </p>
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-gold/10"
              >
                Dashboard
              </Link>
              <Link
                href="/admin/admins/new"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-gold/10"
              >
                Add admin
              </Link>
              <Link
                href="/admin/settings"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-gold/10"
              >
                Update details
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/admin/login"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm hover:bg-gold/10"
              >
                Sign in
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}
