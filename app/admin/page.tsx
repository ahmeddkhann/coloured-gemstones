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
    <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Dashboard</p>
      <h1 className="mt-3 font-serif text-4xl text-jewel">
        Welcome, {admin.name}
      </h1>
      <p className="mt-2 text-ink-soft">{admin.email}</p>

      <div className="mt-10 grid gap-5 sm:grid-cols-3">
        <a
          href="/admin/gemstones"
          className="rounded-2xl border border-gold/25 bg-card px-6 py-8 transition hover:border-gold/50"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-gold">
            Gemstones
          </p>
          <p className="mt-3 font-serif text-4xl text-jewel">{gemstones}</p>
        </a>
        <a
          href="/admin/orders"
          className="rounded-2xl border border-gold/25 bg-card px-6 py-8 transition hover:border-gold/50"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Orders</p>
          <p className="mt-3 font-serif text-4xl text-jewel">{orders}</p>
        </a>
        <a
          href="/admin/orders?status=pending"
          className="rounded-2xl border border-gold/25 bg-card px-6 py-8 transition hover:border-gold/50"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Pending</p>
          <p className="mt-3 font-serif text-4xl text-jewel">{pending}</p>
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
