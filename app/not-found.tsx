import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-20 text-center">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Missing</p>
      <h1 className="mt-3 font-serif text-4xl text-jewel">Page not found</h1>
      <p className="mt-3 text-sm text-ink-soft">
        That stone or page is no longer in the tray.
      </p>
      <Link
        href="/#collection"
        className="mt-8 rounded-full bg-jewel px-6 py-3 text-sm text-[#f7f1e8]"
      >
        Back to collection
      </Link>
    </main>
  );
}
