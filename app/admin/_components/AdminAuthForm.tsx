"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordField } from "@/app/_components/PasswordField";

type Mode = "login" | "signup";

const fieldClass =
  "mt-1 w-full rounded-lg border border-[var(--admin-field-border)] bg-white px-4 py-3 text-sm text-black outline-none focus:border-black";

export function AdminAuthForm({
  mode,
  showSignupLink = false,
}: {
  mode: Mode;
  showSignupLink?: boolean;
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
            (mode === "signup"
              ? "Could not create the admin."
              : "Could not sign in."),
        );
        return;
      }

      router.push(`/admin/verify-otp?email=${encodeURIComponent(email)}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-[var(--admin-border)] bg-white p-8 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--admin-muted)]">
        Admin access
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-black">
        {mode === "signup" ? "Add admin" : "Admin sign in"}
      </h1>
      <p className="mt-2 text-sm text-[var(--admin-muted)]">
        {mode === "signup"
          ? "This is for staff accounts only. Customers should use the store account pages."
          : "Staff login only. Customers should sign in from the storefront account icon."}
      </p>

      <form className="mt-8 space-y-4" onSubmit={submitCredentials}>
        {mode === "signup" ? (
          <label className="block text-sm text-black">
            Name
            <input
              className={fieldClass}
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </label>
        ) : null}
        <label className="block text-sm text-black">
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
            <Link
              href="/admin/forgot-password"
              className="text-sm text-black underline"
            >
              Forgot password
            </Link>
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Sending code…" : "Send verification code"}
        </button>
      </form>

      {mode === "login" && showSignupLink ? (
        <p className="mt-6 text-center text-sm text-[var(--admin-muted)]">
          Need an admin account?{" "}
          <Link href="/admin/signup" className="text-black underline">
            Sign up
          </Link>
        </p>
      ) : null}
      {mode === "signup" ? (
        <p className="mt-6 text-center text-sm text-[var(--admin-muted)]">
          Already an admin?{" "}
          <Link href="/admin/login" className="text-black underline">
            Sign in
          </Link>
        </p>
      ) : null}
    </div>
  );
}
