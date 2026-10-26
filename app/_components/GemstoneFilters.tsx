"use client";

import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";

import { GEMSTONE_TYPES } from "@/lib/constants";

type Props = {
  colors: string[];
  type?: string;
  color?: string;
  sort?: string;
  /** Keep hash on home catalog, e.g. "#collection" */
  hash?: string;
};

const selectClass =
  "rounded-xl border border-gold/30 bg-background px-3 py-2 text-sm text-jewel outline-none focus:border-gold";

export function GemstoneFilters({
  colors,
  type = "",
  color = "",
  sort = "featured",
  hash = "",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function apply(next: {
    type?: string;
    color?: string;
    sort?: string;
  }) {
    const params = new URLSearchParams();
    const nextType = next.type ?? type;
    const nextColor = next.color ?? color;
    const nextSort = next.sort ?? sort;

    if (nextType) {
      params.set("type", nextType);
    }
    if (nextColor) {
      params.set("color", nextColor);
    }
    if (nextSort && nextSort !== "featured") {
      params.set("sort", nextSort);
    }

    const qs = params.toString();
    const href = `${pathname}${qs ? `?${qs}` : ""}${hash}`;
    startTransition(() => {
      router.push(href);
    });
  }

  function clear() {
    startTransition(() => {
      router.push(`${pathname}${hash}`);
    });
  }

  const hasFilters = Boolean(type || color || (sort && sort !== "featured"));

  return (
    <div
      className={`mt-6 flex flex-wrap items-end gap-3 ${pending ? "opacity-70" : ""}`}
    >
      <label className="text-xs text-ink-soft">
        Type
        <select
          className={`mt-1 block ${selectClass}`}
          value={type}
          onChange={(event) => apply({ type: event.target.value })}
        >
          <option value="">All types</option>
          {GEMSTONE_TYPES.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs text-ink-soft">
        Colour
        <select
          className={`mt-1 block min-w-36 ${selectClass}`}
          value={color}
          onChange={(event) => apply({ color: event.target.value })}
        >
          <option value="">All colours</option>
          {colors.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>

      <label className="text-xs text-ink-soft">
        Price
        <select
          className={`mt-1 block ${selectClass}`}
          value={sort}
          onChange={(event) => apply({ sort: event.target.value })}
        >
          <option value="featured">Default</option>
          <option value="price-asc">Low to high</option>
          <option value="price-desc">High to low</option>
        </select>
      </label>

      {hasFilters ? (
        <button
          type="button"
          onClick={clear}
          className="rounded-full border border-gold/40 px-4 py-2 text-xs text-jewel hover:bg-gold/10"
        >
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
