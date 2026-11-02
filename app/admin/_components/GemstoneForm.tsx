"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  GemstoneMediaField,
  type GemstoneImageValue,
  type GemstoneVideoValue,
} from "@/app/admin/_components/GemstoneMediaField";
import { GEMSTONE_TYPES } from "@/lib/constants";

export type GemstoneFormValues = {
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
  images: GemstoneImageValue[];
  videos: GemstoneVideoValue[];
};

type Props = {
  mode: "create" | "edit";
  gemstoneId?: string;
  initial?: Partial<GemstoneFormValues>;
};

const empty: GemstoneFormValues = {
  name: "",
  description: "",
  type: "sapphire",
  color: "",
  cut: "",
  clarity: "",
  origin: "",
  carat: 0,
  price: 0,
  stock: 0,
  featured: false,
  images: [],
  videos: [],
};

function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <section className="admin-card p-5 sm:p-6">
      <div className="border-b border-[var(--admin-border)] pb-4">
        <h2 className="text-base font-semibold text-black">{title}</h2>
        <p className="mt-1 text-sm text-[var(--admin-muted)]">{hint}</p>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  className = "",
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="block text-sm font-medium text-black">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </label>
      {children}
    </div>
  );
}

export function GemstoneForm({ mode, gemstoneId, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<GemstoneFormValues>({
    ...empty,
    ...initial,
    images: initial?.images ?? [],
    videos: initial?.videos ?? [],
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  function set<K extends keyof GemstoneFormValues>(
    key: K,
    value: GemstoneFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (values.images.length < 1) {
      setError("Add at least one photo.");
      return;
    }

    setPending(true);

    try {
      const body = {
        name: values.name.trim(),
        description: values.description.trim(),
        type: values.type,
        color: values.color.trim(),
        cut: values.cut.trim(),
        clarity: values.clarity.trim(),
        origin: values.origin.trim(),
        carat: Number(values.carat),
        price: Number(values.price),
        stock: Number(values.stock),
        featured: values.featured,
        images: values.images,
        videos: values.videos,
      };

      const response = await fetch(
        mode === "create"
          ? "/api/gemstones"
          : `/api/gemstones/${gemstoneId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
      );
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
      };

      if (!response.ok || !payload.ok) {
        setError(payload.error ?? "Could not save the gemstone.");
        return;
      }

      router.push("/admin/gemstones");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 space-y-5 pb-10">
      <SectionCard
        title="Photo and video"
        hint="Tip: buyers respond to clear close-ups and a short clip showing the stone in light."
      >
        <GemstoneMediaField
          images={values.images}
          videos={values.videos}
          onImagesChange={(images) => set("images", images)}
          onVideosChange={(videos) => set("videos", videos)}
          disabled={pending}
        />
      </SectionCard>

      <SectionCard
        title="Details"
        hint="Name, type, and the story behind the stone."
      >
        <div className="space-y-4">
          <Field label="Title" required>
            <input
              className="admin-field"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Royal blue sapphire, 2.14 ct"
              required
            />
          </Field>

          <Field label="Description" required>
            <textarea
              className="admin-field"
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Origin, colour notes, and what makes this stone special."
              required
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type" required>
              <select
                className="admin-field"
                value={values.type}
                onChange={(e) =>
                  set("type", e.target.value as GemstoneFormValues["type"])
                }
              >
                {GEMSTONE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Colour" required>
              <input
                className="admin-field"
                value={values.color}
                onChange={(e) => set("color", e.target.value)}
                placeholder="e.g. Cornflower blue"
                required
              />
            </Field>

            <Field label="Cut" required>
              <input
                className="admin-field"
                value={values.cut}
                onChange={(e) => set("cut", e.target.value)}
                placeholder="e.g. Oval"
                required
              />
            </Field>

            <Field label="Clarity" required>
              <input
                className="admin-field"
                value={values.clarity}
                onChange={(e) => set("clarity", e.target.value)}
                placeholder="e.g. VS"
                required
              />
            </Field>

            <Field label="Origin" required className="sm:col-span-2">
              <input
                className="admin-field"
                value={values.origin}
                onChange={(e) => set("origin", e.target.value)}
                placeholder="e.g. Sri Lanka"
                required
              />
            </Field>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Pricing & stock"
        hint="Price in your store currency. Stock controls availability."
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Carat" required>
            <input
              type="number"
              min={0}
              step="0.01"
              className="admin-field"
              value={values.carat}
              onChange={(e) => set("carat", Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Price" required>
            <input
              type="number"
              min={0}
              step="0.01"
              className="admin-field"
              value={values.price}
              onChange={(e) => set("price", Number(e.target.value))}
              required
            />
          </Field>
          <Field label="Stock" required>
            <input
              type="number"
              min={0}
              step={1}
              className="admin-field"
              value={values.stock}
              onChange={(e) => set("stock", Number(e.target.value))}
              required
            />
          </Field>
        </div>

        <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-lg border border-[var(--admin-border)] bg-[#f9fafb] px-4 py-3 text-sm text-black">
          <input
            type="checkbox"
            checked={values.featured}
            onChange={(e) => set("featured", e.target.checked)}
            className="h-4 w-4 accent-[var(--jewel)]"
          />
          Feature this listing on the storefront
        </label>
      </SectionCard>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 border-t border-[var(--admin-border)] pt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-jewel px-6 py-2.5 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Publish listing"
              : "Save changes"}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => router.push("/admin/gemstones")}
          className="rounded-lg border border-[var(--admin-border)] bg-white px-5 py-2.5 text-sm text-black hover:bg-[#f9fafb]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
