import "server-only";

import { v2 as cloudinary } from "cloudinary";

export function isCloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

function configure() {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

export async function uploadImageBuffer(buffer: Buffer, filename: string) {
  configure();

  return new Promise<{ url: string; publicId: string }>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER || "coloured-gemstones",
        resource_type: "image",
        filename_override: filename,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed."));
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      },
    );

    stream.end(buffer);
  });
}

export async function destroyImages(publicIds: string[]) {
  if (!isCloudinaryConfigured() || publicIds.length === 0) {
    return;
  }

  configure();
  await Promise.all(
    publicIds.map((publicId) =>
      cloudinary.uploader.destroy(publicId).catch((error) => {
        console.error("Cloudinary destroy failed", publicId, error);
      }),
    ),
  );
}
