"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import {
  destroyCloudinaryAsset,
  uploadFileToCloudinary,
  type CloudinaryMediaValue,
} from "@/app/admin/_components/uploadToCloudinary";

export type GemstoneImageValue = CloudinaryMediaValue;
export type GemstoneVideoValue = CloudinaryMediaValue;

type Props = {
  images: GemstoneImageValue[];
  videos: GemstoneVideoValue[];
  onImagesChange: (images: GemstoneImageValue[]) => void;
  onVideosChange: (videos: GemstoneVideoValue[]) => void;
  disabled?: boolean;
};

const MAX_IMAGES = 5;
const MAX_VIDEOS = 3;
const IMAGE_MAX = 8 * 1024 * 1024;
const VIDEO_MAX = 50 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4", "video/webm", "video/quicktime"]);

function isVideoFile(file: File) {
  return VIDEO_TYPES.has(file.type) || /\.(mp4|webm|mov)$/i.test(file.name);
}

function isImageFile(file: File) {
  return IMAGE_TYPES.has(file.type) || /\.(jpe?g|png|webp)$/i.test(file.name);
}

export function GemstoneMediaField({
  images,
  videos,
  onImagesChange,
  onVideosChange,
  disabled,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const imagesLeft = MAX_IMAGES - images.length;
  const videosLeft = MAX_VIDEOS - videos.length;
  const canUpload = imagesLeft > 0 || videosLeft > 0;

  async function processFiles(fileList: FileList | File[] | null) {
    if (!fileList || (Array.isArray(fileList) ? fileList.length === 0 : fileList.length === 0)) {
      return;
    }

    setError("");
    setUploading(true);
    setProgress(0);

    let nextImages = [...images];
    let nextVideos = [...videos];

    try {
      for (const file of Array.from(fileList)) {
        if (isImageFile(file)) {
          if (nextImages.length >= MAX_IMAGES) {
            throw new Error(`You can add at most ${MAX_IMAGES} photos.`);
          }
          if (file.size > IMAGE_MAX) {
            throw new Error("Image must be 8MB or smaller.");
          }
          setProgress(0);
          nextImages.push(
            await uploadFileToCloudinary(file, "image", {
              onProgress: setProgress,
            }),
          );
          onImagesChange([...nextImages]);
          continue;
        }

        if (isVideoFile(file)) {
          if (nextVideos.length >= MAX_VIDEOS) {
            throw new Error(`You can add at most ${MAX_VIDEOS} videos.`);
          }
          if (file.size > VIDEO_MAX) {
            throw new Error("Video must be 50MB or smaller.");
          }
          setProgress(0);
          nextVideos.push(
            await uploadFileToCloudinary(file, "video", {
              onProgress: setProgress,
            }),
          );
          onVideosChange([...nextVideos]);
          continue;
        }

        throw new Error("Use JPEG/PNG/WebP photos or MP4/WebM videos.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
      setProgress(0);
      setDragging(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function removeImage(index: number) {
    const image = images[index];
    if (!image) return;
    setError("");
    try {
      await destroyCloudinaryAsset(image.publicId, "image");
      onImagesChange(images.filter((_, i) => i !== index));
    } catch {
      setError("Could not remove image.");
    }
  }

  async function removeVideo(index: number) {
    const video = videos[index];
    if (!video) return;
    setError("");
    try {
      await destroyCloudinaryAsset(video.publicId, "video");
      onVideosChange(videos.filter((_, i) => i !== index));
    } catch {
      setError("Could not remove video.");
    }
  }

  function moveImage(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    onImagesChange(next);
  }

  return (
    <div>
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled && canUpload) setDragging(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragging(false);
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (disabled || !canUpload) return;
          void processFiles(event.dataTransfer.files);
        }}
        className={`admin-dropzone flex min-h-52 flex-col items-center justify-center rounded-xl px-6 py-10 text-center transition ${
          dragging ? "border-solid border-jewel bg-jewel/5" : ""
        }`}
      >
        <p className="text-sm font-medium text-black">
          Add up to {MAX_IMAGES} photos and {MAX_VIDEOS} videos
          <span className="text-red-600"> *</span>
        </p>
        <p className="mt-2 text-sm text-[var(--admin-muted)]">
          Drag and drop files or click Upload
        </p>
        <button
          type="button"
          disabled={disabled || uploading || !canUpload}
          onClick={() => inputRef.current?.click()}
          className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[var(--admin-field-border)] bg-white px-5 py-2.5 text-sm font-medium text-black shadow-sm hover:bg-[#f3f4f6] disabled:opacity-50"
        >
          <span className="text-lg leading-none">+</span>
          {uploading ? `Uploading ${progress}%` : "Upload"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov"
          multiple
          className="hidden"
          disabled={disabled || uploading || !canUpload}
          onChange={(event) => void processFiles(event.target.files)}
        />
        {uploading ? (
          <progress
            className="mt-4 h-1.5 w-40 accent-[var(--jewel)]"
            value={progress}
            max={100}
          />
        ) : null}
      </div>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}

      {images.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--admin-muted)]">
            Photos · first is cover
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {images.map((image, index) => (
              <li
                key={image.publicId}
                className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-white"
              >
                <div className="relative aspect-square bg-[#f3f4f6]">
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                  {index === 0 ? (
                    <span className="absolute left-2 top-2 rounded-full bg-jewel px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-[#f7f1e8]">
                      Cover
                    </span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-1 border-t border-[var(--admin-border)] px-2 py-1.5">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      aria-label="Move left"
                      disabled={disabled || index === 0}
                      onClick={() => moveImage(index, -1)}
                      className="rounded px-1.5 text-xs text-[var(--admin-muted)] disabled:opacity-30"
                    >
                      ←
                    </button>
                    <button
                      type="button"
                      aria-label="Move right"
                      disabled={disabled || index === images.length - 1}
                      onClick={() => moveImage(index, 1)}
                      className="rounded px-1.5 text-xs text-[var(--admin-muted)] disabled:opacity-30"
                    >
                      →
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void removeImage(index)}
                    className="rounded px-1.5 text-xs text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {videos.length > 0 ? (
        <div className="mt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--admin-muted)]">
            Videos ({videos.length}/{MAX_VIDEOS})
          </p>
          <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {videos.map((video, index) => (
              <li
                key={video.publicId}
                className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-white"
              >
                <div className="aspect-square bg-[#f3f4f6]">
                  <video
                    src={video.url}
                    muted
                    playsInline
                    controls
                    preload="metadata"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex justify-end border-t border-[var(--admin-border)] px-2 py-1.5">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => void removeVideo(index)}
                    className="rounded px-1.5 text-xs text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
