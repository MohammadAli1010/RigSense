"use server";

import { BuildSlot, BuildStatus, BuildVisibility, PartCategory } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getPartBySlug } from "@/data/mock-data";
import { analyzeBuild } from "@/lib/compatibility";
import {
  getBuildSelectionSlugs,
  parseBuildSelections,
  type BuildSelections,
} from "@/lib/build-editor";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

const metadataSchema = z.object({
  title: z.string().trim().min(3).max(80),
  description: z.string().trim().max(280).optional().default(""),
});

const slotByCategory: Record<PartCategory, BuildSlot> = {
  CPU: BuildSlot.CPU,
  MOTHERBOARD: BuildSlot.MOTHERBOARD,
  GPU: BuildSlot.GPU,
  RAM: BuildSlot.RAM,
  STORAGE: BuildSlot.STORAGE,
  PSU: BuildSlot.PSU,
  CASE: BuildSlot.CASE,
  COOLER: BuildSlot.COOLER,
};

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

function buildPartsFromSelections(selections: BuildSelections) {
  const cpu = selections.cpu ? getPartBySlug(selections.cpu) : undefined;
  const motherboard = selections.motherboard
    ? getPartBySlug(selections.motherboard)
    : undefined;
  const gpu = selections.gpu ? getPartBySlug(selections.gpu) : undefined;
  const ram = selections.ram ? getPartBySlug(selections.ram) : undefined;
  const psu = selections.psu ? getPartBySlug(selections.psu) : undefined;
  const pcCase = selections.pcCase ? getPartBySlug(selections.pcCase) : undefined;
  const cooler = selections.cooler ? getPartBySlug(selections.cooler) : undefined;
  const storage = [selections.primaryStorage, selections.secondaryStorage]
    .filter(Boolean)
    .map((slug) => getPartBySlug(slug))
    .filter((part): part is NonNullable<typeof cpu> => Boolean(part));

  return {
    cpu,
    motherboard,
    gpu,
    ram,
    storage,
    psu,
    pcCase,
    cooler,
  };
}

async function persistBuild({
  buildId,
  userId,
  title,
  description,
  selections,
  requestedCompletion,
}: {
  buildId?: string;
  userId: string;
  title: string;
  description: string;
  selections: BuildSelections;
  requestedCompletion: boolean;
}) {
  const selectedParts = buildPartsFromSelections(selections);
  const analysis = analyzeBuild(selectedParts);
  const orderedSlugs = getBuildSelectionSlugs(selections);
  const selectedSlugs = [...new Set(orderedSlugs)];

  if (selectedSlugs.some((slug) => !getPartBySlug(slug))) {
    builderRedirect(buildId, "invalid-part-selection");
  }

  const dbParts = selectedSlugs.length
    ? await prisma.part.findMany({
        where: {
          slug: {
            in: selectedSlugs,
          },
        },
      })
    : [];

  if (dbParts.length !== selectedSlugs.length) {
    builderRedirect(buildId, "seed-parts-required");
  }

  const canComplete =
    analysis.errors.length === 0 && analysis.requiredSlotsMissing.length === 0;
  const status = requestedCompletion && canComplete ? BuildStatus.COMPLETED : BuildStatus.DRAFT;

  const existingBuild = buildId
    ? await prisma.build.findUnique({
        where: {
          id: buildId,
        },
      })
    : null;

  if (existingBuild && existingBuild.userId !== userId) {
    redirect("/builds");
  }

  const savedBuild = existingBuild
    ? await prisma.build.update({
        where: {
          id: existingBuild.id,
        },
        data: {
          title,
          description: description || null,
          status,
          visibility:
            status === BuildStatus.COMPLETED
              ? existingBuild.visibility
              : BuildVisibility.PRIVATE,
          estimatedWattage: analysis.estimatedWattage,
          totalPriceCents: analysis.totalPriceCents,
          compatibilityStatus: analysis.compatibilityStatus,
        },
      })
    : await prisma.build.create({
        data: {
          userId,
          title,
          description: description || null,
          status,
          visibility: BuildVisibility.PRIVATE,
          estimatedWattage: analysis.estimatedWattage,
          totalPriceCents: analysis.totalPriceCents,
          compatibilityStatus: analysis.compatibilityStatus,
        },
      });

  await prisma.buildPart.deleteMany({
    where: {
      buildId: savedBuild.id,
    },
  });

  if (dbParts.length > 0) {
    const dbPartsBySlug = new Map(dbParts.map((part) => [part.slug, part]));

    await prisma.buildPart.createMany({
      data: orderedSlugs.flatMap((slug) => {
        const mockPart = getPartBySlug(slug);
        const dbPart = dbPartsBySlug.get(slug);

        if (!mockPart || !dbPart) {
          return [];
        }

        return {
          buildId: savedBuild.id,
          partId: dbPart.id,
          slot: slotByCategory[mockPart.category],
          quantity: 1,
        };
      }),
    });
  }

  revalidatePath("/builder");
  revalidatePath("/builds");
  revalidatePath(`/builds/${savedBuild.id}`);
  revalidatePath("/trending");

  if (requestedCompletion && !canComplete) {
    builderRedirect(savedBuild.id, "completion-blocked");
  }

  builderRedirect(savedBuild.id, status === BuildStatus.COMPLETED ? "completed" : "saved");
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
    builderRedirect(buildId, "invalid-build-data");
  }

  if (!metadata.success) {
    builderRedirect(buildId, "title-required");
  }

  const validSelections = selections;
  const validMetadata = metadata.data;

  await persistBuild({
    buildId,
    userId: user.id,
    title: validMetadata.title,
    description: validMetadata.description,
    selections: validSelections,
    requestedCompletion: intent === "complete",
  });
}

export async function toggleBuildVisibilityAction(formData: FormData) {
  const user = await requireUser();
  const buildId = String(formData.get("buildId") ?? "").trim();

  if (!buildId) {
    redirect("/builds");
  }

  const build = await prisma.build.findUnique({
    where: {
      id: buildId,
    },
  });

  if (!build || build.userId !== user.id) {
    redirect("/builds");
  }

  if (build.status !== BuildStatus.COMPLETED) {
    redirect(`/builds/${build.id}?status=complete-first`);
  }

  const nextVisibility =
    build.visibility === BuildVisibility.PUBLIC
      ? BuildVisibility.PRIVATE
      : BuildVisibility.PUBLIC;

  await prisma.build.update({
    where: {
      id: build.id,
    },
    data: {
      visibility: nextVisibility,
    },
  });

  revalidatePath("/builds");
  revalidatePath(`/builds/${build.id}`);
  revalidatePath("/trending");

  redirect(
    `/builds/${build.id}?status=${nextVisibility === BuildVisibility.PUBLIC ? "published" : "hidden"}`,
  );
}
