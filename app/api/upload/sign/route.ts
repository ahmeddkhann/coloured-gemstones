import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { isCloudinaryConfigured, signUpload } from "@/lib/cloudinary";
import { requireAdmin } from "@/lib/require-admin";
import { uploadSignSchema } from "@/lib/validations";

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
    const parsed = uploadSignSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    return jsonOk(signUpload(parsed.data.resourceType));
  } catch (error) {
    return handleRouteError(error);
  }
}
