"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordField } from "@/app/_components/PasswordField";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/30 bg-background px-4 py-3 text-sm outline-none focus:border-gold";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/customer-auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Could not sign in.");
        return;
      }
      router.push("/account");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-gold/25 bg-card p-8 shadow-sm">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">
        Customer account
      </p>
      <h1 className="mt-3 font-serif text-3xl text-jewel">Sign in</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Use your email and password. No verification code is required.
      </p>

      <form className="mt-8 space-y-4" onSubmit={submit}>
        <label className="block text-sm">
          Email
          <input
            type="email"
            className={fieldClass}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          required
          autoComplete="current-password"
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <p className="text-right">
          <Link
            href="/account/forgot-password"
            className="text-sm text-jewel underline"
          >
            Forgot password
          </Link>
        </p>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-jewel py-3 text-sm text-[#f7f1e8] disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        New here?{" "}
        <Link href="/account/signup" className="text-jewel underline">
          Create an account
        </Link>
      </p>
    </div>
  );
}
