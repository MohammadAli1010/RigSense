"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { JobStatus } from "@prisma/client";

export async function retryJobAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Missing job ID");

  await prisma.backgroundJob.update({
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

  revalidatePath("/admin/jobs");
}

export async function deleteJobAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Missing job ID");

  await prisma.backgroundJob.delete({ where: { id } });
  revalidatePath("/admin/jobs");
}
