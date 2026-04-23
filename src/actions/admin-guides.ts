"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function saveGuideAction(formData: FormData) {
  await requireRole(["MODERATOR", "ADMIN"]);

  const id = formData.get("id")?.toString();
  const title = formData.get("title")?.toString().trim();
  const excerpt = formData.get("excerpt")?.toString().trim();
  const body = formData.get("body")?.toString().trim();
  const coverImageUrl = formData.get("coverImageUrl")?.toString().trim() || null;
  const slugInput = formData.get("slug")?.toString().trim();
  
  if (!title || !excerpt || !body) {
    throw new Error("Missing required fields");
  }

  // Auto-generate slug if not provided
  const slug = slugInput || title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const data = {
    title,
    slug,
    excerpt,
    body,
    coverImageUrl,
  };

  if (id) {
    await prisma.guide.update({
      where: { id },
      data,
    });
  } else {
    await prisma.guide.create({
      data,
    });
  }

  revalidatePath("/admin/guides");
  revalidatePath("/guides");
  if (id) revalidatePath(`/guides/${slug}`);
  redirect("/admin/guides");
}

export async function deleteGuideAction(formData: FormData) {
  await requireRole(["ADMIN"]); // only admins can delete
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Missing guide ID");

  await prisma.guide.delete({ where: { id } });
  revalidatePath("/admin/guides");
  revalidatePath("/guides");
}
