"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordField } from "@/app/_components/PasswordField";

const fieldClass =
  "mt-1 w-full rounded-lg border border-[var(--admin-field-border)] bg-white px-4 py-3 text-sm text-black outline-none focus:border-black";

type Step = "email" | "otp" | "password";

export default function AdminForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  async function submitEmail(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setPending(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Could not send a reset code.");
        return;
      }
      setCode("");
      setInfo("A reset code was sent to your email.");
      setStep("otp");
    } finally {
      setPending(false);
    }
  }

  async function submitOtp(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setPending(true);

    try {
      const response = await fetch("/api/auth/forgot-password/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        data?: { resetToken?: string };
      };
      if (!payload.ok) {
        setError(payload.error ?? "Invalid code.");
        return;
      }
      if (!payload.data?.resetToken) {
        setError("Could not start password reset. Try again.");
        return;
      }
      setResetToken(payload.data.resetToken);
      setPassword("");
      setConfirmPassword("");
      setStep("password");
    } finally {
      setPending(false);
    }
  }

  async function resendOtp() {
    setError("");
    setInfo("");
    setPending(true);
    try {
      const response = await fetch("/api/auth/forgot-password/resend", {
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

  async function submitPassword(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (password !== confirmPassword) {
      setError("New password and confirm password must match.");
      return;
    }

    setPending(true);
    try {
      const response = await fetch("/api/auth/forgot-password/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, confirmPassword, resetToken }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Could not update the password.");
        return;
      }
      router.push("/admin/login");
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
        {step === "email"
          ? "Reset admin password"
          : step === "otp"
            ? "Enter your OTP"
            : "New password"}
      </h1>
      <p className="mt-2 text-sm text-[var(--admin-muted)]">
        {step === "email"
          ? "Enter the admin email. If it exists, we will send a reset code."
          : step === "otp"
            ? `We sent a code to ${email}.`
            : `Choose a new password for ${email}, then sign in with it.`}
      </p>

      {step === "email" ? (
        <form className="mt-8 space-y-4" onSubmit={submitEmail}>
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
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Checking…" : "Send reset code"}
          </button>
        </form>
      ) : null}

      {step === "otp" ? (
        <>
          <form className="mt-8 space-y-4" onSubmit={submitOtp}>
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
              {pending ? "Checking…" : "Verify code"}
            </button>
          </form>
          <button
            type="button"
            onClick={() => void resendOtp()}
            disabled={pending}
            className="mt-4 w-full text-sm text-black underline disabled:opacity-50"
          >
            Resend OTP
          </button>
        </>
      ) : null}

      {step === "password" ? (
        <form className="mt-8 space-y-4" onSubmit={submitPassword}>
          <PasswordField
            label="New password"
            value={password}
            onChange={setPassword}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <PasswordField
            label="Confirm new password"
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
            className="w-full rounded-lg bg-black py-3 text-sm font-medium text-white disabled:opacity-60"
          >
            {pending ? "Saving…" : "Update password"}
          </button>
        </form>
      ) : null}

      <p className="mt-6 text-center text-sm text-[var(--admin-muted)]">
        <Link href="/admin/login" className="text-black underline">
          Back to admin sign in
        </Link>
      </p>
    </div>
  );
}
