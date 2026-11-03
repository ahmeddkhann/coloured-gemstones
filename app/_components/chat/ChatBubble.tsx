"use client";

import Link from "next/link";
import { FormEvent, useEffect, useId, useRef, useState } from "react";

import {
  OPEN_CHAT_EVENT,
  QUIZ_HANDOFF_KEY,
  preferencesSummary,
  type QuizHandoffPayload,
} from "@/lib/chat/handoff";
import { GEMSTONE_TYPES } from "@/lib/constants";

type ChatRole = "user" | "assistant";

type Suggestion = {
  slug: string;
  name: string;
};

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  suggestions?: Suggestion[];
};

type Preferences = QuizHandoffPayload["preferences"];

const STORAGE_KEY = "cg-chat";
const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hello — I can help with coloured gemstones, care, buying tips, and this store’s policies. Tap Find my stone for a short preference shortlist, or ask anything gemstone-related.",
};

const emptyPrefs: Preferences = {
  types: [],
  colours: [],
  budget: "any",
  occasion: "any",
  caratFeel: "any",
  notes: "",
};

function loadMessages(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [WELCOME];
    }
    const parsed = JSON.parse(raw) as ChatMessage[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return [WELCOME];
    }
    return parsed;
  } catch {
    return [WELCOME];
  }
}

function readHandoff(): QuizHandoffPayload | null {
  try {
    const raw = sessionStorage.getItem(QUIZ_HANDOFF_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as QuizHandoffPayload;
  } catch {
    return null;
  }
}

export function ChatBubble() {
  const [hydrated, setHydrated] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);
  const [prefs, setPrefs] = useState<Preferences>(emptyPrefs);
  const handoffHandled = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const titleId = useId();

  useEffect(() => {
    setMessages(loadMessages());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignore quota / private mode failures.
    }
  }, [messages, hydrated]);

  useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(OPEN_CHAT_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CHAT_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open || !hydrated || pending || handoffHandled.current) {
      return;
    }
    const handoff = readHandoff();
    if (!handoff?.preferences) {
      return;
    }
    handoffHandled.current = true;
    void runRecommend(handoff.preferences, handoff.summary);
    try {
      sessionStorage.removeItem(QUIZ_HANDOFF_KEY);
    } catch {
      // Ignore.
    }
  }, [open, hydrated, pending]);

  useEffect(() => {
    if (!open) {
      return;
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
    if (!quizOpen) {
      inputRef.current?.focus();
    }
  }, [open, messages, pending, quizOpen]);

  function clearMessages() {
    if (pending) {
      return;
    }
    setMessages([WELCOME]);
    setError(null);
    setInput("");
    setQuizOpen(false);
    setPrefs(emptyPrefs);
    handoffHandled.current = false;
    try {
      sessionStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(QUIZ_HANDOFF_KEY);
    } catch {
      // Ignore storage failures.
    }
  }

  const canClear = !pending && messages.some((message) => message.role === "user");

  async function runRecommend(preferences: Preferences, summary?: string) {
    const label = summary || preferencesSummary(preferences);
    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: `Find my stone — preferences: ${label}`,
    };
    setMessages((current) => [...current, userMessage]);
    setPending(true);
    setError(null);
    setQuizOpen(false);

    try {
      const response = await fetch("/api/chat/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });
      const payload = (await response.json()) as {
        ok?: boolean;
        error?: string;
        data?: {
          items?: Array<{ slug: string; name: string }>;
          reason?: string;
          questions?: string[];
        };
      };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error || "Could not get suggestions.");
      }

      const items = payload.data?.items ?? [];
      const questions = payload.data?.questions ?? [];
      const reason =
        payload.data?.reason ||
        "Here are stones from our catalogue that may suit you.";
      const followUp =
        questions.length > 0
          ? `\n\nYou might also tell me: ${questions.join(" · ")}`
          : "";

      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: `${reason}${followUp}`,
          suggestions: items.map((item) => ({
            slug: item.slug,
            name: item.name,
          })),
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not get suggestions.",
      );
    } finally {
      setPending(false);
    }
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault();
    const text = input.trim();
    if (!text || pending) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages
            .filter((message) => message.id !== "welcome")
            .map(({ role, content }) => ({ role, content })),
        }),
      });

      const payload = (await response.json()) as {
        ok?: boolean;
        data?: { reply?: string };
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.data?.reply) {
        throw new Error(payload.error || "Could not get a reply.");
      }

      setMessages((current) => [
        ...current,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: payload.data!.reply!,
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not get a reply.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="chatbot-float fixed bottom-28 right-10 z-50 flex flex-col items-end gap-3">
      {open ? (
        <section
          aria-labelledby={titleId}
          className="flex h-[min(32rem,74vh)] w-[min(22rem,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-gold/30 bg-card shadow-[0_18px_50px_rgba(26,22,18,0.18)]"
        >
          <header className="flex items-center justify-between border-b border-gold/20 bg-jewel px-4 py-3 text-card">
            <div>
              <p id={titleId} className="font-serif text-lg leading-tight">
                Gemstone AI
              </p>
              <p className="text-xs text-card/75">Ask about stones &amp; the store</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearMessages}
                disabled={!canClear}
                className="rounded-full px-2 py-1 text-sm text-card/90 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Clear messages"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full px-2 py-1 text-sm text-card/90 transition hover:bg-white/10"
                aria-label="Close chat"
              >
                Close
              </button>
            </div>
          </header>

          <div
            ref={listRef}
            className="flex-1 space-y-3 overflow-y-auto px-3 py-3"
            role="log"
            aria-live="polite"
          >
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    message.role === "user"
                      ? "rounded-br-md bg-jewel text-card"
                      : "rounded-bl-md border border-gold/20 bg-background text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  {message.suggestions && message.suggestions.length > 0 ? (
                    <ul className="mt-2 space-y-1 border-t border-gold/15 pt-2">
                      {message.suggestions.map((item) => (
                        <li key={item.slug}>
                          <Link
                            href={`/gemstones/${item.slug}`}
                            className="text-jewel underline decoration-gold/50 underline-offset-2 hover:decoration-gold"
                            onClick={() => setOpen(false)}
                          >
                            {item.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </div>
            ))}
            {pending ? (
              <p className="text-xs text-ink-soft">Thinking…</p>
            ) : null}
            {error ? (
              <p className="text-xs text-red-800" role="alert">
                {error}
              </p>
            ) : null}
          </div>

          {quizOpen ? (
            <div className="border-t border-gold/20 bg-background/90 p-3">
              <p className="text-xs font-medium text-jewel">Find my stone</p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {GEMSTONE_TYPES.slice(0, 6).map((type) => {
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
                      className={`rounded-full border px-2.5 py-1 text-[11px] capitalize ${
                        active
                          ? "border-jewel bg-jewel text-[#f7f1e8]"
                          : "border-gold/40 text-jewel"
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <select
                  className="rounded-xl border border-gold/30 bg-card px-2 py-1.5 text-xs text-jewel"
                  value={prefs.budget}
                  onChange={(event) =>
                    setPrefs((current) => ({
                      ...current,
                      budget: event.target.value,
                    }))
                  }
                >
                  <option value="any">Any budget</option>
                  <option value="under-1k">Under $1k</option>
                  <option value="1k-5k">$1k–$5k</option>
                  <option value="5k-25k">$5k–$25k</option>
                  <option value="25k-plus">$25k+</option>
                </select>
                <select
                  className="rounded-xl border border-gold/30 bg-card px-2 py-1.5 text-xs text-jewel"
                  value={prefs.occasion}
                  onChange={(event) =>
                    setPrefs((current) => ({
                      ...current,
                      occasion: event.target.value,
                    }))
                  }
                >
                  <option value="any">Any occasion</option>
                  <option value="engagement">Engagement</option>
                  <option value="gift">Gift</option>
                  <option value="collection">Collection</option>
                  <option value="everyday">Everyday</option>
                  <option value="investment">Investment</option>
                </select>
              </div>
              <input
                className="mt-2 w-full rounded-xl border border-gold/30 bg-card px-2 py-1.5 text-xs text-jewel"
                placeholder="Colour preference (optional)"
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
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setQuizOpen(false)}
                  className="rounded-full border border-gold/40 px-3 py-1.5 text-xs text-jewel"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void runRecommend(prefs)}
                  className="rounded-full bg-jewel px-3 py-1.5 text-xs text-[#f7f1e8] disabled:opacity-60"
                >
                  Suggest stones
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={sendMessage}
              className="border-t border-gold/20 bg-background/80 p-3"
            >
              <button
                type="button"
                disabled={pending}
                onClick={() => setQuizOpen(true)}
                className="mb-2 w-full rounded-full border border-gold/35 px-3 py-1.5 text-xs text-jewel transition hover:bg-gold/10 disabled:opacity-50"
              >
                Find my stone
              </button>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about gemstones…"
                  maxLength={2000}
                  disabled={pending}
                  className="min-w-0 flex-1 rounded-full border border-gold/25 bg-card px-3 py-2 text-sm text-foreground outline-none placeholder:text-ink-soft focus:border-gold"
                  aria-label="Message"
                />
                <button
                  type="submit"
                  disabled={pending || !input.trim()}
                  className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-foreground transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Send
                </button>
              </div>
            </form>
          )}
        </section>
      ) : null}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        aria-label={open ? "Close gemstone AI" : "Ask the gemstone AI"}
        title="Ask the gemstone AI"
        className="chatbot-ai-trigger relative flex h-14 w-14 items-center justify-center rounded-full bg-jewel text-[#f7e7b0] shadow-lg ring-1 ring-gold/50 transition hover:scale-105 hover:ring-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        {open ? (
          <span className="text-2xl leading-none text-card" aria-hidden="true">
            ×
          </span>
        ) : (
          <svg viewBox="0 0 24 24" className="h-8 w-8" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2.5a1 1 0 0 1 1 1V5h3.5A2.5 2.5 0 0 1 19 7.5v9A2.5 2.5 0 0 1 16.5 19h-9A2.5 2.5 0 0 1 5 16.5v-9A2.5 2.5 0 0 1 7.5 5H11V3.5a1 1 0 0 1 1-1Z"
            />
            <circle cx="9.2" cy="11" r="1.35" fill="#0f3d2e" />
            <circle cx="14.8" cy="11" r="1.35" fill="#0f3d2e" />
            <rect
              x="9"
              y="14.2"
              width="6"
              height="1.6"
              rx="0.8"
              fill="#0f3d2e"
            />
            <circle cx="4.35" cy="11.2" r="1.1" fill="currentColor" />
            <circle cx="19.65" cy="11.2" r="1.1" fill="currentColor" />
          </svg>
        )}
      </button>
    </div>
  );
}
