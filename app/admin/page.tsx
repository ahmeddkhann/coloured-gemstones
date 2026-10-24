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
        {[
          ["Gemstones", gemstones],
          ["Orders", orders],
          ["Pending", pending],
        ].map(([label, value]) => (
          <article
            key={String(label)}
            className="rounded-2xl border border-gold/25 bg-card px-6 py-8"
          >
            <p className="text-xs uppercase tracking-[0.2em] text-gold">
              {label}
            </p>
            <p className="mt-3 font-serif text-4xl text-jewel">{value}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href="/admin/admins/new"
          className="rounded-full bg-jewel px-5 py-2 text-sm text-[#f7f1e8]"
        >
          Add admin
        </a>
        <a
          href="/admin/settings"
          className="rounded-full border border-gold/40 px-5 py-2 text-sm text-jewel hover:bg-gold/10"
        >
          Update details
        </a>
        <LogoutButton />
      </div>
    </main>
  );
}

function LogoutButton() {
  return (
    <form
      action={async () => {
        "use server";
        const { clearAdminCookie } = await import("@/lib/auth");
        const { redirect: go } = await import("next/navigation");
        await clearAdminCookie();
        go("/admin/login");
      }}
    >
      <button
        type="submit"
        className="rounded-full border border-gold/40 px-5 py-2 text-sm text-jewel hover:bg-gold/10"
      >
        Sign out
      </button>
    </form>
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
