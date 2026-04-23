"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog, toAuditJson } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function saveOperationalSettingAction(formData: FormData) {
  const user = await requireRole(["ADMIN"]);
  const id = formData.get("id")?.toString();
  const key = formData.get("key")?.toString().trim();
  const label = formData.get("label")?.toString().trim();
  const value = formData.get("value")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;

  if (!key || !label || !value) {
    throw new Error("Missing required fields");
  }

  const data = {
    key,
    label,
    value,
    description,
  };

  if (id) {
    const existingSetting = await prisma.operationalSetting.findUnique({ where: { id } });

    if (!existingSetting) {
      throw new Error("Setting not found");
    }

    const updatedSetting = await prisma.operationalSetting.update({
      where: { id },
      data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "setting.updated",
      entityType: "setting",
      entityId: updatedSetting.id,
      summary: `Updated setting ${updatedSetting.key}`,
      details: toAuditJson({ previous: existingSetting, next: updatedSetting }),
    });
  } else {
    const createdSetting = await prisma.operationalSetting.create({ data });

    await createAuditLog({
      actorId: user.id,
      action: "setting.created",
      entityType: "setting",
      entityId: createdSetting.id,
      summary: `Created setting ${createdSetting.key}`,
      details: toAuditJson({ next: createdSetting }),
    });
  }

  revalidatePath("/admin/settings");
  redirect("/admin/settings");
}

export async function deleteOperationalSettingAction(formData: FormData) {
  const user = await requireRole(["ADMIN"]);
  const id = formData.get("id")?.toString();

  if (!id) {
    throw new Error("Missing setting ID");
  }

  const setting = await prisma.operationalSetting.findUnique({ where: { id } });

  if (!setting) {
    throw new Error("Setting not found");
  }

  await prisma.operationalSetting.delete({ where: { id } });

  await createAuditLog({
    actorId: user.id,
    action: "setting.deleted",
    entityType: "setting",
    entityId: setting.id,
    summary: `Deleted setting ${setting.key}`,
    details: toAuditJson({ previous: setting }),
  });

  revalidatePath("/admin/settings");
}
