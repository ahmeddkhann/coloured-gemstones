import { AddAdminForm } from "@/app/admin/_components/AddAdminForm";

export default function AddAdminPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-12">
      <p className="text-xs uppercase tracking-[0.28em] text-gold">Admins</p>
      <h1 className="mt-3 font-serif text-4xl text-jewel">Add admin</h1>
      <p className="mt-2 text-sm text-ink-soft">
        We will email them their password and ask them to sign in. They will
        then enter email, password, and the OTP we send.
      </p>
      <AddAdminForm />
    </main>
  );
}
