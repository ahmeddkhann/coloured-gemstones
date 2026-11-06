import { Suspense } from "react";
import { redirect } from "next/navigation";

import { PriceHistoryChart } from "@/app/admin/_components/PriceHistoryChart";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { GemstoneModel } from "@/lib/models/Gemstone";

async function PriceAnalytics() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  await connectDB();
  const stones = await GemstoneModel.find()
    .select("name")
    .sort({ name: 1 })
    .lean();

  return (
    <main className="w-full flex-1 px-5 py-8 lg:px-10">
      <p className="text-sm text-[var(--admin-muted)]">Analytics</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">
        Price history
      </h1>
      <p className="mt-1 text-sm text-[var(--admin-muted)]">
        Filter by date range and products. Points appear when an admin changes a
        price.
      </p>

      <PriceHistoryChart
        stones={stones.map((stone) => ({
          id: String(stone._id),
          name: stone.name,
        }))}
      />
    </main>
  );
}

export default function PriceHistoryPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Loading analytics…
        </main>
      }
    >
      <PriceAnalytics />
    </Suspense>
  );
}
