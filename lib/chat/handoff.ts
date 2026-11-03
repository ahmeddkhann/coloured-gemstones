export const QUIZ_HANDOFF_KEY = "cg-quiz-handoff";
export const OPEN_CHAT_EVENT = "cg-open-gemstone-ai";

export type QuizHandoffPayload = {
  preferences: {
    types: string[];
    colours: string[];
    budget: string;
    occasion: string;
    caratFeel: string;
    notes?: string;
  };
  summary: string;
};

export function preferencesSummary(preferences: QuizHandoffPayload["preferences"]) {
  const parts = [
    preferences.types.length ? `types: ${preferences.types.join(", ")}` : null,
    preferences.colours.length
      ? `colours: ${preferences.colours.join(", ")}`
      : null,
    preferences.budget !== "any" ? `budget: ${preferences.budget}` : null,
    preferences.occasion !== "any" ? `occasion: ${preferences.occasion}` : null,
    preferences.caratFeel !== "any" ? `size: ${preferences.caratFeel}` : null,
    preferences.notes?.trim() ? `notes: ${preferences.notes.trim()}` : null,
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join("; ")
    : "open preferences — help me find a coloured gemstone";
}
