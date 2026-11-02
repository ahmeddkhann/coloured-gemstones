import { AuthForm } from "@/app/_components/AuthForm";

export default function AdminSignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-5 py-16">
      <AuthForm mode="signup" showSignupLink={false} />
    </main>
  );
}
