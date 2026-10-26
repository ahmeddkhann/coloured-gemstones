"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home", exact: true },
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/gemstones", label: "Gemstones" },
  { href: "/admin/gemstones/new", label: "Add gemstone" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/admins/new", label: "Add admin" },
  { href: "/admin/settings", label: "Update details" },
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
      router.push("/admin/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-gold/20 bg-card md:w-56 md:border-b-0 md:border-r lg:w-64">
      <div className="px-5 py-5">
        <p className="text-[10px] uppercase tracking-[0.28em] text-gold">
          Atelier desk
        </p>
        <p className="mt-1 font-serif text-xl text-jewel">Admin</p>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible md:pb-6">
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
              className={`whitespace-nowrap rounded-xl px-3 py-2.5 text-sm transition ${
                active
                  ? "bg-jewel text-[#f7f1e8]"
                  : "text-ink-soft hover:bg-gold/10 hover:text-jewel"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="flex gap-2 overflow-x-auto px-3 pb-3 md:mt-auto md:block md:overflow-visible md:border-t md:border-gold/15 md:px-3 md:py-4">
        <button
          type="button"
          disabled={signingOut}
          onClick={() => void signOut()}
          className="whitespace-nowrap rounded-xl border border-gold/40 px-3 py-2.5 text-sm text-jewel hover:bg-gold/10 disabled:opacity-60 md:w-full md:text-left"
        >
          {signingOut ? "Signing out…" : "Sign out"}
        </button>
        <Link
          href="/"
          className="whitespace-nowrap rounded-xl px-3 py-2.5 text-sm text-ink-soft hover:bg-gold/10 hover:text-jewel md:mt-1 md:block"
        >
          ← Storefront
        </Link>
      </div>
    </aside>
  );
}
