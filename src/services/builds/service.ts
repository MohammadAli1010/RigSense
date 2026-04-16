import {
  BuildSlot,
  BuildStatus,
  BuildVisibility,
  PartCategory,
  type Build,
  type BuildPart,
  type Part,
} from "@prisma/client";

import { analytics } from "@/lib/analytics";
import {
  buildPartsToSelections,
  getBuildSelectionSlugs,
  type BuildEditorDraft,
  type BuildSelections,
} from "@/lib/build-editor";
import { analyzeBuild } from "@/lib/compatibility";
import { prisma } from "@/lib/db";
import { errorReporting } from "@/lib/error-reporting";
import { logger } from "@/lib/logger";
import { getPartBySlug } from "@/data/mock-data";

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

type PersistBuildInput = {
  buildId?: string;
  userId: string;
  title: string;
  description: string;
  selections: BuildSelections;
  requestedCompletion: boolean;
};

export type SaveBuildResult =
  | { status: "invalid-part-selection" }
  | { status: "seed-parts-required" }
  | { status: "forbidden" }
  | { status: "saved"; buildId: string }
  | { status: "completed"; buildId: string }
  | { status: "completion-blocked"; buildId: string };

export type CloneBuildResult =
  | { status: "missing-build" }
  | { status: "forbidden" }
  | { status: "cloned"; buildId: string };

export type ToggleBuildVisibilityResult =
  | { status: "missing-build" }
  | { status: "forbidden" }
  | { status: "complete-first"; buildId: string }
  | { status: "published"; buildId: string }
  | { status: "hidden"; buildId: string };

import { BuilderSelectionParts } from "@/lib/compatibility";

function buildPartsFromSelections(selections: BuildSelections): BuilderSelectionParts {
  const cpu = selections.cpu ? getPartBySlug(selections.cpu) : undefined;
  const motherboard = selections.motherboard ? getPartBySlug(selections.motherboard) : undefined;
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
    ramQuantity: selections.ramQuantity,
    storage,
    psu,
    pcCase,
    cooler,
  };
}

export async function getOwnedBuildDraft(buildId: string, userId: string): Promise<BuildEditorDraft | null> {
  const build = await prisma.build.findUnique({
    where: {
      id: buildId,
    },
    include: {
      parts: {
        include: {
          part: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
  });

  if (!build || build.userId !== userId) {
    return null;
  }

  return {
    id: build.id,
    title: build.title,
    description: build.description ?? "",
    selections: buildPartsToSelections(build.parts),
  };
}

export async function listBuildsForUser(userId: string) {
  return prisma.build.findMany({
    where: {
      userId,
    },
    include: {
      parts: {
        include: {
          part: true,
        },
        orderBy: {
          createdAt: "asc",
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export async function saveBuild(input: PersistBuildInput): Promise<SaveBuildResult> {
  try {
    const selectedParts = buildPartsFromSelections(input.selections);
    const analysis = analyzeBuild(selectedParts);
    const orderedSlugs = getBuildSelectionSlugs(input.selections);
    const selectedSlugs = [...new Set(orderedSlugs)];

    if (selectedSlugs.some((slug) => !getPartBySlug(slug))) {
      return {
        status: "invalid-part-selection",
      };
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
      return {
        status: "seed-parts-required",
      };
    }

    const canComplete = analysis.errors.length === 0 && analysis.requiredSlotsMissing.length === 0;
    const status = input.requestedCompletion && canComplete ? BuildStatus.COMPLETED : BuildStatus.DRAFT;
    const existingBuild = input.buildId
      ? await prisma.build.findUnique({
          where: {
            id: input.buildId,
          },
        })
      : null;

    if (existingBuild && existingBuild.userId !== input.userId) {
      return {
        status: "forbidden",
      };
    }

    const savedBuild = existingBuild
      ? await prisma.build.update({
          where: {
            id: existingBuild.id,
          },
          data: {
            title: input.title,
            description: input.description || null,
            status,
            visibility:
              status === BuildStatus.COMPLETED ? existingBuild.visibility : BuildVisibility.PRIVATE,
            estimatedWattage: analysis.estimatedWattage,
            totalPriceCents: analysis.totalPriceCents,
            compatibilityStatus: analysis.compatibilityStatus,
          },
        })
      : await prisma.build.create({
          data: {
            userId: input.userId,
            title: input.title,
            description: input.description || null,
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
            quantity: slotByCategory[mockPart.category] === BuildSlot.RAM ? input.selections.ramQuantity || 1 : 1,
          };
        }),
      });
    }

    const resultStatus: SaveBuildResult["status"] =
      input.requestedCompletion && !canComplete
        ? "completion-blocked"
        : status === BuildStatus.COMPLETED
          ? "completed"
          : "saved";

    logger.info("build.saved", {
      buildId: savedBuild.id,
      userId: input.userId,
      status: resultStatus,
      requestedCompletion: input.requestedCompletion,
    });
    analytics.track("build_saved", {
      buildId: savedBuild.id,
      userId: input.userId,
      status: resultStatus,
      compatibilityStatus: analysis.compatibilityStatus,
    });

    return {
      status: resultStatus,
      buildId: savedBuild.id,
    };
  } catch (error) {
    errorReporting.captureException(error, {
      scope: "build.save",
      userId: input.userId,
      buildId: input.buildId ?? null,
    });
    throw error;
  }
}

export async function toggleBuildVisibility(
  buildId: string,
  userId: string,
): Promise<ToggleBuildVisibilityResult> {
  try {
    const build = await prisma.build.findUnique({
      where: {
        id: buildId,
      },
    });

    if (!build) {
      return {
        status: "missing-build",
      };
    }

    if (build.userId !== userId) {
      return {
        status: "forbidden",
      };
    }

    if (build.status !== BuildStatus.COMPLETED) {
      return {
        status: "complete-first",
        buildId: build.id,
      };
    }

    const nextVisibility =
      build.visibility === BuildVisibility.PUBLIC ? BuildVisibility.PRIVATE : BuildVisibility.PUBLIC;

    await prisma.build.update({
      where: {
        id: build.id,
      },
      data: {
        visibility: nextVisibility,
      },
    });

    const status = nextVisibility === BuildVisibility.PUBLIC ? "published" : "hidden";

    logger.info("build.visibility_toggled", {
      buildId: build.id,
      userId,
      visibility: nextVisibility,
    });
    analytics.track("build_visibility_toggled", {
      buildId: build.id,
      userId,
      visibility: nextVisibility,
    });

    return {
      status,
      buildId: build.id,
    };
  } catch (error) {
    errorReporting.captureException(error, {
      scope: "build.toggle_visibility",
      buildId,
      userId,
    });
    throw error;
  }
}

export async function cloneBuild(
  sourceBuildId: string,
  targetUserId: string,
): Promise<CloneBuildResult> {
  try {
    const sourceBuild = await prisma.build.findUnique({
      where: { id: sourceBuildId },
      include: { parts: true },
    });

    if (!sourceBuild) {
      return { status: "missing-build" };
    }

    // Can only clone if it's yours or if it's public
    if (sourceBuild.userId !== targetUserId && sourceBuild.visibility !== BuildVisibility.PUBLIC) {
      return { status: "forbidden" };
    }

    const clonedBuild = await prisma.$transaction(async (tx) => {
      const newBuild = await tx.build.create({
        data: {
          userId: targetUserId,
          title: `Copy of ${sourceBuild.title}`,
          description: sourceBuild.description,
          status: BuildStatus.DRAFT,
          visibility: BuildVisibility.PRIVATE,
          estimatedWattage: sourceBuild.estimatedWattage,
          totalPriceCents: sourceBuild.totalPriceCents,
          compatibilityStatus: sourceBuild.compatibilityStatus,
        },
      });

      if (sourceBuild.parts.length > 0) {
        await tx.buildPart.createMany({
          data: sourceBuild.parts.map((p) => ({
            buildId: newBuild.id,
            partId: p.partId,
            slot: p.slot,
            quantity: p.quantity,
          })),
        });
      }

      return newBuild;
    });

    logger.info("build.cloned", {
      sourceBuildId,
      clonedBuildId: clonedBuild.id,
      userId: targetUserId,
    });
    
    analytics.track("build_cloned", {
      sourceBuildId,
      clonedBuildId: clonedBuild.id,
      userId: targetUserId,
    });

    return {
      status: "cloned",
      buildId: clonedBuild.id,
    };
  } catch (error) {
    errorReporting.captureException(error, {
      scope: "build.clone",
      sourceBuildId,
      userId: targetUserId,
    });
    throw error;
  }
}

export type BuildListItem = Build & {
  parts: Array<BuildPart & { part: Part }>;
};
