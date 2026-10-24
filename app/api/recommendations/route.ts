import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { connectDB } from "@/lib/mongodb";
import { recommendForSlug } from "@/lib/recommendations";
import { recommendationsSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = recommendationsSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    await connectDB();
    const result = await recommendForSlug(parsed.data.slug);
    if (!result) {
      return jsonError("Gemstone not found.", 404);
    }

    return jsonOk(result);
  } catch (error) {
    return handleRouteError(error);
  }
}
