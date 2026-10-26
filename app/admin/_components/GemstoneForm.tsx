"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  GemstoneImageField,
  type GemstoneImageValue,
} from "@/app/admin/_components/GemstoneImageField";
import { GEMSTONE_TYPES } from "@/lib/constants";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/30 bg-background px-4 py-3 text-sm outline-none focus:border-gold";

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
};

export function GemstoneForm({ mode, gemstoneId, initial }: Props) {
  const router = useRouter();
  const [values, setValues] = useState<GemstoneFormValues>({
    ...empty,
    ...initial,
    images: initial?.images ?? [],
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
      setError("Add at least one image.");
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
    <form onSubmit={submit} className="mt-8 w-full">
      <div className="grid w-full gap-8 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:items-start">
        <div className="space-y-5">
          <label className="block text-sm">
            Name
            <input
              className={fieldClass}
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </label>

          <label className="block text-sm">
            Description
            <textarea
              className={`${fieldClass} min-h-36`}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              required
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <label className="block text-sm">
              Type
              <select
                className={fieldClass}
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
            </label>

            <label className="block text-sm">
              Colour
              <input
                className={fieldClass}
                value={values.color}
                onChange={(e) => set("color", e.target.value)}
                required
              />
            </label>

            <label className="block text-sm">
              Cut
              <input
                className={fieldClass}
                value={values.cut}
                onChange={(e) => set("cut", e.target.value)}
                required
              />
            </label>

            <label className="block text-sm">
              Clarity
              <input
                className={fieldClass}
                value={values.clarity}
                onChange={(e) => set("clarity", e.target.value)}
                required
              />
            </label>

            <label className="block text-sm sm:col-span-2 lg:col-span-2">
              Origin
              <input
                className={fieldClass}
                value={values.origin}
                onChange={(e) => set("origin", e.target.value)}
                required
              />
            </label>

            <label className="block text-sm">
              Carat
              <input
                type="number"
                min={0}
                step="0.01"
                className={fieldClass}
                value={values.carat}
                onChange={(e) => set("carat", Number(e.target.value))}
                required
              />
            </label>

            <label className="block text-sm">
              Price
              <input
                type="number"
                min={0}
                step="0.01"
                className={fieldClass}
                value={values.price}
                onChange={(e) => set("price", Number(e.target.value))}
                required
              />
            </label>

            <label className="block text-sm">
              Stock
              <input
                type="number"
                min={0}
                step={1}
                className={fieldClass}
                value={values.stock}
                onChange={(e) => set("stock", Number(e.target.value))}
                required
              />
            </label>

            <label className="flex items-center gap-3 pt-6 text-sm sm:col-span-2 lg:col-span-3">
              <input
                type="checkbox"
                checked={values.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="h-4 w-4 accent-[var(--jewel)]"
              />
              Featured on the storefront
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-card p-5 lg:sticky lg:top-20">
          <p className="text-sm font-medium text-jewel">Images</p>
          <p className="mt-1 text-xs text-ink-soft">
            Up to five photos. First image is the cover.
          </p>
          <div className="mt-4">
            <GemstoneImageField
              value={values.images}
              onChange={(images) => set("images", images)}
              disabled={pending}
            />
          </div>
        </div>
      </div>

      {error ? <p className="mt-6 text-sm text-red-700">{error}</p> : null}

      <div className="mt-8 border-t border-gold/15 pt-6">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-jewel px-8 py-3 text-sm text-[#f7f1e8] disabled:opacity-60"
        >
          {pending
            ? "Saving…"
            : mode === "create"
              ? "Create gemstone"
              : "Save changes"}
        </button>
      </div>
    </form>
  );
}
