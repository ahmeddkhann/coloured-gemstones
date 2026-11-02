"use client";

import { useRef, useState } from "react";

import {
  destroyCloudinaryAsset,
  uploadFileToCloudinary,
  type CloudinaryMediaValue,
} from "@/app/admin/_components/uploadToCloudinary";

export type GemstoneVideoValue = CloudinaryMediaValue;

type Props = {
  value: GemstoneVideoValue[];
  onChange: (videos: GemstoneVideoValue[]) => void;
  disabled?: boolean;
};

const MAX_VIDEOS = 3;
const MAX_BYTES = 50 * 1024 * 1024;
const ALLOWED = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function isAllowedVideo(file: File) {
  return ALLOWED.has(file.type) || /\.(mp4|webm|mov)$/i.test(file.name);
}

export function GemstoneVideoField({ value, onChange, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const remaining = MAX_VIDEOS - value.length;

  async function onFilesSelected(files: FileList | null) {
    if (!files || files.length === 0 || remaining <= 0) {
      return;
    }

    setError("");
    setUploading(true);
    setProgress(0);

    const toUpload = Array.from(files).slice(0, remaining);
    const next = [...value];

    try {
      for (const file of toUpload) {
        if (!isAllowedVideo(file)) {
          throw new Error("Use an MP4 or WebM video (H.264 recommended).");
        }
        if (file.size > MAX_BYTES) {
          throw new Error("Video must be 50MB or smaller.");
        }
        setProgress(0);
        next.push(
          await uploadFileToCloudinary(file, "video", {
            onProgress: setProgress,
          }),
        );
        onChange([...next]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function removeAt(index: number) {
    const video = value[index];
    if (!video) {
      return;
    }
    setError("");
    try {
      await destroyCloudinaryAsset(video.publicId, "video");
      onChange(value.filter((_, i) => i !== index));
    } catch {
      setError("Could not remove video from Cloudinary.");
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
          Videos ({value.length}/{MAX_VIDEOS})
        </p>
        <button
          type="button"
          disabled={disabled || uploading || remaining <= 0}
          onClick={() => inputRef.current?.click()}
          className="rounded-full border border-gold/40 px-4 py-1.5 text-xs text-jewel hover:bg-gold/10 disabled:opacity-50"
        >
          {uploading
            ? `Uploading ${progress}%`
            : remaining > 0
              ? "Add video"
              : "Limit reached"}
        </button>
        {uploading ? (
          <progress
            className="h-1.5 w-24 accent-[var(--jewel)]"
            value={progress}
            max={100}
          />
        ) : null}
        <input
          ref={inputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          multiple
          className="hidden"
          disabled={disabled || uploading || remaining <= 0}
          onChange={(event) => void onFilesSelected(event.target.files)}
        />
      </div>

      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}

      {value.length === 0 ? (
        <p className="mt-3 rounded-xl border border-dashed border-gold/30 px-4 py-8 text-center text-sm text-ink-soft">
          Optional. Up to {MAX_VIDEOS} clips (H.264 MP4 or WebM, 50MB each).
        </p>
      ) : (
        <ul className="mt-3 space-y-3">
          {value.map((video, index) => (
            <li
              key={video.publicId}
              className="flex items-center gap-3 rounded-xl border border-gold/20 bg-card p-2"
            >
              <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-background">
                <video
                  src={video.url}
                  muted
                  playsInline
                  preload="metadata"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gold">Video {index + 1}</p>
                <p className="truncate text-xs text-ink-soft">{video.publicId}</p>
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
