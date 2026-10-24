"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordField } from "@/app/_components/PasswordField";

type Mode = "login" | "signup";

export function AuthForm({
  mode,
  showSignupLink,
}: {
  mode: Mode;
  showSignupLink: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submitCredentials(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const path = mode === "signup" ? "/api/auth/register" : "/api/auth/login";
      const body =
        mode === "signup" ? { name, email, password } : { email, password };

      const response = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(
          payload.error ??
            (mode === "signup" ? "Could not create the admin." : "Could not sign in."),
        );
        return;
      }

      router.push(`/admin/verify-otp?email=${encodeURIComponent(email)}`);
    } finally {
      setPending(false);
    }
  }

  const fieldClass =
    "mt-1 w-full rounded-xl border border-gold/30 bg-background px-4 py-3 text-sm outline-none focus:border-gold";

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-gold/25 bg-card p-8 shadow-sm">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Atelier desk</p>
      <h1 className="mt-3 font-serif text-3xl text-jewel">
        {mode === "signup" ? "Sign up" : "Sign in"}
      </h1>
      <p className="mt-2 text-sm text-ink-soft">
        {mode === "signup"
          ? "We will email a verification code after your account is created."
          : "We will email a verification code after your password is accepted."}
      </p>

      <form className="mt-8 space-y-4" onSubmit={submitCredentials}>
        {mode === "signup" ? (
          <label className="block text-sm">
            Name
            <input
              className={fieldClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
        ) : null}
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
          minLength={mode === "signup" ? 8 : 1}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        {mode === "login" ? (
          <p className="text-right">
            <Link href="/admin/forgot-password" className="text-sm text-jewel underline">
              Forgot password
            </Link>
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-jewel py-3 text-sm text-[#f7f1e8] disabled:opacity-60"
        >
          {pending ? "Sending code…" : "Send verification code"}
        </button>
      </form>

      {mode === "login" && showSignupLink ? (
        <p className="mt-6 text-center text-sm text-ink-soft">
          Need an account?{" "}
          <Link href="/admin/signup" className="text-jewel underline">
            Sign up
          </Link>
        </p>
      ) : null}
      {mode === "signup" ? (
        <p className="mt-6 text-center text-sm text-ink-soft">
          Already created?{" "}
          <Link href="/admin/login" className="text-jewel underline">
            Sign in
          </Link>
        </p>
      ) : null}
    </div>
  );
}
