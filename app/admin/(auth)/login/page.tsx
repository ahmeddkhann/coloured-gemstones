import { AuthForm } from "@/app/_components/AuthForm";

export default function AdminLoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <AuthForm mode="login" showSignupLink={false} />
    </main>
  );
}
