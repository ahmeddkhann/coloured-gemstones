import { Suspense } from "react";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-app flex min-h-0 flex-1 flex-col bg-white text-black md:flex-row">
      <Suspense
        fallback={
          <aside className="w-full shrink-0 border-b border-[var(--admin-border)] bg-white md:h-14 md:w-56 md:border-b-0 md:border-r lg:w-60" />
        }
      >
        <AdminSidebar />
      </Suspense>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto bg-white text-black">
        {children}
      </div>
    </div>
  );
}
