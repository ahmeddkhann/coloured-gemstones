import { Suspense } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Loading…
        </main>
      }
    >
      {children}
    </Suspense>
  );
}
