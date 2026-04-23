"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OfferAvailability } from "@prisma/client";

import { createAuditLog, toAuditJson } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function saveOfferAction(formData: FormData) {
  const user = await requireRole(["EDITOR", "ADMIN"]);
  const id = formData.get("id")?.toString();
  const partId = formData.get("partId")?.toString().trim();
  const retailer = formData.get("retailer")?.toString().trim();
  const url = formData.get("url")?.toString().trim();
  const priceCentsValue = formData.get("priceCents")?.toString();
  const availability = formData.get("availability")?.toString() as OfferAvailability;
  const source = formData.get("source")?.toString().trim();
  const retrievedAtValue = formData.get("retrievedAt")?.toString();

  if (!partId || !retailer || !url || !priceCentsValue || !availability || !source) {
    throw new Error("Missing required fields");
  }

  const priceCents = Number.parseInt(priceCentsValue, 10);

  if (Number.isNaN(priceCents) || priceCents < 0) {
    throw new Error("Invalid price");
  }

  const retrievedAt = retrievedAtValue ? new Date(retrievedAtValue) : new Date();

  if (Number.isNaN(retrievedAt.getTime())) {
    throw new Error("Invalid retrieved at date");
  }

  const data = {
    partId,
    retailer,
    url,
    priceCents,
    availability,
    source,
    retrievedAt,
  };

  if (id) {
    const existingOffer = await prisma.offer.findUnique({ where: { id } });

    if (!existingOffer) {
      throw new Error("Offer not found");
    }

    const updatedOffer = await prisma.offer.update({
      where: { id },
      data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "offer.updated",
      entityType: "offer",
      entityId: updatedOffer.id,
      summary: `Updated ${updatedOffer.retailer} offer`,
      details: toAuditJson({ previous: existingOffer, next: updatedOffer }),
    });
  } else {
    const createdOffer = await prisma.offer.create({
      data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "offer.created",
      entityType: "offer",
      entityId: createdOffer.id,
      summary: `Created ${createdOffer.retailer} offer`,
      details: toAuditJson({ next: createdOffer }),
    });
  }

  revalidatePath("/admin/offers");
  revalidatePath("/parts");
  redirect("/admin/offers");
}

export async function deleteOfferAction(formData: FormData) {
  const user = await requireRole(["EDITOR", "ADMIN"]);
  const id = formData.get("id")?.toString();

  if (!id) {
    throw new Error("Missing offer ID");
  }

  const offer = await prisma.offer.findUnique({ where: { id } });

  if (!offer) {
    throw new Error("Offer not found");
  }

  await prisma.offer.delete({ where: { id } });

  await createAuditLog({
    actorId: user.id,
    action: "offer.deleted",
    entityType: "offer",
    entityId: offer.id,
    summary: `Deleted ${offer.retailer} offer`,
    details: toAuditJson({ previous: offer }),
  });

  revalidatePath("/admin/offers");
  revalidatePath("/parts");
}
