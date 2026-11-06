import { AdminRouteMarker } from "@/app/admin/_components/AdminRouteMarker";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-route flex min-h-0 flex-1 flex-col">
      <AdminRouteMarker />
      {children}
    </div>
  );
}
