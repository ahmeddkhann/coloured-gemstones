"use client";

import { useState } from "react";

const fieldClass =
  "w-full rounded-xl border border-gold/30 bg-background py-3 pl-4 pr-12 text-sm outline-none focus:border-gold";

export function PasswordField({
  label,
  value,
  onChange,
  required,
  minLength,
  placeholder,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minLength?: number;
  placeholder?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block text-sm">
      {label}
      <span className="relative mt-1 block">
        <input
          type={visible ? "text" : "password"}
          className={fieldClass}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((open) => !open)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-jewel"
        >
          {visible ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M3 3l18 18" />
              <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
              <path d="M9.9 5.1A9.8 9.8 0 0 1 12 5c5.5 0 9.5 4.5 10.5 7-.4 1-1.2 2.4-2.5 3.7" />
              <path d="M6.1 6.1C4.2 7.5 2.9 9.3 1.5 12c1 2.5 5 7 10.5 7 1.3 0 2.5-.2 3.6-.6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M1.5 12C2.5 9.5 6.5 5 12 5s9.5 4.5 10.5 7c-1 2.5-5 7-10.5 7S2.5 14.5 1.5 12Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </span>
    </label>
  );
}
