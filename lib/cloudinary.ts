import "server-only";

import { v2 as cloudinary } from "cloudinary";

export type CloudinaryResourceType = "image" | "video";

export type CloudinaryMediaRef = {
  url: string;
  publicId: string;
};

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

function folder() {
  return process.env.CLOUDINARY_FOLDER || "coloured-gemstones";
}

export function signUpload(resourceType: CloudinaryResourceType) {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }

  configure();

  const timestamp = Math.round(Date.now() / 1000);
  const uploadFolder = folder();
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder: uploadFolder },
    apiSecret,
  );

  return {
    signature,
    timestamp,
    folder: uploadFolder,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    resourceType,
  };
}

/**
 * Confirm the asset exists in our Cloudinary account and return trusted URL.
 * Do not trust client-supplied urls alone.
 */
export async function assertCloudinaryMedia(
  publicId: string,
  resourceType: CloudinaryResourceType,
): Promise<CloudinaryMediaRef> {
  if (!isCloudinaryConfigured()) {
    throw new Error("Cloudinary is not configured.");
  }

  configure();

  try {
    const resource = await cloudinary.api.resource(publicId, {
      resource_type: resourceType,
    });

    if (!resource?.secure_url || !resource.public_id) {
      throw new Error(`Cloudinary ${resourceType} not found.`);
    }

    if (resource.resource_type && resource.resource_type !== resourceType) {
      throw new Error(`Expected a ${resourceType} asset.`);
    }

    return {
      url: resource.secure_url as string,
      publicId: resource.public_id as string,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : `Could not verify Cloudinary ${resourceType}.`;
    throw new Error(message);
  }
}

export async function verifyMediaList(
  items: CloudinaryMediaRef[] | undefined,
  resourceType: CloudinaryResourceType,
): Promise<CloudinaryMediaRef[] | undefined> {
  if (!items) {
    return undefined;
  }

  return Promise.all(
    items.map((item) => assertCloudinaryMedia(item.publicId, resourceType)),
  );
}

export async function destroyImages(publicIds: string[]) {
  await destroyAssets(publicIds, "image");
}

export async function destroyVideos(publicIds: string[]) {
  await destroyAssets(publicIds, "video");
}

async function destroyAssets(
  publicIds: string[],
  resourceType: CloudinaryResourceType,
) {
  if (!isCloudinaryConfigured() || publicIds.length === 0) {
    return;
  }

  configure();
  await Promise.all(
    publicIds.map((publicId) =>
      cloudinary.uploader
        .destroy(publicId, { resource_type: resourceType })
        .catch((error) => {
          console.error("Cloudinary destroy failed", publicId, error);
        }),
    ),
  );
}
