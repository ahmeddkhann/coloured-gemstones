"use client";

import { useMemo, useState } from "react";

import { GemstoneCard } from "@/app/_components/GemstoneCard";
import { GEMSTONE_TYPES } from "@/lib/constants";
import {
  OPEN_CHAT_EVENT,
  QUIZ_HANDOFF_KEY,
  preferencesSummary,
  type QuizHandoffPayload,
} from "@/lib/chat/handoff";
import type { PublicGemstone } from "@/lib/gemstones";

type Preferences = QuizHandoffPayload["preferences"];

const BUDGETS = [
  { value: "any", label: "Any budget" },
  { value: "under-1k", label: "Under $1,000" },
  { value: "1k-5k", label: "$1,000 – $5,000" },
  { value: "5k-25k", label: "$5,000 – $25,000" },
  { value: "25k-plus", label: "$25,000+" },
] as const;

const OCCASIONS = [
  { value: "any", label: "No particular occasion" },
  { value: "engagement", label: "Engagement / ring" },
  { value: "gift", label: "Gift" },
  { value: "collection", label: "Adding to a collection" },
  { value: "everyday", label: "Everyday wear" },
  { value: "investment", label: "Investment piece" },
] as const;

const CARATS = [
  { value: "any", label: "Any size" },
  { value: "delicate", label: "Delicate" },
  { value: "medium", label: "Medium" },
  { value: "statement", label: "Statement" },
] as const;

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/30 bg-background px-3 py-2 text-sm text-jewel outline-none focus:border-gold";

const initialPrefs: Preferences = {
  types: [],
  colours: [],
  budget: "any",
  occasion: "any",
  caratFeel: "any",
  notes: "",
};

export function FindMyStoneQuiz() {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<Preferences>(initialPrefs);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const [items, setItems] = useState<PublicGemstone[]>([]);

  const steps = useMemo(
    () => [
      {
        title: "Which gemstone families interest you?",
        body: (
          <div className="mt-4 flex flex-wrap gap-2">
            {GEMSTONE_TYPES.map((type) => {
              const active = prefs.types.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() =>
                    setPrefs((current) => ({
                      ...current,
                      types: active
                        ? current.types.filter((value) => value !== type)
                        : [...current.types, type],
                    }))
                  }
                  className={`rounded-full border px-3 py-1.5 text-xs capitalize transition ${
                    active
                      ? "border-jewel bg-jewel text-[#f7f1e8]"
                      : "border-gold/40 text-jewel hover:bg-gold/10"
                  }`}
                >
                  {type}
                </button>
              );
            })}
          </div>
        ),
      },
      {
        title: "Any colour preference?",
        body: (
          <label className="mt-4 block text-xs text-ink-soft">
            Colour (optional)
            <input
              className={fieldClass}
              placeholder="e.g. Paraiba Blue, deep green, vivid pink"
              value={prefs.colours[0] ?? ""}
              onChange={(event) =>
                setPrefs((current) => ({
                  ...current,
                  colours: event.target.value.trim()
                    ? [event.target.value.trim()]
                    : [],
                }))
              }
            />
          </label>
        ),
      },
      {
        title: "Budget and occasion",
        body: (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-xs text-ink-soft">
              Budget
              <select
                className={fieldClass}
                value={prefs.budget}
                onChange={(event) =>
                  setPrefs((current) => ({
                    ...current,
                    budget: event.target.value,
                  }))
                }
              >
                {BUDGETS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-ink-soft">
              Occasion
              <select
                className={fieldClass}
                value={prefs.occasion}
                onChange={(event) =>
                  setPrefs((current) => ({
                    ...current,
                    occasion: event.target.value,
                  }))
                }
              >
                {OCCASIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        ),
      },
      {
        title: "Size feel and notes",
        body: (
          <div className="mt-4 space-y-4">
            <label className="block text-xs text-ink-soft">
              Size feel
              <select
                className={fieldClass}
                value={prefs.caratFeel}
                onChange={(event) =>
                  setPrefs((current) => ({
                    ...current,
                    caratFeel: event.target.value,
                  }))
                }
              >
                {CARATS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-ink-soft">
              Anything else?
              <textarea
                className={`${fieldClass} min-h-24 resize-y`}
                placeholder="Origin, cut shape, certificate needs…"
                value={prefs.notes ?? ""}
                onChange={(event) =>
                  setPrefs((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
              />
            </label>
          </div>
        ),
      },
    ],
    [prefs],
  );

  async function runRecommend() {
    setPending(true);
    setError(null);
    try {
      const response = await fetch("/api/chat/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences: prefs }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        data?: {
          items?: PublicGemstone[];
          reason?: string;
        };
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Could not get suggestions.");
      }
      setItems(payload.data?.items ?? []);
      setReason(payload.data?.reason ?? null);
      setStep(steps.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get suggestions.");
    } finally {
      setPending(false);
    }
  }

  function continueInChat() {
    const payload: QuizHandoffPayload = {
      preferences: prefs,
      summary: preferencesSummary(prefs),
    };
    try {
      sessionStorage.setItem(QUIZ_HANDOFF_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage failures.
    }
    window.dispatchEvent(new CustomEvent(OPEN_CHAT_EVENT));
  }

  const onResults = step >= steps.length;

  return (
    <section
      id="find-my-stone"
      className="border-t border-gold/20 bg-background"
    >
      <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20">
        <p className="text-xs uppercase tracking-[0.28em] text-gold">
          Personal shortlist
        </p>
        <h2 className="mt-3 font-serif text-3xl text-jewel sm:text-4xl">
          Find my stone
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-ink-soft sm:text-base">
          Answer a few preference questions. We ask our Gemstone AI to suggest
          only from stones currently in the catalogue.
        </p>

        <div className="mt-8 rounded-3xl border border-gold/25 bg-card p-5 sm:p-8">
          {!onResults ? (
            <>
              <p className="text-xs text-ink-soft">
                Step {step + 1} of {steps.length}
              </p>
              <h3 className="mt-2 font-serif text-2xl text-jewel">
                {steps[step]?.title}
              </h3>
              {steps[step]?.body}

              <div className="mt-8 flex flex-wrap gap-2">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((value) => value - 1)}
                    className="rounded-full border border-gold/40 px-5 py-2 text-sm text-jewel hover:bg-gold/10"
                  >
                    Back
                  </button>
                ) : null}
                {step < steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => setStep((value) => value + 1)}
                    className="rounded-full bg-jewel px-5 py-2 text-sm text-[#f7f1e8] hover:bg-[#0b2e22]"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => void runRecommend()}
                    className="rounded-full bg-jewel px-5 py-2 text-sm text-[#f7f1e8] hover:bg-[#0b2e22] disabled:opacity-60"
                  >
                    {pending ? "Asking the AI…" : "See suggestions"}
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <h3 className="font-serif text-2xl text-jewel">Your shortlist</h3>
              {reason ? (
                <p className="mt-3 text-sm leading-7 text-ink-soft">{reason}</p>
              ) : null}
              {items.length === 0 ? (
                <p className="mt-6 rounded-2xl border border-dashed border-gold/30 px-4 py-10 text-center text-sm text-ink-soft">
                  No matching stones in stock right now. Adjust preferences or
                  continue in chat.
                </p>
              ) : (
                <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
                  {items.map((gemstone) => (
                    <GemstoneCard key={gemstone.id} gemstone={gemstone} />
                  ))}
                </div>
              )}
              <div className="mt-8 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep(0);
                    setItems([]);
                    setReason(null);
                    setError(null);
                  }}
                  className="rounded-full border border-gold/40 px-5 py-2 text-sm text-jewel hover:bg-gold/10"
                >
                  Start over
                </button>
                <button
                  type="button"
                  onClick={continueInChat}
                  className="rounded-full bg-jewel px-5 py-2 text-sm text-[#f7f1e8] hover:bg-[#0b2e22]"
                >
                  Continue in Gemstone AI
                </button>
              </div>
            </>
          )}

          {error ? (
            <p className="mt-4 text-sm text-red-800" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}
