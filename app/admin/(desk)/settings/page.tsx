import { Suspense } from "react";
import { redirect } from "next/navigation";

import { UpdateDetailsForm } from "@/app/admin/_components/UpdateDetailsForm";
import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { AdminModel } from "@/lib/models/Admin";

async function Settings() {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  await connectDB();
  const admin = await AdminModel.findById(session.adminId);
  if (!admin) {
    redirect("/admin/login");
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Account</p>
      <h1 className="mt-3 font-serif text-4xl text-jewel">Update details</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Your name can be saved on its own. Current password is only needed if
        you change the password.
      </p>
      <UpdateDetailsForm name={admin.name} email={admin.email} />
    </main>
  );
}

export default function UpdateDetailsPage() {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Loading your details…
        </main>
      }
    >
      <Settings />
    </Suspense>
  );
}
