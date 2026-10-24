import { handleRouteError, jsonError, jsonOk } from "@/lib/api";
import { isCloudinaryConfigured, uploadImageBuffer } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/require-admin";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 8 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return auth.error;
    }

    if (!isCloudinaryConfigured()) {
      return jsonError("Cloudinary is not configured.", 501);
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return jsonError("Attach an image as `file`.", 400);
    }

    if (!ALLOWED.has(file.type)) {
      return jsonError("Use a JPEG, PNG, or WebP image.", 400);
    }

    if (file.size > MAX_BYTES) {
      return jsonError("Image must be 8MB or smaller.", 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadImageBuffer(buffer, file.name);
    return jsonOk(uploaded, 201);
  } catch (error) {
    return handleRouteError(error);
  }
}
