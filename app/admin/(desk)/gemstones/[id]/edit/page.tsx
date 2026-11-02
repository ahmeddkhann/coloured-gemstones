import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { isValidObjectId } from "mongoose";

import { GemstoneForm } from "@/app/admin/_components/GemstoneForm";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { serializeDoc } from "@/lib/serialize";
import { GEMSTONE_TYPES } from "@/lib/constants";

async function EditGemstone({ id }: { id: string }) {
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

  const stone = serializeDoc(doc) as {
    id: string;
    name: string;
    description: string;
    type: (typeof GEMSTONE_TYPES)[number];
    color: string;
    cut: string;
    clarity: string;
    origin: string;
    carat: number;
    price: number;
    stock: number;
    featured: boolean;
    images: { url: string; publicId: string }[];
    videos?: { url: string; publicId: string }[];
  };

  return (
    <main className="w-full flex-1 bg-white px-5 py-8 text-black lg:px-10">
      <p className="text-sm text-[var(--admin-muted)]">
        <Link href="/admin/gemstones" className="hover:text-black">
          Gemstones
        </Link>
        <span className="mx-2">›</span>
        <span className="text-black">Edit listing</span>
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-black">
        Edit listing
      </h1>
      <p className="mt-1 text-sm text-[var(--admin-muted)]">{stone.name}</p>
      <div className="mt-2 max-w-4xl">
        <GemstoneForm
          mode="edit"
          gemstoneId={stone.id}
          initial={{
            name: stone.name,
            description: stone.description,
            type: stone.type,
            color: stone.color,
            cut: stone.cut,
            clarity: stone.clarity,
            origin: stone.origin,
            carat: stone.carat,
            price: stone.price,
            stock: stone.stock,
            featured: stone.featured,
            images: stone.images,
            videos: stone.videos ?? [],
          }}
        />
      </div>
    </main>
  );
}

export default function EditGemstonePage({
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
      <EditGemstoneLoader params={params} />
    </Suspense>
  );
}

async function EditGemstoneLoader({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EditGemstone id={id} />;
}
