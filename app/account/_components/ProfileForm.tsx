"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordField } from "@/app/_components/PasswordField";

const fieldClass =
  "mt-1 w-full rounded-xl border border-gold/30 bg-background px-4 py-3 text-sm outline-none focus:border-gold";

export function ProfileForm({
  initial,
}: {
  initial: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [address, setAddress] = useState(initial.address);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setPending(true);

    try {
      const response = await fetch("/api/customer-auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          address,
          password,
          confirmPassword,
        }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };
      if (!payload.ok) {
        setError(payload.error ?? "Could not update your details.");
        return;
      }
      setPassword("");
      setConfirmPassword("");
      setInfo("Your details were updated.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="max-w-lg space-y-4">
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
        <input className={fieldClass} value={initial.email} disabled />
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
        label="New password (optional)"
        value={password}
        onChange={setPassword}
        minLength={8}
        autoComplete="new-password"
      />
      <PasswordField
        label="Confirm new password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        minLength={password ? 8 : undefined}
        autoComplete="new-password"
      />
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {info ? <p className="text-sm text-jewel">{info}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-jewel px-6 py-3 text-sm text-[#f7f1e8] disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
