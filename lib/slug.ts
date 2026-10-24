import slugify from "slugify";

import { GemstoneModel } from "@/lib/models/Gemstone";

export function toSlug(name: string) {
  return slugify(name, { lower: true, strict: true });
}

export async function uniqueGemstoneSlug(name: string, excludeId?: string) {
  const base = toSlug(name) || "gemstone";
  let slug = base;
  let n = 2;

  while (
    await GemstoneModel.exists({
      slug,
      ...(excludeId ? { _id: { $ne: excludeId } } : {}),
    })
  ) {
    slug = `${base}-${n}`;
    n += 1;
  }

  return slug;
}
