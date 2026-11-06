"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/gemstones", label: "Gemstones" },
  { href: "/admin/gemstones/new", label: "New listing" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/analytics/prices", label: "Price history" },
  { href: "/admin/admins/new", label: "Admins" },
  { href: "/admin/settings", label: "Settings" },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) {
    return pathname === href;
  }
  if (href === "/admin/gemstones") {
    return (
      pathname === "/admin/gemstones" ||
      (pathname.startsWith("/admin/gemstones/") &&
        !pathname.startsWith("/admin/gemstones/new"))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-[var(--admin-border)] bg-white md:w-56 md:border-b-0 md:border-r lg:w-60">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-jewel text-xs font-semibold text-white">
          CG
        </span>
        <div>
          <p className="text-sm font-semibold text-black">Shop Manager</p>
          <p className="text-[11px] text-[var(--admin-muted)]">
            Coloured Gemstones
          </p>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-2 pb-3 md:flex-col md:overflow-visible md:px-3 md:pb-6">
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
              className={`whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-black/[0.06] font-medium text-black"
                  : "text-[var(--admin-muted)] hover:bg-black/[0.04] hover:text-black"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-1 border-t border-[var(--admin-border)] px-3 py-4">
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-sm text-[var(--admin-muted)] hover:bg-black/[0.04] hover:text-black"
        >
          View storefront
        </Link>
        <button
          type="button"
          disabled={signingOut}
          onClick={() => void signOut()}
          className="w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--admin-muted)] hover:bg-black/[0.04] hover:text-black disabled:opacity-60"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
      </div>
    </aside>
  );
}
