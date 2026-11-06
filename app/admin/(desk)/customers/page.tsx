import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { CustomerModel } from "@/lib/models/Customer";
import { OrderModel } from "@/lib/models/Order";

async function CustomersList({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await getAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  const params = await searchParams;
  const q = (params.q ?? "").trim();

  await connectDB();
  const filter = q
    ? {
        $or: [
          { name: { $regex: q, $options: "i" } },
          { email: { $regex: q, $options: "i" } },
          { phone: { $regex: q, $options: "i" } },
        ],
      }
    : {};

  const customers = await CustomerModel.find(filter)
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();

  const counts = await OrderModel.aggregate([
    {
      $match: {
        customerId: { $in: customers.map((c) => c._id) },
      },
    },
    { $group: { _id: "$customerId", count: { $sum: 1 } } },
  ]);
  const countById = new Map(
    counts.map((row) => [String(row._id), row.count as number]),
  );

  return (
    <main className="w-full flex-1 px-5 py-8 lg:px-10">
      <p className="text-sm text-[var(--admin-muted)]">CRM</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[var(--admin-ink)]">
        Customers
      </h1>
      <p className="mt-1 text-sm text-[var(--admin-muted)]">
        {customers.length} account{customers.length === 1 ? "" : "s"}.
      </p>

      <form className="mt-6 max-w-md">
        <label className="block text-sm text-[var(--admin-muted)]">
          Search
          <input
            name="q"
            defaultValue={q}
            placeholder="Name, email, or phone"
            className="mt-1 w-full rounded-xl border border-[var(--admin-border)] bg-white px-4 py-2.5 text-sm outline-none focus:border-gold"
          />
        </label>
      </form>

      {customers.length === 0 ? (
        <p className="mt-10 text-sm text-[var(--admin-muted)]">
          No customer accounts found.
        </p>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-[var(--admin-border)] bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--admin-border)] text-xs uppercase tracking-[0.12em] text-[var(--admin-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Orders</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={String(customer._id)}
                  className="border-b border-[var(--admin-border)] last:border-b-0"
                >
                  <td className="px-4 py-3 font-medium text-[var(--admin-ink)]">
                    {customer.name}
                  </td>
                  <td className="px-4 py-3">{customer.email}</td>
                  <td className="px-4 py-3">{customer.phone}</td>
                  <td className="px-4 py-3">
                    {countById.get(String(customer._id)) ?? 0}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/customers/${customer._id}`}
                      className="text-jewel underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default function AdminCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <main className="flex flex-1 items-center justify-center text-ink-soft">
          Loading customers…
        </main>
      }
    >
      <CustomersList searchParams={searchParams} />
    </Suspense>
  );
}
