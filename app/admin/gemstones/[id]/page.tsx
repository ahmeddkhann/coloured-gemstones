import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";

import { DeleteGemstoneButton } from "@/app/admin/_components/DeleteGemstoneButton";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { serializeDoc } from "@/lib/serialize";

type Stone = {
  id: string;
  name: string;
  slug: string;
  description: string;
  type: string;
  color: string;
  cut: string;
  clarity: string;
  origin: string;
  carat: number;
  price: number;
  stock: number;
  featured: boolean;
  images: { url: string; publicId: string }[];
};

async function GemstoneDetail({ id }: { id: string }) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  if (!isValidObjectId(id)) {
    notFound();
  }

  await connectDB();
  const doc = await GemstoneModel.findById(id);
  if (!doc) {
    notFound();
  }

  const stone = serializeDoc(doc) as Stone;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
      <Link
        href="/admin/gemstones"
        className="text-sm text-ink-soft hover:text-jewel"
      >
        ← Back to gemstones
      </Link>

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-gold">
            Inventory
          </p>
          <h1 className="mt-3 font-serif text-4xl text-jewel">{stone.name}</h1>
          <p className="mt-2 text-sm capitalize text-ink-soft">
            {stone.type}
            {stone.featured ? " · Featured" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/gemstones/${stone.id}/edit`}
            className="rounded-full bg-jewel px-5 py-2 text-sm text-[#f7f1e8]"
          >
            Edit
          </Link>
          <DeleteGemstoneButton id={stone.id} name={stone.name} />
        </div>
      </div>

      {stone.images.length > 0 ? (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {stone.images.map((image, index) => (
            <div
              key={image.publicId}
              className="relative aspect-square overflow-hidden rounded-2xl bg-card"
            >
              <Image
                src={image.url}
                alt={`${stone.name} ${index + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 200px"
              />
              {index === 0 ? (
                <span className="absolute left-2 top-2 rounded-full bg-jewel/90 px-2 py-0.5 text-[10px] uppercase tracking-wider text-[#f7f1e8]">
                  Cover
                </span>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      <p className="mt-8 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">
        {stone.description}
      </p>

      <dl className="mt-8 grid gap-4 sm:grid-cols-2">
        {[
          ["Colour", stone.color],
          ["Cut", stone.cut],
          ["Clarity", stone.clarity],
          ["Origin", stone.origin],
          ["Carat", String(stone.carat)],
          ["Price", stone.price.toLocaleString()],
          ["Stock", String(stone.stock)],
          ["Slug", stone.slug],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-gold/20 bg-card px-4 py-3"
          >
            <dt className="text-xs uppercase tracking-[0.16em] text-gold">
              {label}
            </dt>
            <dd className="mt-1 text-sm text-jewel">{value}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}

export default function GemstoneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Loading gemstone…
        </main>
      }
    >
      <GemstoneDetailLoader params={params} />
    </Suspense>
  );
}

async function GemstoneDetailLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GemstoneDetail id={id} />;
}
