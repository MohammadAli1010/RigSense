import { revalidatePath } from "next/cache";
import { ForumContentStatus, ReportStatus } from "@prisma/client";

import { createAuditLog, toAuditJson } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function resolveReportAction(formData: FormData) {
  const user = await requireRole(["MODERATOR", "ADMIN"]);
  const reportId = String(formData.get("reportId") ?? "").trim();
  const hideContent = formData.get("hideContent") === "true";

  if (!reportId) {
    throw new Error("Missing reportId");
  }

  const report = await prisma.report.findUnique({
    where: { id: reportId },
    include: { question: true, answer: true },
  });

  if (!report) {
    throw new Error("Report not found");
  }

  await prisma.$transaction(async (tx) => {
    await tx.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.RESOLVED },
    });

    if (hideContent) {
      if (report.questionId) {
        await tx.forumQuestion.update({
          where: { id: report.questionId },
          data: { status: ForumContentStatus.HIDDEN },
        });
      }
      if (report.answerId) {
        await tx.forumAnswer.update({
          where: { id: report.answerId },
          data: { status: ForumContentStatus.HIDDEN },
        });
      }
    }

    await createAuditLog({
      actorId: user.id,
      action: hideContent ? "report.resolved-hidden" : "report.resolved-kept",
      entityType: "report",
      entityId: report.id,
      summary: `Resolved report for ${report.questionId ? "question" : "answer"}`,
      details: toAuditJson({
        report,
        hideContent,
      }),
      tx,
    });
  });

  revalidatePath("/admin/moderation");
  if (report.questionId) {
    revalidatePath(`/forum/questions/${report.questionId}`);
  }
}

export async function dismissReportAction(formData: FormData) {
  const user = await requireRole(["MODERATOR", "ADMIN"]);
  const reportId = String(formData.get("reportId") ?? "").trim();

  if (!reportId) {
    throw new Error("Missing reportId");
  }

  const report = await prisma.report.update({
    where: { id: reportId },
    data: { status: ReportStatus.DISMISSED },
  });

  await createAuditLog({
    actorId: user.id,
    action: "report.dismissed",
    entityType: "report",
    entityId: report.id,
    summary: `Dismissed report ${report.id}`,
    details: toAuditJson({ report }),
  });

  revalidatePath("/admin/moderation");
}
