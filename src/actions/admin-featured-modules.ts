"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { FeaturedModuleType } from "@prisma/client";

import { createAuditLog, toAuditJson } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function saveFeaturedModuleAction(formData: FormData) {
  const user = await requireRole(["EDITOR", "ADMIN"]);
  const id = formData.get("id")?.toString();
  const slot = formData.get("slot")?.toString().trim();
  const type = formData.get("type")?.toString() as FeaturedModuleType;
  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const href = formData.get("href")?.toString().trim();
  const sortOrderValue = formData.get("sortOrder")?.toString() ?? "0";
  const isActive = formData.get("isActive") === "on" || formData.get("isActive") === "true";

  if (!slot || !type || !title || !href) {
    throw new Error("Missing required fields");
  }

  const sortOrder = Number.parseInt(sortOrderValue, 10);

  if (Number.isNaN(sortOrder)) {
    throw new Error("Invalid sort order");
  }

  const data = {
    slot,
    type,
    title,
    description,
    href,
    sortOrder,
    isActive,
  };

  if (id) {
    const existingModule = await prisma.featuredModule.findUnique({ where: { id } });

    if (!existingModule) {
      throw new Error("Featured module not found");
    }

    const updatedModule = await prisma.featuredModule.update({
      where: { id },
      data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "featured-module.updated",
      entityType: "featured-module",
      entityId: updatedModule.id,
      summary: `Updated featured module ${updatedModule.title}`,
      details: toAuditJson({ previous: existingModule, next: updatedModule }),
    });
  } else {
    const createdModule = await prisma.featuredModule.create({ data });

    await createAuditLog({
      actorId: user.id,
      action: "featured-module.created",
      entityType: "featured-module",
      entityId: createdModule.id,
      summary: `Created featured module ${createdModule.title}`,
      details: toAuditJson({ next: createdModule }),
    });
  }

  revalidatePath("/admin/featured-modules");
  redirect("/admin/featured-modules");
}

export async function deleteFeaturedModuleAction(formData: FormData) {
  const user = await requireRole(["EDITOR", "ADMIN"]);
  const id = formData.get("id")?.toString();

  if (!id) {
    throw new Error("Missing featured module ID");
  }

  const featuredModule = await prisma.featuredModule.findUnique({ where: { id } });

  if (!featuredModule) {
    throw new Error("Featured module not found");
  }

  await prisma.featuredModule.delete({ where: { id } });

  await createAuditLog({
    actorId: user.id,
    action: "featured-module.deleted",
    entityType: "featured-module",
    entityId: featuredModule.id,
    summary: `Deleted featured module ${featuredModule.title}`,
    details: toAuditJson({ previous: featuredModule }),
  });

  revalidatePath("/admin/featured-modules");
}
