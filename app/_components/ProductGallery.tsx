"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { cardImageUrl, detailImageUrl } from "@/lib/media-url";

type MediaItem = {
  kind: "image" | "video";
  url: string;
  publicId: string;
};

type Props = {
  name: string;
  images: { url: string; publicId: string }[];
  videos?: { url: string; publicId: string }[];
};

export function ProductGallery({ name, images, videos = [] }: Props) {
  const media = useMemo<MediaItem[]>(
    () => [
      ...images.map((image) => ({ ...image, kind: "image" as const })),
      ...videos.map((video) => ({ ...video, kind: "video" as const })),
    ],
    [images, videos],
  );

  const [active, setActive] = useState(0);
  const [enlarged, setEnlarged] = useState(false);
  const current = media[active] ?? media[0];

  useEffect(() => {
    if (active >= media.length) {
      setActive(0);
    }
  }, [active, media.length]);

  useEffect(() => {
    if (!enlarged) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEnlarged(false);
      }
      if (event.key === "ArrowRight" && media.length > 1) {
        setActive((value) => (value + 1) % media.length);
      }
      if (event.key === "ArrowLeft" && media.length > 1) {
        setActive((value) => (value - 1 + media.length) % media.length);
      }
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [enlarged, media.length]);

  if (!current) {
    return (
      <div className="aspect-square rounded-3xl border border-dashed border-gold/30 bg-card" />
    );
  }

  const isVideo = current.kind === "video";

  return (
    <div>
      {isVideo ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-3xl bg-card">
          <video
            key={current.publicId}
            src={current.url}
            controls
            playsInline
            className="h-full w-full object-contain"
            aria-label={`Video of ${name}`}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setEnlarged(true)}
          className="group relative block aspect-square w-full overflow-hidden rounded-3xl bg-card text-left"
          aria-label={`Enlarge photo of ${name}`}
        >
          <Image
            src={detailImageUrl(current.url)}
            alt={name}
            fill
            priority
            unoptimized
            className="object-cover transition duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
          <span className="absolute bottom-4 right-4 rounded-full bg-[#1a1612]/75 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#f7f1e8] opacity-0 transition group-hover:opacity-100">
            Enlarge
          </span>
        </button>
      )}

      {media.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {media.map((item, index) => (
            <button
              key={item.publicId}
              type="button"
              onClick={() => setActive(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border ${
                index === active
                  ? "border-jewel"
                  : "border-gold/20 opacity-80 hover:opacity-100"
              }`}
              aria-label={
                item.kind === "video"
                  ? `Show video ${index + 1}`
                  : `Show image ${index + 1}`
              }
            >
              {item.kind === "video" ? (
                <>
                  <video
                    src={item.url}
                    muted
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                  <span className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#1a1612]/35 text-[10px] uppercase tracking-wider text-[#f7f1e8]">
                    Play
                  </span>
                </>
              ) : (
                <Image
                  src={cardImageUrl(item.url)}
                  alt=""
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="64px"
                />
              )}
            </button>
          ))}
        </div>
      ) : null}

      {enlarged && current.kind === "image" ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Enlarged view of ${name}`}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1a1612]/92 p-4"
          onClick={() => setEnlarged(false)}
        >
          <button
            type="button"
            className="absolute right-4 top-4 rounded-full border border-[#f7f1e8]/30 px-4 py-2 text-sm text-[#f7f1e8]"
            onClick={() => setEnlarged(false)}
          >
            Close
          </button>
          <div
            className="relative h-[min(85vh,900px)] w-full max-w-5xl"
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={detailImageUrl(current.url)}
              alt={name}
              fill
              unoptimized
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
          {media.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous media"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-[#f7f1e8]/30 px-3 py-2 text-[#f7f1e8]"
                onClick={(event) => {
                  event.stopPropagation();
                  setActive((value) => (value - 1 + media.length) % media.length);
                }}
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next media"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-[#f7f1e8]/30 px-3 py-2 text-[#f7f1e8]"
                onClick={(event) => {
                  event.stopPropagation();
                  setActive((value) => (value + 1) % media.length);
                }}
              >
                →
              </button>
            </>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
