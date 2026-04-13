import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { toggleBuildVisibilityAction } from "@/actions/builds";
import { auth } from "@/auth";
import {
  getAnyBuildById,
  getBenchmarksForBuild,
  getBuildParts,
  getCategoryPathForCategory,
} from "@/data/mock-data";
import { safeDatabaseQuery } from "@/lib/database-reachability";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";

type BuildDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    status?: string;
  }>;
};

function getStatusMessage(status?: string) {
  switch (status) {
    case "published":
      return "Build is now public and eligible for discovery.";
    case "hidden":
      return "Build visibility switched back to private.";
    case "complete-first":
      return "Only completed builds can be published.";
    default:
      return null;
  }
}

export default async function BuildDetailPage({
  params,
  searchParams,
}: BuildDetailPageProps) {
  const { id } = await params;
  const { status: statusParam } = await searchParams;
  const session = await auth();
  const dbBuild = await safeDatabaseQuery(
    () =>
      prisma.build.findUnique({
        where: {
          id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
            },
          },
          parts: {
            include: {
              part: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      }),
    {
      label: `build-detail-${id}`,
    },
  );

  if (dbBuild?.visibility === "PRIVATE" && session?.user?.id !== dbBuild.userId) {
    if (!session?.user) {
      redirect("/login");
    }

    notFound();
  }

  const fallbackBuild = dbBuild ? null : getAnyBuildById(id);
  const build = dbBuild ?? fallbackBuild;

  if (!build) {
    notFound();
  }

  if (!dbBuild && build.visibility === "PRIVATE") {
    if (!session?.user) {
      redirect("/login");
    }

    notFound();
  }

  const mockBuild = fallbackBuild!;

  const buildParts = dbBuild
    ? dbBuild.parts.map((item) => ({
        slug: item.part.slug,
        brand: item.part.brand,
        name: item.part.name,
        priceCents: item.part.priceCents,
        categoryPath: getCategoryPathForCategory(item.part.category) ?? "parts",
      }))
    : getBuildParts(mockBuild);
  const buildBenchmarks = getBenchmarksForBuild(build.id);
  const isOwner = Boolean(dbBuild && session?.user?.id === dbBuild.userId);
  const statusMessage = getStatusMessage(statusParam);
  const buildLabels = dbBuild
    ? [dbBuild.status, dbBuild.visibility, dbBuild.compatibilityStatus]
    : mockBuild.tags;
  const builderName = dbBuild ? dbBuild.user.name : mockBuild.authorName;
  const buildDescription = build.description ?? "No build notes added yet.";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16 lg:py-24">
      {statusMessage ? (
        <p className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-sm leading-7 text-cyan-100">
          {statusMessage}
        </p>
      ) : null}

      <section className="grid gap-8 lg:grid-cols-[1fr_0.7fr]">
        <div className="space-y-5">
          <Link
            href={build.visibility === "PRIVATE" ? "/builds" : "/trending"}
            className="text-sm text-cyan-200 hover:text-cyan-100"
          >
            {build.visibility === "PRIVATE" ? "Back to my builds" : "Back to trending builds"}
          </Link>
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
            {build.visibility === "PRIVATE" ? "Private build" : "Public build"}
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {build.title}
          </h1>
          <p className="text-lg leading-8 text-slate-300">{buildDescription}</p>
          <div className="flex flex-wrap gap-2">
            {buildLabels.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300"
              >
                {tag}
              </span>
            ))}
          </div>

          {isOwner && build.status === "DRAFT" ? (
            <Link
              href={`/builder?buildId=${build.id}`}
              className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
            >
              Continue editing draft
            </Link>
          ) : null}
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Build snapshot</p>
          <div className="mt-6 space-y-4 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-4">
              <span>Builder</span>
              <span>{builderName}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Total price</span>
              <span>{formatPrice(build.totalPriceCents)}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Estimated wattage</span>
              <span>{build.estimatedWattage}W</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Status</span>
              <span>{build.status}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Visibility</span>
              <span>{build.visibility}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Compatibility</span>
              <span>{build.compatibilityStatus}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span>Trend score</span>
              <span>{build.trendScore}</span>
            </div>
          </div>

          {isOwner && build.status === "COMPLETED" ? (
            <form action={toggleBuildVisibilityAction} className="mt-6">
              <input type="hidden" name="buildId" value={build.id} />
              <button
                type="submit"
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                {build.visibility === "PUBLIC" ? "Make private" : "Publish build"}
              </button>
            </form>
          ) : null}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Selected parts</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {buildParts.map((part) => (
              <Link
                key={part.slug}
                href={`/parts/${part.categoryPath}/${part.slug}`}
                className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-cyan-400/40"
              >
                <p className="text-sm text-slate-400">{part.brand}</p>
                <h2 className="mt-2 text-lg font-semibold text-white">{part.name}</h2>
                <p className="mt-3 text-sm text-slate-400">{formatPrice(part.priceCents)}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Benchmark notes</p>
          <div className="mt-6 space-y-4">
            {buildBenchmarks.map((benchmark) => (
              <article
                key={benchmark.id}
                className="rounded-3xl border border-white/10 bg-slate-950/60 p-5"
              >
                <h2 className="text-lg font-semibold text-white">{benchmark.workload}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-400">{benchmark.notes}</p>
                <p className="mt-4 text-2xl font-semibold text-cyan-200">
                  {benchmark.avgFps ? `${benchmark.avgFps} FPS` : `Score ${benchmark.score}`}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
