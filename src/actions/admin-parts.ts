"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { PartCategory } from "@prisma/client";

export async function savePartAction(formData: FormData) {
  await requireRole(["MODERATOR", "ADMIN"]);

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const brand = formData.get("brand")?.toString().trim();
  const category = formData.get("category")?.toString() as PartCategory;
  const priceCentsStr = formData.get("priceCents")?.toString();
  const description = formData.get("description")?.toString().trim();
  
  if (!name || !brand || !category || !priceCentsStr) {
    throw new Error("Missing required fields");
  }

  const priceCents = parseInt(priceCentsStr, 10);
  const slug = `${brand}-${name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const data = {
    name,
    brand,
    slug,
    category,
    priceCents,
    description: description || null,
    specs: {}, // Placeholder for now
  };

  if (id) {
    await prisma.part.update({
      where: { id },
      data,
    });
  } else {
    await prisma.part.create({
      data,
    });
  }

  revalidatePath("/admin/parts");
  revalidatePath("/parts");
  redirect("/admin/parts");
}
