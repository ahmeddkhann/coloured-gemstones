import "server-only";

export type GroqChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type GroqChatCompletionsResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

const DEFAULT_GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = "openai/gpt-oss-20b";

export async function chatWithGroq(
  messages: GroqChatMessage[],
  options?: { signal?: AbortSignal },
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not configured.");
  }

  const apiUrl = process.env.GROQ_API_URL?.trim() || DEFAULT_GROQ_API_URL;
  const model = process.env.GROQ_MODEL?.trim() || DEFAULT_GROQ_MODEL;

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: options?.signal,
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.4,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | GroqChatCompletionsResponse
    | null;

  if (!response.ok) {
    const detail = payload?.error?.message ?? `Groq HTTP ${response.status}`;
    console.error("Groq API error", {
      status: response.status,
      model,
      detail,
    });
    throw new Error(detail);
  }

  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Empty Groq response.");
  }

  return content;
}
