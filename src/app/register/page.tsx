import { RegisterForm } from "@/components/auth/register-form";
import { redirectIfAuthenticated } from "@/lib/session";

export default async function RegisterPage() {
  await redirectIfAuthenticated();

  return (
    <div className="mx-auto flex min-h-[calc(100vh-18rem)] w-full max-w-7xl items-center justify-center px-6 py-16">
      <RegisterForm />
    </div>
  );
}
