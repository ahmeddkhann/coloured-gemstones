export default function AccountAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      {children}
    </main>
  );
}
