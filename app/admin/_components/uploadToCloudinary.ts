export type CloudinaryResourceType = "image" | "video";

export type CloudinaryMediaValue = {
  url: string;
  publicId: string;
};

type SignPayload = {
  ok: boolean;
  error?: string;
  data?: {
    signature: string;
    timestamp: number;
    folder: string;
    apiKey: string;
    cloudName: string;
    resourceType: CloudinaryResourceType;
  };
};

type UploadOptions = {
  onProgress?: (percent: number) => void;
};

/**
 * Signed direct browser → Cloudinary upload.
 * Next.js only mints the signature; file bytes never hit our server.
 */
export async function uploadFileToCloudinary(
  file: File,
  resourceType: CloudinaryResourceType,
  options: UploadOptions = {},
): Promise<CloudinaryMediaValue> {
  const signResponse = await fetch("/api/upload/sign", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resourceType }),
  });
  const signPayload = (await signResponse.json()) as SignPayload;

  if (!signResponse.ok || !signPayload.ok || !signPayload.data) {
    throw new Error(signPayload.error || "Could not prepare upload.");
  }

  const { signature, timestamp, folder, apiKey, cloudName } = signPayload.data;
  const form = new FormData();
  form.append("file", file);
  form.append("api_key", apiKey);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);
  form.append("folder", folder);

  const uploaded = await xhrUpload(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
    form,
    options.onProgress,
  );

  if (!uploaded.secure_url || !uploaded.public_id) {
    throw new Error(
      uploaded.error?.message || `Cloudinary ${resourceType} upload failed.`,
    );
  }

  return { url: uploaded.secure_url, publicId: uploaded.public_id };
}

function xhrUpload(
  url: string,
  form: FormData,
  onProgress?: (percent: number) => void,
): Promise<{
  secure_url?: string;
  public_id?: string;
  error?: { message?: string };
}> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", url);

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable || !onProgress) {
        return;
      }
      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    xhr.onload = () => {
      let data: {
        secure_url?: string;
        public_id?: string;
        error?: { message?: string };
      };
      try {
        data = JSON.parse(xhr.responseText) as typeof data;
      } catch {
        reject(
          new Error(`Cloudinary upload failed (${xhr.status || "network"}).`),
        );
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
        return;
      }

      reject(
        new Error(data.error?.message || `Cloudinary upload failed (${xhr.status}).`),
      );
    };

    xhr.onerror = () => {
      reject(
        new Error(
          "Could not reach Cloudinary. Check your network, or try an H.264 MP4 / WebM.",
        ),
      );
    };

    xhr.onabort = () => {
      reject(new Error("Upload cancelled."));
    };

    xhr.send(form);
  });
}

export async function destroyCloudinaryAsset(
  publicId: string,
  resourceType: CloudinaryResourceType,
) {
  await fetch("/api/upload/destroy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId, resourceType }),
  });
}
