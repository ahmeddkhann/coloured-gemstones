"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/30 bg-background px-4 py-3 text-sm outline-none focus:border-gold";

export function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = (searchParams.get("email") ?? "").trim();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState(
    email ? "Enter the 6-digit code sent to your email." : "",
  );
  const [pending, setPending] = useState(false);

  if (!email) {
    return (
      <div className="mx-auto w-full max-w-md rounded-3xl border border-gold/25 bg-card p-8 text-center">
        <h1 className="font-serif text-3xl text-jewel">Verify OTP</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Start from sign in or sign up so we can email you a code.
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-block text-sm text-jewel underline"
        >
          Go to sign in
        </Link>
      </div>
    );
  }

  async function verify(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Invalid code.");
        return;
      }
      router.push("/admin");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function resend() {
    setError("");
    setInfo("");
    setPending(true);

    try {
      const response = await fetch("/api/auth/otp/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Could not resend the code.");
        return;
      }
      setInfo("A new code was sent to your email.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-gold/25 bg-card p-8 shadow-sm">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Step 2</p>
      <h1 className="mt-3 font-serif text-3xl text-jewel">Enter your OTP</h1>
      <p className="mt-2 text-sm text-ink-soft">
        We sent a code to <span className="text-jewel">{email}</span>.
      </p>

      <form className="mt-8 space-y-4" onSubmit={verify}>
        <label className="block text-sm">
          OTP
          <input
            className={`${fieldClass} tracking-[0.4em]`}
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            maxLength={6}
            placeholder="000000"
            autoFocus
            required
          />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {info ? <p className="text-sm text-jewel">{info}</p> : null}
        <button
          type="submit"
          disabled={pending || code.length !== 6}
          className="w-full rounded-full bg-jewel py-3 text-sm text-[#f7f1e8] disabled:opacity-60"
        >
          {pending ? "Checking…" : "Sign in"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => void resend()}
        disabled={pending}
        className="mt-4 w-full text-sm text-jewel underline disabled:opacity-50"
      >
        Resend OTP
      </button>
    </div>
  );
}
