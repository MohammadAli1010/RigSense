"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog, slugify, toAuditJson } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function saveCategoryAction(formData: FormData) {
  const user = await requireRole(["ADMIN"]);

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const slugInput = formData.get("slug")?.toString().trim();
  const description = formData.get("description")?.toString().trim();

  if (!name || !description) {
    throw new Error("Missing required fields");
  }

  const slug = slugInput || slugify(name);

  const data = {
    name,
    slug,
    description,
  };

  if (id) {
    const existingCategory = await prisma.forumCategory.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      throw new Error("Category not found");
    }

    const updatedCategory = await prisma.forumCategory.update({
      where: { id },
      data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "forum-category.updated",
      entityType: "forum-category",
      entityId: updatedCategory.id,
      summary: `Updated forum category ${updatedCategory.name}`,
      details: toAuditJson({ previous: existingCategory, next: updatedCategory }),
    });
  } else {
    const createdCategory = await prisma.forumCategory.create({
      data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "forum-category.created",
      entityType: "forum-category",
      entityId: createdCategory.id,
      summary: `Created forum category ${createdCategory.name}`,
      details: toAuditJson({ next: createdCategory }),
    });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/forum");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const user = await requireRole(["ADMIN"]);
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Missing category ID");

  const category = await prisma.forumCategory.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
    },
  });

  if (!category) {
    throw new Error("Category not found");
  }

  if (category._count.questions > 0) {
    throw new Error("Cannot delete a category that still has questions");
  }

  await prisma.forumCategory.delete({ where: { id } });

  await createAuditLog({
    actorId: user.id,
    action: "forum-category.deleted",
    entityType: "forum-category",
    entityId: category.id,
    summary: `Deleted forum category ${category.name}`,
    details: toAuditJson({ previous: category }),
  });

  revalidatePath("/admin/categories");
  revalidatePath("/forum");
}
