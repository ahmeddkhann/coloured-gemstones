"use client";

import { useState } from "react";

import { PasswordField } from "@/app/_components/PasswordField";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/30 bg-background px-4 py-3 text-sm outline-none focus:border-gold";

export function UpdateDetailsForm({
  name: initialName,
  email,
}: {
  name: string;
  email: string;
}) {
  const [name, setName] = useState(initialName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (newPassword) {
      if (!currentPassword) {
        setError("Enter your current password to change it.");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("New password and confirm password must match.");
        return;
      }
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Could not update details.");
        return;
      }
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setInfo("Details saved.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="mt-8 space-y-4" onSubmit={submit}>
      <label className="block text-sm">
        Email
        <input className={`${fieldClass} opacity-70`} value={email} disabled />
      </label>
      <label className="block text-sm">
        Name
        <input
          className={fieldClass}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
        />
      </label>
      <PasswordField
        label="New password"
        value={newPassword}
        onChange={setNewPassword}
        minLength={8}
        autoComplete="new-password"
        placeholder="Leave blank to keep the current password"
      />
      {newPassword ? (
        <>
          <PasswordField
            label="Confirm new password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            minLength={8}
            autoComplete="new-password"
            required
          />
          <PasswordField
            label="Current password"
            value={currentPassword}
            onChange={setCurrentPassword}
            autoComplete="current-password"
            required
          />
        </>
      ) : null}
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {info ? <p className="text-sm text-jewel">{info}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-jewel py-3 text-sm text-[#f7f1e8] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save details"}
      </button>
    </form>
  );
}
