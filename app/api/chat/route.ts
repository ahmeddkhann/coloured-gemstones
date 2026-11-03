import {
  formatCatalogForPrompt,
  getInStockCatalogForAi,
} from "@/lib/chat/catalog-for-ai";
import { buildSystemMessage } from "@/lib/chat/system-prompt";
import { getRagContext } from "@/lib/chat/rag";
import { handleRouteError, jsonError, jsonOk, readJson, zodError } from "@/lib/api";
import { chatWithGroq, type GroqChatMessage } from "@/lib/groq";
import { chatRequestSchema } from "@/lib/validations";

const MAX_HISTORY = 12;
const REQUEST_TIMEOUT_MS = 25_000;

export async function POST(request: Request) {
  try {
    const body = await readJson(request);
    const parsed = chatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return zodError(parsed.error);
    }

    if (!process.env.GROQ_API_KEY?.trim()) {
      return jsonError("Chat is temporarily unavailable.", 503);
    }

    const history = parsed.data.messages.slice(-MAX_HISTORY);
    const latestUser = [...history].reverse().find((message) => message.role === "user");
    if (!latestUser) {
      return jsonError("Send a user message.", 400);
    }

    const [ragContext, catalog] = await Promise.all([
      getRagContext(latestUser.content),
      getInStockCatalogForAi(),
    ]);
    const liveCatalog = formatCatalogForPrompt(catalog);
    const messages: GroqChatMessage[] = [
      {
        role: "system",
        content: buildSystemMessage(ragContext, liveCatalog),
      },
      ...history.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const reply = await chatWithGroq(messages, { signal: controller.signal });
      return jsonOk({ reply });
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return jsonError("The assistant took too long. Please try again.", 504);
      }
      console.error("Groq chat failed", error);
      return jsonError("The assistant could not reply right now.", 502);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
