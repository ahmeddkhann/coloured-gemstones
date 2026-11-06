"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/account", label: "Overview", exact: true },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/reviews", label: "Reviews" },
  { href: "/account/settings", label: "Settings" },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AccountNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    if (pending) {
      return;
    }
    setPending(true);
    try {
      await fetch("/api/customer-auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <nav className="mt-6 flex flex-col gap-1">
      <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {links.map((link) => {
          const active = isActive(
            pathname,
            link.href,
            "exact" in link ? link.exact : false,
          );
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`shrink-0 rounded-xl px-3 py-2 text-sm transition ${
                active
                  ? "bg-jewel text-[#f7f1e8]"
                  : "border border-gold/25 text-jewel hover:bg-gold/10 lg:border-transparent"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => void signOut()}
        className="mt-3 rounded-xl px-3 py-2 text-left text-sm text-ink-soft transition hover:bg-gold/10 hover:text-jewel disabled:opacity-60"
      >
        {pending ? "Signing out…" : "Sign out"}
      </button>
    </nav>
  );
}
