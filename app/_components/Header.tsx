import Link from "next/link";

import { AccountMenu } from "@/app/_components/AccountMenu";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-gold/25 bg-[#f7f1e8]/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="font-serif text-xl tracking-wide text-jewel">
            Coloured
          </span>
          <span className="text-xs uppercase tracking-[0.28em] text-gold">
            Gemstones
          </span>
        </Link>
        <nav className="flex items-center gap-6 text-sm text-ink-soft">
          <Link href="/#collection" className="hidden hover:text-jewel sm:inline">
            Collection
          </Link>
          <Link href="/#atelier" className="hidden hover:text-jewel sm:inline">
            Atelier
          </Link>
          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}
