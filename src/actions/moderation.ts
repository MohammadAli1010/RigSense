import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { ForumContentStatus, ReportStatus } from "@prisma/client";

export async function resolveReportAction(formData: FormData) {
  await requireRole(["MODERATOR", "ADMIN"]);
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
    // 1. Update report status
    await tx.report.update({
      where: { id: reportId },
      data: { status: ReportStatus.RESOLVED },
    });

    // 2. Optionally hide the content
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
  });

  revalidatePath("/admin/moderation");
  if (report.questionId) {
    revalidatePath(`/forum/questions/${report.questionId}`);
  }
}

export async function dismissReportAction(formData: FormData) {
  await requireRole(["MODERATOR", "ADMIN"]);
  const reportId = String(formData.get("reportId") ?? "").trim();

  if (!reportId) {
    throw new Error("Missing reportId");
  }

  await prisma.report.update({
    where: { id: reportId },
    data: { status: ReportStatus.DISMISSED },
  });

  revalidatePath("/admin/moderation");
}
