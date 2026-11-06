import { redirect } from "next/navigation";

import { AccountNav } from "@/app/account/_components/AccountNav";
import { getCustomerSession } from "@/lib/customer-auth";
import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";

export default async function AccountDeskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-5 py-10 lg:flex-row lg:gap-12 lg:py-12">
      <aside className="w-full shrink-0 space-y-1 lg:w-60">
        <p className="text-[11px] uppercase tracking-[0.22em] text-gold">
          Account
        </p>
        <h1 className="break-words font-serif text-2xl leading-snug text-jewel sm:text-[1.75rem]">
          {customer.name}
        </h1>
        <p className="break-all text-sm leading-relaxed text-ink-soft">
          {customer.email}
        </p>
        <AccountNav />
      </aside>
      <div className="min-w-0 flex-1 border-t border-gold/20 pt-8 lg:border-t-0 lg:pt-0">
        {children}
      </div>
    </div>
  );
}
