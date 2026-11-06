import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import {
  GemstoneList,
  type GemstoneListItem,
} from "@/app/admin/_components/GemstoneList";
import { ExportCsvButton } from "@/app/admin/_components/ExportCsvButton";
import { GemstoneFilters } from "@/app/_components/GemstoneFilters";
import { getAdminSession } from "@/lib/auth";
import {
  getGemstoneFilterOptions,
  getGemstonesPage,
  parseGemstoneSort,
} from "@/lib/gemstones";

async function GemstonesPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    color?: string;
    sort?: string;
  }>;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const type = params.type?.trim() || undefined;
  const color = params.color?.trim() || undefined;
  const sort = parseGemstoneSort(params.sort);

  const [{ items, total }, options] = await Promise.all([
    getGemstonesPage({ page: 1, limit: 500, type, color, sort }),
    getGemstoneFilterOptions(),
  ]);

  const gemstones = items as GemstoneListItem[];

  return (
    <main className="w-full flex-1 bg-white px-5 py-8 text-black lg:px-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-[var(--admin-muted)]">Inventory</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">
            Gemstones
          </h1>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">
            {total} listing{total === 1 ? "" : "s"}
            {type || color || sort !== "featured" ? " matching filters" : ""}.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ExportCsvButton
            href="/api/admin/export/gemstones"
            label="Export CSV"
          />
          <Link
            href="/admin/gemstones/new"
            className="rounded-lg bg-jewel px-5 py-2.5 text-sm font-medium text-white"
          >
            New listing
          </Link>
        </div>
      </div>

      <GemstoneFilters
        colors={options.colors}
        type={type ?? ""}
        color={color ?? ""}
        sort={sort}
      />

      <GemstoneList gemstones={gemstones} />
    </main>
  );
}

export default function AdminGemstonesPage({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string;
    color?: string;
    sort?: string;
  }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Loading gemstones…
        </main>
      }
    >
      <GemstonesPage searchParams={searchParams} />
    </Suspense>
  );
}
