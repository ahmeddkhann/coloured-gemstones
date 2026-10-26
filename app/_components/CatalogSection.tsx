import Link from "next/link";

import { GemstoneCard } from "@/app/_components/GemstoneCard";
import { GemstoneFilters } from "@/app/_components/GemstoneFilters";
import {
  buildCatalogQuery,
  getGemstoneFilterOptions,
  getGemstonesPage,
  parseGemstoneSort,
} from "@/lib/gemstones";

type Props = {
  searchParams: Promise<{
    page?: string;
    type?: string;
    color?: string;
    sort?: string;
  }>;
};

export async function CatalogSection({ searchParams }: Props) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const type = params.type?.trim() || undefined;
  const color = params.color?.trim() || undefined;
  const sort = parseGemstoneSort(params.sort);

  const [{ items, hasMore, total, page: currentPage }, options] =
    await Promise.all([
      getGemstonesPage({ page, type, color, sort }),
      getGemstoneFilterOptions(),
    ]);

  const queryBase = { type, color, sort };

  return (
    <section id="collection" className="border-t border-gold/20 bg-card">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.28em] text-gold">
              Collection
            </p>
            <h2 className="mt-3 font-serif text-4xl text-jewel">
              Available gemstones
            </h2>
            <p className="mt-2 text-sm text-ink-soft">
              {total === 0
                ? "No stones match these filters."
                : `Showing ${items.length} of ${total} · page ${currentPage}`}
            </p>
          </div>
        </div>

        <GemstoneFilters
          colors={options.colors}
          type={type ?? ""}
          color={color ?? ""}
          sort={sort}
          hash="#collection"
        />

        {items.length === 0 ? (
          <p className="mt-12 rounded-2xl border border-dashed border-gold/30 px-6 py-16 text-center text-ink-soft">
            {total === 0 && !type && !color
              ? "New stones are being sourced. Check back soon."
              : "No stones match these filters. Try clearing them."}
          </p>
        ) : (
          <>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((gemstone) => (
                <GemstoneCard key={gemstone.id} gemstone={gemstone} />
              ))}
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-3">
              {currentPage > 1 ? (
                <Link
                  href={`/${buildCatalogQuery({
                    ...queryBase,
                    page: currentPage === 2 ? undefined : currentPage - 1,
                  })}#collection`}
                  className="rounded-full border border-gold/40 px-6 py-3 text-sm text-jewel hover:bg-gold/10"
                >
                  Previous
                </Link>
              ) : null}
              {hasMore ? (
                <Link
                  href={`/${buildCatalogQuery({
                    ...queryBase,
                    page: currentPage + 1,
                  })}#collection`}
                  className="rounded-full bg-jewel px-6 py-3 text-sm text-[#f7f1e8] transition hover:bg-[#0b2e22]"
                >
                  See more products
                </Link>
              ) : null}
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export function CatalogSkeleton() {
  return (
    <section id="collection" className="border-t border-gold/20 bg-card">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-xs uppercase tracking-[0.28em] text-gold">
          Collection
        </p>
        <h2 className="mt-3 font-serif text-4xl text-jewel">
          Available gemstones
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-2xl border border-gold/15 bg-background"
            >
              <div className="aspect-[4/5] animate-pulse bg-gold/10" />
              <div className="space-y-2 px-4 py-4">
                <div className="h-3 w-16 animate-pulse rounded bg-gold/10" />
                <div className="h-5 w-2/3 animate-pulse rounded bg-gold/15" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gold/10" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
