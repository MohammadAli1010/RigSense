import { redirect } from "next/navigation";

import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user as typeof session.user & { id: string };
}

export async function redirectIfAuthenticated() {
  const session = await auth();

  if (session?.user) {
    redirect("/profile");
  }
}
