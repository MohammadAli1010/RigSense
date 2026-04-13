import { BuilderWorkbench } from "@/components/builder/builder-workbench";
import { parts, publicBuilds } from "@/data/mock-data";
import { requireUser } from "@/lib/session";
import { getOwnedBuildDraft } from "@/services/builds/service";
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

  const initialDraft = buildId ? await getOwnedBuildDraft(buildId, user.id) : null;

  if (buildId && !initialDraft) {
    redirect("/builds");
  }

  return (
    <BuilderWorkbench
      parts={parts}
      presets={publicBuilds.slice(0, 2)}
      initialDraft={initialDraft ?? undefined}
      status={status}
    />
  );
}
