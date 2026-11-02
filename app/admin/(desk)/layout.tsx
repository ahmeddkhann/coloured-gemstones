import { AdminShell } from "@/app/admin/_components/AdminShell";

export default function AdminDeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminShell>{children}</AdminShell>;
}
