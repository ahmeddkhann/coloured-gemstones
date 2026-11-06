import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ProfileForm } from "@/app/account/_components/ProfileForm";
import { getCustomerSession } from "@/lib/customer-auth";
import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";

async function AccountSettings() {
  const session = await getCustomerSession();
  if (!session) {
    redirect("/account/login");
  }

  await connectDB();
  const customer = await CustomerModel.findById(session.customerId).lean();
  if (!customer) {
    redirect("/account/login");
  }

  return (
    <main className="space-y-8">
      <header className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
          Settings
        </p>
        <h2 className="font-serif text-2xl leading-snug text-jewel sm:text-3xl">
          Your details
        </h2>
        <p className="max-w-xl text-sm leading-relaxed text-ink-soft">
          Update your name, contact numbers, address, or password.
        </p>
      </header>
      <ProfileForm
        initial={{
          name: customer.name,
          email: customer.email,
          phone: customer.phone,
          address: customer.address,
        }}
      />
    </main>
  );
}

export default function AccountSettingsPage() {
  return (
    <Suspense
      fallback={<p className="text-sm text-ink-soft">Loading settings…</p>}
    >
      <AccountSettings />
    </Suspense>
  );
}
