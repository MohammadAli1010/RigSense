"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { BenchmarkKind } from "@prisma/client";

export async function saveBenchmarkAction(formData: FormData) {
  await requireRole(["MODERATOR", "ADMIN"]);

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
    await prisma.benchmark.update({
      where: { id },
      data,
    });
  } else {
    await prisma.benchmark.create({
      data,
    });
  }

  revalidatePath("/admin/benchmarks");
  revalidatePath("/benchmarks");
  redirect("/admin/benchmarks");
}

export async function deleteBenchmarkAction(formData: FormData) {
  await requireRole(["ADMIN"]);
  const id = formData.get("id")?.toString();
  if (!id) throw new Error("Missing benchmark ID");

  await prisma.benchmark.delete({ where: { id } });
  revalidatePath("/admin/benchmarks");
  revalidatePath("/benchmarks");
}
