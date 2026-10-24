"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordField } from "@/app/_components/PasswordField";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/30 bg-background px-4 py-3 text-sm outline-none focus:border-gold";

type Step = "email" | "otp" | "password";

export default function ForgotPasswordPage() {
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
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <div className="mx-auto w-full max-w-md rounded-3xl border border-gold/25 bg-card p-8 shadow-sm">
        <p className="text-xs uppercase tracking-[0.28em] text-gold">
          Atelier desk
        </p>
        <h1 className="mt-3 font-serif text-3xl text-jewel">
          {step === "email"
            ? "Forgot password"
            : step === "otp"
              ? "Enter your OTP"
              : "New password"}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {step === "email"
            ? "Enter the admin email. If it exists, we will send a reset code."
            : step === "otp"
              ? `We sent a code to ${email}.`
              : `Choose a new password for ${email}, then sign in with it.`}
        </p>

        {step === "email" ? (
          <form className="mt-8 space-y-4" onSubmit={submitEmail}>
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
            {error ? <p className="text-sm text-red-700">{error}</p> : null}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-full bg-jewel py-3 text-sm text-[#f7f1e8] disabled:opacity-60"
            >
              {pending ? "Checking…" : "Send reset code"}
            </button>
          </form>
        ) : null}

        {step === "otp" ? (
          <>
            <form className="mt-8 space-y-4" onSubmit={submitOtp}>
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
                {pending ? "Checking…" : "Verify code"}
              </button>
            </form>
            <button
              type="button"
              onClick={() => void resendOtp()}
              disabled={pending}
              className="mt-4 w-full text-sm text-jewel underline disabled:opacity-50"
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
              className="w-full rounded-full bg-jewel py-3 text-sm text-[#f7f1e8] disabled:opacity-60"
            >
              {pending ? "Saving…" : "Update password"}
            </button>
          </form>
        ) : null}

        <p className="mt-6 text-center text-sm text-ink-soft">
          <Link href="/admin/login" className="text-jewel underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
