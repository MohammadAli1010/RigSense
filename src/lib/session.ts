import { redirect } from "next/navigation";

import type { Role } from "@prisma/client";

import { auth } from "@/auth";

export async function requireUser() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  return session.user as typeof session.user & { id: string; role: Role };
}

export async function requireRole(allowedRoles: readonly Role[]) {
  const user = await requireUser();

  if (!user.role || !allowedRoles.includes(user.role)) {
    redirect("/");
  }

  return user;
}

export async function redirectIfAuthenticated() {
  const session = await auth();

  if (session?.user) {
    redirect("/profile");
  }
}
