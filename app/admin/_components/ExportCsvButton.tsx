"use client";

export function ExportCsvButton({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      className="inline-flex rounded-full border border-[var(--admin-border)] bg-white px-4 py-2 text-sm text-[var(--admin-ink)] transition hover:bg-black/[0.03]"
    >
      {label}
    </a>
  );
}
