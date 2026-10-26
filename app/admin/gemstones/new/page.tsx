import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { GemstoneForm } from "@/app/admin/_components/GemstoneForm";
import { getAdminSession } from "@/lib/auth";

async function NewGemstone() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="w-full flex-1 px-5 py-10 lg:px-10">
      <Link
        href="/admin/gemstones"
        className="text-sm text-ink-soft hover:text-jewel"
      >
        ← Back to gemstones
      </Link>
      <p className="mt-6 text-xs uppercase tracking-[0.28em] text-gold">
        Inventory
      </p>
      <h1 className="mt-3 font-serif text-4xl text-jewel">Add gemstone</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink-soft">
        Upload up to five photos. The first image is used as the cover.
      </p>
      <GemstoneForm mode="create" />
    </main>
  );
}

export default function NewGemstonePage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Opening the form…
        </main>
      }
    >
      <NewGemstone />
    </Suspense>
  );
}
