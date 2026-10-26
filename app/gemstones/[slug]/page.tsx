import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";

import { ProductActions } from "@/app/_components/ProductActions";
import { ProductGallery } from "@/app/_components/ProductGallery";
import { formatPrice } from "@/lib/currency";
import { getGemstoneBySlug } from "@/lib/gemstones";

async function ProductPage({ slug }: { slug: string }) {
  const gemstone = await getGemstoneBySlug(slug);
  if (!gemstone) {
    notFound();
  }

  const soldOut = gemstone.stock <= 0;
  const cover = gemstone.images[0]?.url ?? "";

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
      <Link href="/#collection" className="text-sm text-ink-soft hover:text-jewel">
        ← Back to collection
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery name={gemstone.name} images={gemstone.images} />

        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold">
            {gemstone.type}
          </p>
          <h1 className="mt-3 font-serif text-4xl text-jewel sm:text-5xl">
            {gemstone.name}
          </h1>
          <p className="mt-4 text-2xl text-jewel">
            {formatPrice(gemstone.price)}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {gemstone.carat} ct
            {soldOut ? " · Sold out" : ` · ${gemstone.stock} in stock`}
          </p>

          <ProductActions
            gemstoneId={gemstone.id}
            slug={gemstone.slug}
            name={gemstone.name}
            price={gemstone.price}
            stock={gemstone.stock}
            image={cover}
          />

          <p className="mt-8 whitespace-pre-wrap leading-8 text-ink-soft">
            {gemstone.description}
          </p>

          <dl className="mt-10 grid gap-3 sm:grid-cols-2">
            {[
              ["Colour", gemstone.color],
              ["Cut", gemstone.cut],
              ["Clarity", gemstone.clarity],
              ["Origin", gemstone.origin],
            ].map(([label, value]) => (
              <div key={label} className="border-t border-gold/20 pt-3">
                <dt className="text-[10px] uppercase tracking-[0.18em] text-gold">
                  {label}
                </dt>
                <dd className="mt-1 text-sm text-jewel">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </main>
  );
}

export default function GemstonePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Loading stone…
        </main>
      }
    >
      <ProductLoader params={params} />
    </Suspense>
  );
}

async function ProductLoader({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ProductPage slug={slug} />;
}
