"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  parseBuildSelections,
} from "@/lib/build-editor";
import { requireUser } from "@/lib/session";
import { saveBuild, toggleBuildVisibility, cloneBuild } from "@/services/builds/service";

const metadataSchema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().max(280).optional().default(""),
});

function builderRedirect(buildId?: string, status?: string): never {
  const params = new URLSearchParams();

  if (buildId) {
    params.set("buildId", buildId);
  }

  if (status) {
    params.set("status", status);
  }

  redirect(`/builder${params.size > 0 ? `?${params.toString()}` : ""}`);
}

export async function saveBuildAction(formData: FormData) {
  const user = await requireUser();
  const buildId = String(formData.get("buildId") ?? "").trim() || undefined;
  const intent = String(formData.get("intent") ?? "save");
  const selections = parseBuildSelections(formData.get("selections"));
  const metadata = metadataSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? "",
  });

  if (!selections) {
    return builderRedirect(buildId, "invalid-build-data");
  }

  if (!metadata.success) {
    return builderRedirect(buildId, "title-required");
  }

  const validSelections = selections;
  const validMetadata = metadata.data;

  const result = await saveBuild({
    buildId,
    userId: user.id,
    title: validMetadata.title,
    description: validMetadata.description,
    selections: validSelections,
    requestedCompletion: intent === "complete",
  });

  switch (result.status) {
    case "invalid-part-selection":
      return builderRedirect(buildId, "invalid-part-selection");
    case "seed-parts-required":
      return builderRedirect(buildId, "seed-parts-required");
    case "forbidden":
      return redirect("/builds");
    case "completion-blocked":
      revalidatePath("/builder");
      revalidatePath("/builds");
      revalidatePath(`/builds/${result.buildId}`);
      revalidatePath("/trending");
      return builderRedirect(result.buildId, result.status);
    case "saved":
    case "completed":
      revalidatePath("/builder");
      revalidatePath("/builds");
      revalidatePath(`/builds/${result.buildId}`);
      revalidatePath("/trending");
      return builderRedirect(result.buildId, result.status);
  }
}

export async function toggleBuildVisibilityAction(formData: FormData) {
  const user = await requireUser();
  const buildId = String(formData.get("buildId") ?? "").trim();

  if (!buildId) {
    redirect("/builds");
  }

  const result = await toggleBuildVisibility(buildId, user.id);

  if (result.status === "missing-build" || result.status === "forbidden") {
    redirect("/builds");
  }

  if (result.status === "complete-first") {
    redirect(`/builds/${result.buildId}?status=complete-first`);
  }

  revalidatePath("/builds");
  revalidatePath(`/builds/${result.buildId}`);
  revalidatePath("/trending");

  redirect(`/builds/${result.buildId}?status=${result.status}`);
}

export async function cloneBuildAction(formData: FormData) {
  const user = await requireUser();
  const buildId = String(formData.get("buildId") ?? "").trim();

  if (!buildId) {
    redirect("/builds");
  }

  const result = await cloneBuild(buildId, user.id);

  if (result.status === "missing-build" || result.status === "forbidden") {
    redirect("/builds");
  }

  revalidatePath("/builds");
  revalidatePath("/builder");

  redirect(`/builder?buildId=${result.buildId}&status=${result.status}`);
}
