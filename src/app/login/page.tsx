import { LoginForm } from "@/components/auth/login-form";
import { redirectIfAuthenticated } from "@/lib/session";

export default async function LoginPage() {
  await redirectIfAuthenticated();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-18rem)] w-full max-w-7xl items-center justify-center px-6 py-16">
      <LoginForm />
    </div>
  );
}
