"use client";

import { usePathname } from "next/navigation";

import { AdminSidebar } from "@/app/admin/_components/AdminSidebar";

const AUTH_PREFIXES = [
  "/admin/login",
  "/admin/signup",
  "/admin/verify-otp",
  "/admin/forgot-password",
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = AUTH_PREFIXES.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col md:flex-row">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">{children}</div>
    </div>
  );
}
