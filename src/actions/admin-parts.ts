"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { type Prisma, PartCategory } from "@prisma/client";

import { createAuditLog, slugify, toAuditJson } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function savePartAction(formData: FormData) {
  const user = await requireRole(["EDITOR", "ADMIN"]);

  const id = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const brand = formData.get("brand")?.toString().trim();
  const category = formData.get("category")?.toString() as PartCategory;
  const priceCentsStr = formData.get("priceCents")?.toString();
  const description = formData.get("description")?.toString().trim();
  const imageUrl = formData.get("imageUrl")?.toString().trim() || null;
  const specsText = formData.get("specs")?.toString().trim();

  if (!name || !brand || !category || !priceCentsStr) {
    throw new Error("Missing required fields");
  }

  const priceCents = Number.parseInt(priceCentsStr, 10);

  if (Number.isNaN(priceCents) || priceCents < 0) {
    throw new Error("Invalid price");
  }

  let specs: Prisma.InputJsonValue = {};

  if (specsText) {
    try {
      specs = JSON.parse(specsText) as Prisma.InputJsonValue;
    } catch {
      throw new Error("Specs must be valid JSON");
    }
  }

  const slug = slugify(`${brand}-${name}`);

  const data = {
    name,
    brand,
    slug,
    category,
    priceCents,
    description: description || null,
    imageUrl,
    specs,
  };

  if (id) {
    const existingPart = await prisma.part.findUnique({
      where: { id },
    });

    if (!existingPart) {
      throw new Error("Part not found");
    }

    const updatedPart = await prisma.part.update({
      where: { id },
      data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "part.updated",
      entityType: "part",
      entityId: updatedPart.id,
      summary: `Updated part ${updatedPart.brand} ${updatedPart.name}`,
      details: toAuditJson({ previous: existingPart, next: updatedPart }),
    });
  } else {
    const createdPart = await prisma.part.create({
      data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "part.created",
      entityType: "part",
      entityId: createdPart.id,
      summary: `Created part ${createdPart.brand} ${createdPart.name}`,
      details: toAuditJson({ next: createdPart }),
    });
  }

  revalidatePath("/admin/parts");
  revalidatePath("/parts");
  redirect("/admin/parts");
}
