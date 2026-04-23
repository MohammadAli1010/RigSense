"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { BenchmarkKind } from "@prisma/client";

import { createAuditLog, toAuditJson } from "@/lib/admin";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export async function saveBenchmarkAction(formData: FormData) {
  const user = await requireRole(["EDITOR", "ADMIN"]);

  const id = formData.get("id")?.toString();
  const title = formData.get("title")?.toString().trim();
  const workload = formData.get("workload")?.toString().trim();
  const kindStr = formData.get("kind")?.toString() as BenchmarkKind;
  const scoreStr = formData.get("score")?.toString();
  const avgFpsStr = formData.get("avgFps")?.toString();
  
  if (!title || !workload || !kindStr) {
    throw new Error("Missing required fields");
  }

  const score = scoreStr ? parseInt(scoreStr, 10) : null;
  const avgFps = avgFpsStr ? parseInt(avgFpsStr, 10) : null;

  const data = {
    title,
    workload,
    kind: kindStr,
    score,
    avgFps,
    unit: formData.get("unit")?.toString().trim() || null,
    scoreType: formData.get("scoreType")?.toString().trim() || null,
    source: formData.get("source")?.toString().trim() || null,
    resolution: formData.get("resolution")?.toString().trim() || null,
    settings: formData.get("settings")?.toString().trim() || null,
    confidence: formData.get("confidence")?.toString().trim() || null,
    notes: formData.get("notes")?.toString().trim() || null,
    partId: formData.get("partId")?.toString().trim() || null,
    buildId: formData.get("buildId")?.toString().trim() || null,
  };

  if (id) {
    const existingBenchmark = await prisma.benchmark.findUnique({
      where: { id },
    });

    if (!existingBenchmark) {
      throw new Error("Benchmark not found");
    }

    const updatedBenchmark = await prisma.benchmark.update({
      where: { id },
      data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "benchmark.updated",
      entityType: "benchmark",
      entityId: updatedBenchmark.id,
      summary: `Updated benchmark ${updatedBenchmark.title}`,
      details: toAuditJson({ previous: existingBenchmark, next: updatedBenchmark }),
    });
  } else {
    const createdBenchmark = await prisma.benchmark.create({
      data,
    });

    await createAuditLog({
      actorId: user.id,
      action: "benchmark.created",
      entityType: "benchmark",
      entityId: createdBenchmark.id,
      summary: `Created benchmark ${createdBenchmark.title}`,
      details: toAuditJson({ next: createdBenchmark }),
    });
  }

  revalidatePath("/admin/benchmarks");
  revalidatePath("/benchmarks");
  redirect("/admin/benchmarks");
}

export async function deleteBenchmarkAction(formData: FormData) {
  const user = await requireRole(["ADMIN"]);
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Missing benchmark ID");

  const benchmark = await prisma.benchmark.findUnique({ where: { id } });

  if (!benchmark) {
    throw new Error("Benchmark not found");
  }

  await prisma.benchmark.delete({ where: { id } });

  await createAuditLog({
    actorId: user.id,
    action: "benchmark.deleted",
    entityType: "benchmark",
    entityId: benchmark.id,
    summary: `Deleted benchmark ${benchmark.title}`,
    details: toAuditJson({ previous: benchmark }),
  });

  revalidatePath("/admin/benchmarks");
  revalidatePath("/benchmarks");
}

export async function rollbackBenchmarkRevisionAction(formData: FormData) {
  const user = await requireRole(["EDITOR", "ADMIN"]);
  const auditLogId = formData.get("auditLogId")?.toString();
  const benchmarkId = formData.get("benchmarkId")?.toString();

  if (!auditLogId || !benchmarkId) {
    throw new Error("Missing rollback target");
  }

  const [benchmark, auditEntry] = await Promise.all([
    prisma.benchmark.findUnique({ where: { id: benchmarkId } }),
    prisma.auditLog.findUnique({ where: { id: auditLogId } }),
  ]);

  if (!benchmark || !auditEntry || auditEntry.entityType !== "benchmark") {
    throw new Error("Revision not found");
  }

  const details = auditEntry.details as
    | {
        previous?: {
          title: string;
          workload: string;
          kind: BenchmarkKind;
          score: number | null;
          avgFps: number | null;
          unit: string | null;
          scoreType: string | null;
          source: string | null;
          resolution: string | null;
          settings: string | null;
          confidence: string | null;
          notes: string | null;
          partId: string | null;
          buildId: string | null;
        };
      }
    | null;
  const previous = details?.previous;

  if (!previous) {
    throw new Error("Selected audit entry cannot be rolled back");
  }

  const restoredBenchmark = await prisma.benchmark.update({
    where: { id: benchmarkId },
    data: previous,
  });

  await createAuditLog({
    actorId: user.id,
    action: "benchmark.rolled_back",
    entityType: "benchmark",
    entityId: restoredBenchmark.id,
    summary: `Rolled back benchmark ${restoredBenchmark.title}`,
    details: toAuditJson({ previous: benchmark, next: restoredBenchmark, sourceAuditLogId: auditEntry.id }),
  });

  revalidatePath("/admin/benchmarks");
  revalidatePath(`/admin/benchmarks/${benchmarkId}`);
  revalidatePath(`/admin/benchmarks/${benchmarkId}/history`);
  revalidatePath("/benchmarks");
  redirect(`/admin/benchmarks/${benchmarkId}/history`);
}
