import { Suspense } from "react";

import { AdminVerifyForm } from "@/app/admin/_components/AdminVerifyForm";

export default function AdminVerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <p className="text-sm text-[var(--admin-muted)]">Opening verification…</p>
      }
    >
      <AdminVerifyForm />
    </Suspense>
  );
}
