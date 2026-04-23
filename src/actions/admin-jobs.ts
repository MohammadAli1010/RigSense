"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { JobStatus } from "@prisma/client";

import { createAuditLog, toAuditJson } from "@/lib/admin";

export async function retryJobAction(formData: FormData) {
  const user = await requireRole(["ADMIN"]);
  
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Missing job ID");

  const existingJob = await prisma.backgroundJob.findUnique({
    where: { id },
  });

  if (!existingJob) {
    throw new Error("Job not found");
  }

  const retriedJob = await prisma.backgroundJob.update({
    where: { id },
    data: {
      status: JobStatus.PENDING,
      lastError: null,
      startedAt: null,
      completedAt: null,
      attempts: { increment: 1 },
      scheduledFor: new Date(),
    },
  });

  await createAuditLog({
    actorId: user.id,
    action: "background-job.retried",
    entityType: "background-job",
    entityId: retriedJob.id,
    summary: `Retried background job ${retriedJob.type}`,
    details: toAuditJson({ previous: existingJob, next: retriedJob }),
  });

  revalidatePath("/admin/jobs");
}

export async function deleteJobAction(formData: FormData) {
  const user = await requireRole(["ADMIN"]);
  
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Missing job ID");

  const existingJob = await prisma.backgroundJob.findUnique({
    where: { id },
  });

  if (!existingJob) {
    throw new Error("Job not found");
  }

  await prisma.backgroundJob.delete({ where: { id } });

  await createAuditLog({
    actorId: user.id,
    action: "background-job.deleted",
    entityType: "background-job",
    entityId: existingJob.id,
    summary: `Deleted background job ${existingJob.type}`,
    details: toAuditJson({ previous: existingJob }),
  });

  revalidatePath("/admin/jobs");
}
