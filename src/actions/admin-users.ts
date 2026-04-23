"use server";

import { Role } from "@prisma/client";

import { createAuditLog, toAuditJson } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function updateUserRoleAction(formData: FormData) {
  const admin = await requireRole(["ADMIN"]);
  const userId = formData.get("userId")?.toString();
  const role = formData.get("role")?.toString() as Role;

  if (!userId || !role) {
    throw new Error("Missing user role change payload");
  }

  const existingUser = await prisma.user.findUnique({ where: { id: userId } });

  if (!existingUser) {
    throw new Error("User not found");
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  await createAuditLog({
    actorId: admin.id,
    action: "user.role-updated",
    entityType: "user",
    entityId: updatedUser.id,
    summary: `Changed ${updatedUser.email} to ${updatedUser.role}`,
    details: toAuditJson({ previous: existingUser, next: updatedUser }),
  });
}
