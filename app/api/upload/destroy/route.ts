import { z } from "zod";

import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import {
  destroyImages,
  destroyVideos,
  isCloudinaryConfigured,
} from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/require-admin";

const destroySchema = z.object({
  publicId: z.string().min(1, "publicId is required."),
  resourceType: z.enum(["image", "video"]).default("image"),
});

export async function POST(request: Request) {
  try {
    const auth = await requireAdmin();
    if (auth.error) {
      return auth.error;
    }

    if (!isCloudinaryConfigured()) {
      return jsonError("Cloudinary is not configured.", 501);
    }

    const body = await readJson(request);
    const parsed = destroySchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    const { publicId, resourceType } = parsed.data;
    if (resourceType === "video") {
      await destroyVideos([publicId]);
    } else {
      await destroyImages([publicId]);
    }

    return jsonOk({ publicId, resourceType });
  } catch (error) {
    return handleRouteError(error);
  }
}
