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
    <main className="w-full flex-1 bg-white px-5 py-8 text-black lg:px-10">
      <p className="text-sm text-[var(--admin-muted)]">
        <Link href="/admin/gemstones" className="hover:text-black">
          Gemstones
        </Link>
        <span className="mx-2">›</span>
        <span className="text-black">New listing</span>
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black">
        New listing
      </h1>
      <div className="mt-2 max-w-4xl">
        <GemstoneForm mode="create" />
      </div>
    </main>
  );
}

export default function NewGemstonePage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-[var(--admin-muted)]">
          Opening the form…
        </main>
      }
    >
      <NewGemstone />
    </Suspense>
  );
}
