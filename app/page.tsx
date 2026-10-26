import { Suspense } from "react";

import {
  CatalogSection,
  CatalogSkeleton,
} from "@/app/_components/CatalogSection";

export default function Home({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    type?: string;
    color?: string;
    sort?: string;
  }>;
}) {
  return (
    <main>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#0f3d2e22,transparent_40%),radial-gradient(circle_at_80%_0%,#b8860b22,transparent_35%)]" />
        <div className="relative mx-auto flex min-h-[78vh] max-w-6xl flex-col justify-center px-5 py-20">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">
            Private jewellery atelier
          </p>
          <h1 className="mt-5 max-w-3xl font-serif text-5xl leading-tight text-jewel sm:text-7xl">
            Coloured gemstones, chosen with quiet certainty.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-ink-soft">
            Sapphires, rubies, emeralds and rare stones sourced for collectors
            who prefer provenance over noise.
          </p>
          <div className="mt-10">
            <a
              href="#collection"
              className="inline-block rounded-full bg-jewel px-6 py-3 text-sm text-[#f7f1e8] transition hover:bg-[#0b2e22]"
            >
              View the collection
            </a>
          </div>
        </div>
      </section>

      <Suspense fallback={<CatalogSkeleton />}>
        <CatalogSection searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
