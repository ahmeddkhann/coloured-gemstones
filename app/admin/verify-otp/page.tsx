import { Suspense } from "react";

import { VerifyForm } from "@/app/_components/VerifyForm";

export default function AdminVerifyOtpPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <Suspense fallback={<p className="text-ink-soft">Opening verification…</p>}>
        <VerifyForm />
      </Suspense>
    </main>
  );
}
