"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function saveCategoryAction(formData: FormData) {
  await requireRole(["ADMIN"]);

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const slugInput = formData.get("slug")?.toString().trim();
  const description = formData.get("description")?.toString().trim();

  if (!name || !description) {
    throw new Error("Missing required fields");
  }

  const slug = slugInput || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const data = {
    name,
    slug,
    description,
  };

  if (id) {
    await prisma.forumCategory.update({
      where: { id },
      data,
    });
  } else {
    await prisma.forumCategory.create({
      data,
    });
  }

  revalidatePath("/admin/categories");
  revalidatePath("/forum");
  redirect("/admin/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Missing category ID");

  await prisma.forumCategory.delete({ where: { id } });
  revalidatePath("/admin/categories");
  revalidatePath("/forum");
}
