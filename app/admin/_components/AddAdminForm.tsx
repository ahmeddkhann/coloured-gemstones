"use client";

import { useState } from "react";

import { PasswordField } from "@/app/_components/PasswordField";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/30 bg-background px-4 py-3 text-sm outline-none focus:border-gold";

export function AddAdminForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setPending(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        data?: { message?: string };
      };
      if (!payload.ok) {
        setError(payload.error ?? "Could not add the admin.");
        return;
      }
      setInfo(payload.data?.message ?? "Admin added. Their password was emailed.");
      setName("");
      setEmail("");
      setPassword("");
    } finally {
      setPending(false);
    }
  }

  return (
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
      <PasswordField
        label="Password"
        value={password}
        onChange={setPassword}
        minLength={8}
        required
        autoComplete="new-password"
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {info ? <p className="text-sm text-jewel">{info}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-jewel py-3 text-sm text-[#f7f1e8] disabled:opacity-60"
      >
        {pending ? "Adding…" : "Add admin and email password"}
      </button>
    </form>
  );
}
