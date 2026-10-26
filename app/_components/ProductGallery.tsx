"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

type ImageItem = { url: string; publicId: string };

type Props = {
  name: string;
  images: ImageItem[];
};

export function ProductGallery({ name, images }: Props) {
  const [active, setActive] = useState(0);
  const [enlarged, setEnlarged] = useState(false);
  const current = images[active] ?? images[0];

  useEffect(() => {
    if (!enlarged) {
      return;
    }

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setEnlarged(false);
      }
      if (event.key === "ArrowRight" && images.length > 1) {
        setActive((value) => (value + 1) % images.length);
      }
      if (event.key === "ArrowLeft" && images.length > 1) {
        setActive((value) => (value - 1 + images.length) % images.length);
      }
    }

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [enlarged, images.length]);

  if (!current) {
    return (
      <div className="aspect-square rounded-3xl border border-dashed border-gold/30 bg-card" />
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setEnlarged(true)}
        className="group relative block aspect-square w-full overflow-hidden rounded-3xl bg-card text-left"
        aria-label={`Enlarge photo of ${name}`}
      >
        <Image
          src={current.url}
          alt={name}
          fill
          priority
          className="object-cover transition duration-500 group-hover:scale-[1.02]"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        <span className="absolute bottom-4 right-4 rounded-full bg-[#1a1612]/75 px-3 py-1.5 text-[10px] uppercase tracking-[0.18em] text-[#f7f1e8] opacity-0 transition group-hover:opacity-100">
          Enlarge
        </span>
      </button>

      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, index) => (
            <button
              key={image.publicId}
              type="button"
              onClick={() => setActive(index)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border ${
                index === active
                  ? "border-jewel"
                  : "border-gold/20 opacity-80 hover:opacity-100"
              }`}
              aria-label={`Show image ${index + 1}`}
            >
              <Image
                src={image.url}
                alt=""
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      ) : null}

      {enlarged ? (
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
              src={(images[active] ?? current).url}
              alt={name}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>
          {images.length > 1 ? (
            <>
              <button
                type="button"
                aria-label="Previous image"
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-[#f7f1e8]/30 px-3 py-2 text-[#f7f1e8]"
                onClick={(event) => {
                  event.stopPropagation();
                  setActive((value) => (value - 1 + images.length) % images.length);
                }}
              >
                ←
              </button>
              <button
                type="button"
                aria-label="Next image"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-[#f7f1e8]/30 px-3 py-2 text-[#f7f1e8]"
                onClick={(event) => {
                  event.stopPropagation();
                  setActive((value) => (value + 1) % images.length);
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
