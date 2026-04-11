import Link from "next/link";

import { getCategoryPathForCategory } from "@/data/mock-data";
import { prisma } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import { requireUser } from "@/lib/session";

export default async function BuildsPage() {
  const user = await requireUser();
  const builds = await prisma.build.findMany({
    where: {
      userId: user.id,
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
  const drafts = builds.filter((build) => build.status === "DRAFT");
  const completed = builds.filter((build) => build.status === "COMPLETED");

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 lg:py-24">
      <section className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
        <div className="space-y-5">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
            My Builds
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Your protected build workspace now tracks real saved builds.
          </h1>
          <p className="text-lg leading-8 text-slate-300">
            Drafts, completed builds, and public visibility now hang off the database-backed
            build model. This page is the owner view for everything you save from the builder.
          </p>
        </div>
        <Link
          href="/builder"
          className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
        >
          Open builder
        </Link>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Drafts</p>
          <p className="mt-4 text-4xl font-semibold text-white">{drafts.length}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Completed</p>
          <p className="mt-4 text-4xl font-semibold text-white">{completed.length}</p>
        </div>
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Publicly shared</p>
          <p className="mt-4 text-4xl font-semibold text-white">
            {completed.filter((build) => build.visibility === "PUBLIC").length}
          </p>
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Saved builds</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Your current workspace</h2>
        </div>

        {builds.length > 0 ? (
          <div className="space-y-4">
          {builds.map((build) => {
            const selectedParts = build.parts.map((item) => item.part);

            return (
              <Link
                key={build.id}
                href={build.status === "DRAFT" ? `/builder?buildId=${build.id}` : `/builds/${build.id}`}
                className="block rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/40"
              >
                <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        {build.status}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        {build.visibility}
                      </span>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        {build.compatibilityStatus}
                      </span>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold text-white">{build.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{build.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {selectedParts.map((part) => (
                        <span
                          key={`${build.id}-${part.slug}`}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                        >
                          {getCategoryPathForCategory(part.category)?.toUpperCase() ?? part.category}: {part.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-left lg:text-right">
                    <p className="text-sm text-slate-400">{formatPrice(build.totalPriceCents)}</p>
                    <p className="mt-2 text-sm text-slate-400">{build.estimatedWattage}W estimated</p>
                  </div>
                </div>
              </Link>
            );
          })}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-dashed border-white/10 p-8 text-sm leading-7 text-slate-400">
            You have not saved any builds yet. Start in the builder, save a draft, and it will appear here.
          </div>
        )}
      </section>
    </div>
  );
}
