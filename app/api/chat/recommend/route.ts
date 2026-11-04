import { recommendFromPreferences } from "@/lib/chat/recommend";
import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { chatRecommendSchema } from "@/lib/validations";

const REQUEST_TIMEOUT_MS = 25_000;

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = chatRecommendSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const result = await recommendFromPreferences(
        parsed.data.preferences,
        parsed.data.messages,
        controller.signal,
      );
      return jsonOk(result);
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return jsonError("The assistant took too long. Please try again.", 504);
      }
      console.error("Recommend failed", error);
      return jsonError("Could not build recommendations right now.", 502);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
