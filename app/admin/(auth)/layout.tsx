import Link from "next/link";

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-app flex min-h-0 flex-1 flex-col bg-white text-black">
      <header className="border-b border-[var(--admin-border)] px-5 py-4">
        <div className="mx-auto flex w-full max-w-md items-center justify-between">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-[var(--admin-muted)]">
              Staff only
            </p>
            <p className="mt-1 text-sm font-semibold text-black">
              Admin desk
            </p>
          </div>
          <Link
            href="/"
            className="text-sm text-[var(--admin-muted)] hover:text-black"
          >
            Back to store
          </Link>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 py-12">
        {children}
      </main>
    </div>
  );
}
