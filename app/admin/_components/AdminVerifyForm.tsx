"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

const fieldClass =
  "mt-1 w-full rounded-lg border border-[var(--admin-field-border)] bg-white px-4 py-3 text-sm text-black outline-none focus:border-black";

export function AdminVerifyForm() {
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
      <div className="w-full max-w-md rounded-xl border border-[var(--admin-border)] bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-black">Verify admin OTP</h1>
        <p className="mt-3 text-sm text-[var(--admin-muted)]">
          Start from admin sign in so we can email you a code.
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-block text-sm text-black underline"
        >
          Go to admin sign in
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
    <div className="w-full max-w-md rounded-xl border border-[var(--admin-border)] bg-white p-8 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--admin-muted)]">
        Admin access · Step 2
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">
        Enter your OTP
      </h1>
      <p className="mt-2 text-sm text-[var(--admin-muted)]">
        We sent a code to <span className="text-black">{email}</span>.
      </p>

      <form className="mt-8 space-y-4" onSubmit={verify}>
        <label className="block text-sm text-black">
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
        {info ? <p className="text-sm text-black">{info}</p> : null}
        <button
          type="submit"
          disabled={pending || code.length !== 6}
          className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Checking…" : "Enter admin desk"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => void resend()}
        disabled={pending}
        className="mt-4 w-full text-sm text-black underline disabled:opacity-50"
      >
        Resend OTP
      </button>
    </div>
  );
}
