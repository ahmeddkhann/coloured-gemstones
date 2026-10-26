"use client";

import Image from "next/image";
import { useRef, useState } from "react";

export type GemstoneImageValue = {
  url: string;
  publicId: string;
};

type Props = {
  value: GemstoneImageValue[];
  onChange: (images: GemstoneImageValue[]) => void;
  disabled?: boolean;
};

const MAX_IMAGES = 5;

export function GemstoneImageField({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const remaining = MAX_IMAGES - value.length;

  async function destroyRemote(publicId: string) {
    await fetch("/api/upload/destroy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ publicId }),
    });
  }

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0 || remaining <= 0) {
      return;
    }

    setError("");
    setUploading(true);

    const toUpload = Array.from(files).slice(0, remaining);
    const next = [...value];

    try {
      for (const file of toUpload) {
        const form = new FormData();
        form.append("file", file);
        const response = await fetch("/api/upload", {
          method: "POST",
          body: form,
        });
        const payload = (await response.json()) as {
          ok: boolean;
          error?: string;
          data?: GemstoneImageValue;
        };
        if (!response.ok || !payload.ok || !payload.data) {
          throw new Error(payload.error || "Upload failed.");
        }
        next.push(payload.data);
      }
      onChange(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function removeAt(index: number) {
    const image = value[index];
    if (!image) {
      return;
    }
    setError("");
    try {
      await destroyRemote(image.publicId);
      onChange(value.filter((_, i) => i !== index));
    } catch {
      setError("Could not remove image from Cloudinary.");
    }
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= value.length) {
      return;
    }
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onChange(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-soft">
          Images ({value.length}/{MAX_IMAGES}) · first is cover
        </p>
        <button
          type="button"
          disabled={disabled || uploading || remaining <= 0}
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-gold/40 px-4 py-1.5 text-xs text-jewel hover:bg-gold/10 disabled:opacity-50"
        >
          {uploading ? "Uploading…" : remaining > 0 ? "Add images" : "Limit reached"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          disabled={disabled || uploading || remaining <= 0}
          onChange={(event) => void onFilesSelected(event.target.files)}
        />
      </div>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      {value.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-gold/30 px-4 py-8 text-center text-sm text-ink-soft">
          Upload at least one photo. Up to {MAX_IMAGES} images.
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {value.map((image, index) => (
            <li
              key={image.publicId}
              className="flex items-center gap-3 rounded-xl border border-gold/20 bg-card p-2"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-background">
                <Image
                  src={image.url}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gold">
                  {index === 0 ? "Cover" : `Image ${index + 1}`}
                </p>
                <p className="truncate text-xs text-ink-soft">{image.publicId}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <button
                  type="button"
                  aria-label="Move up"
                  disabled={disabled || index === 0}
                  onClick={() => move(index, -1)}
                  className="rounded-lg border border-gold/30 px-2 py-1 text-xs disabled:opacity-40"
                >
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  disabled={disabled || index === value.length - 1}
                  onClick={() => move(index, 1)}
                  className="rounded-lg border border-gold/30 px-2 py-1 text-xs disabled:opacity-40"
                >
                  ↓
                </button>
                <button
                  type="button"
                  aria-label="Remove"
                  disabled={disabled}
                  onClick={() => void removeAt(index)}
                  className="rounded-lg border border-red-700/40 px-2 py-1 text-xs text-red-700"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
