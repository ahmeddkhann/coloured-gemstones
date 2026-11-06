"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordField } from "@/app/_components/PasswordField";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/30 bg-background px-4 py-3 text-sm outline-none focus:border-gold";

export default function CustomerSignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setPending(true);

    try {
      const response = await fetch("/api/customer-auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone,
          address,
          password,
          confirmPassword,
        }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Could not start sign-up.");
        return;
      }
      router.push(`/account/verify-otp?email=${encodeURIComponent(email)}`);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-gold/25 bg-card p-8 shadow-sm">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">
        Customer account
      </p>
      <h1 className="mt-3 font-serif text-3xl text-jewel">Create account</h1>
      <p className="mt-2 text-sm text-ink-soft">
        We will email a verification code before your account is created.
      </p>

      <form className="mt-8 space-y-4" onSubmit={submit}>
        <label className="block text-sm">
          Name
          <input
            className={fieldClass}
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
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
        <label className="block text-sm">
          Phone
          <input
            className={fieldClass}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </label>
        <label className="block text-sm">
          Address
          <textarea
            className={fieldClass}
            rows={3}
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            required
          />
        </label>
        <PasswordField
          label="Password"
          value={password}
          onChange={setPassword}
          required
          minLength={8}
          autoComplete="new-password"
        />
        <PasswordField
          label="Confirm password"
          value={confirmPassword}
          onChange={setConfirmPassword}
          required
          minLength={8}
          autoComplete="new-password"
        />
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-jewel py-3 text-sm text-[#f7f1e8] disabled:opacity-60"
        >
          {pending ? "Sending code…" : "Send verification code"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href="/account/login" className="text-jewel underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
