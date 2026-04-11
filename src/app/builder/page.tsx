import { BuilderWorkbench } from "@/components/builder/builder-workbench";
import { parts, publicBuilds } from "@/data/mock-data";
import { buildPartsToSelections } from "@/lib/build-editor";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { redirect } from "next/navigation";

type BuilderPageProps = {
  searchParams: Promise<{
    buildId?: string;
    status?: string;
  }>;
};

export default async function BuilderPage({ searchParams }: BuilderPageProps) {
  const user = await requireUser();
  const { buildId, status } = await searchParams;

  const draft = buildId
    ? await prisma.build.findUnique({
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
      })
    : null;

  const initialDraft =
    draft && draft.userId === user.id
      ? {
          id: draft.id,
          title: draft.title,
          description: draft.description ?? "",
          selections: buildPartsToSelections(draft.parts),
        }
      : undefined;

  if (buildId && !initialDraft) {
    redirect("/builds");
  }

  return (
    <BuilderWorkbench
      parts={parts}
      presets={publicBuilds.slice(0, 2)}
      initialDraft={initialDraft}
      status={status}
    />
  );
}
