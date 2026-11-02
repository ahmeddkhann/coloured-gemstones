import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AdminModel } from "@/lib/models/Admin";
import { GemstoneModel } from "@/lib/models/Gemstone";
import { OrderModel } from "@/lib/models/Order";

async function Dashboard() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  await connectDB();
  const [admin, gemstones, orders, pending] = await Promise.all([
    AdminModel.findById(session.adminId),
    GemstoneModel.countDocuments(),
    OrderModel.countDocuments(),
    OrderModel.countDocuments({ status: "pending" }),
  ]);

  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <main className="w-full flex-1 bg-white px-5 py-8 text-black lg:px-10">
      <p className="text-sm text-[var(--admin-muted)]">Dashboard</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black">
        Welcome, {admin.name}
      </h1>
      <p className="mt-1 text-sm text-[var(--admin-muted)]">{admin.email}</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <a
          href="/admin/gemstones"
          className="admin-card px-6 py-7 transition hover:border-jewel/40"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--admin-muted)]">
            Gemstones
          </p>
          <p className="mt-3 text-4xl font-semibold text-jewel">{gemstones}</p>
        </a>
        <a
          href="/admin/orders"
          className="admin-card px-6 py-7 transition hover:border-jewel/40"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--admin-muted)]">
            Orders
          </p>
          <p className="mt-3 text-4xl font-semibold text-jewel">{orders}</p>
        </a>
        <a
          href="/admin/orders?status=pending"
          className="admin-card px-6 py-7 transition hover:border-jewel/40"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--admin-muted)]">
            Pending
          </p>
          <p className="mt-3 text-4xl font-semibold text-jewel">{pending}</p>
        </a>
      </div>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Opening the atelier desk…
        </main>
      }
    >
      <Dashboard />
    </Suspense>
  );
}
