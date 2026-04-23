"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createAuditLog, slugify, toAuditJson } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function saveGuideAction(formData: FormData) {
  const user = await requireRole(["EDITOR", "ADMIN"]);

  const id = formData.get("id")?.toString();
  const title = formData.get("title")?.toString().trim();
  const excerpt = formData.get("excerpt")?.toString().trim();
  const body = formData.get("body")?.toString().trim();
  const coverImageUrl = formData.get("coverImageUrl")?.toString().trim() || null;
  const slugInput = formData.get("slug")?.toString().trim();
  const isPublished = formData.get("isPublished") === "on" || formData.get("isPublished") === "true";
  
  if (!title || !excerpt || !body) {
    throw new Error("Missing required fields");
  }

  const slug = slugInput || slugify(title);

  const data = {
    title,
    slug,
    excerpt,
    body,
    coverImageUrl,
    isPublished,
  };

  if (id) {
    const existingGuide = await prisma.guide.findUnique({
      where: { id },
    });

    if (!existingGuide) {
      throw new Error("Guide not found");
    }

    const updatedGuide = await prisma.guide.update({
      where: { id },
      data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "guide.updated",
      entityType: "guide",
      entityId: updatedGuide.id,
      summary: `Updated guide ${updatedGuide.title}`,
      details: toAuditJson({ previous: existingGuide, next: updatedGuide }),
    });
  } else {
    const createdGuide = await prisma.guide.create({
      data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "guide.created",
      entityType: "guide",
      entityId: createdGuide.id,
      summary: `Created guide ${createdGuide.title}`,
      details: toAuditJson({ next: createdGuide }),
    });
  }

  revalidatePath("/admin/guides");
  revalidatePath("/guides");
  if (id) revalidatePath(`/guides/${slug}`);
  redirect("/admin/guides");
}

export async function deleteGuideAction(formData: FormData) {
  const user = await requireRole(["ADMIN"]);
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Missing guide ID");

  const guide = await prisma.guide.findUnique({ where: { id } });

  if (!guide) {
    throw new Error("Guide not found");
  }

  await prisma.guide.delete({ where: { id } });

  await createAuditLog({
    actorId: user.id,
    action: "guide.deleted",
    entityType: "guide",
    entityId: guide.id,
    summary: `Deleted guide ${guide.title}`,
    details: toAuditJson({ previous: guide }),
  });

  revalidatePath("/admin/guides");
  revalidatePath("/guides");
}

export async function rollbackGuideRevisionAction(formData: FormData) {
  const user = await requireRole(["EDITOR", "ADMIN"]);
  const auditLogId = formData.get("auditLogId")?.toString();
  const guideId = formData.get("guideId")?.toString();

  if (!auditLogId || !guideId) {
    throw new Error("Missing rollback target");
  }

  const [guide, auditEntry] = await Promise.all([
    prisma.guide.findUnique({ where: { id: guideId } }),
    prisma.auditLog.findUnique({ where: { id: auditLogId } }),
  ]);

  if (!guide || !auditEntry || auditEntry.entityType !== "guide") {
    throw new Error("Revision not found");
  }

  const details = auditEntry.details as
    | {
        previous?: {
          slug: string;
          title: string;
          excerpt: string;
          body: string;
          coverImageUrl: string | null;
          isPublished: boolean;
        };
      }
    | null;
  const previous = details?.previous;

  if (!previous) {
    throw new Error("Selected audit entry cannot be rolled back");
  }

  const restoredGuide = await prisma.guide.update({
    where: { id: guideId },
    data: {
      slug: previous.slug,
      title: previous.title,
      excerpt: previous.excerpt,
      body: previous.body,
      coverImageUrl: previous.coverImageUrl,
      isPublished: previous.isPublished,
    },
  });

  await createAuditLog({
    actorId: user.id,
    action: "guide.rolled_back",
    entityType: "guide",
    entityId: restoredGuide.id,
    summary: `Rolled back guide ${restoredGuide.title}`,
    details: toAuditJson({ previous: guide, next: restoredGuide, sourceAuditLogId: auditEntry.id }),
  });

  revalidatePath("/admin/guides");
  revalidatePath(`/admin/guides/${guideId}`);
  revalidatePath(`/admin/guides/${guideId}/history`);
  revalidatePath("/guides");
  revalidatePath(`/guides/${restoredGuide.slug}`);
  redirect(`/admin/guides/${guideId}/history`);
}
