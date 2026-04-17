import Link from "next/link";

import { getTrendingBuildsOverviewData } from "@/lib/public-content";
import { formatPrice } from "@/lib/format";

export default async function TrendingPage() {
  const trendingBuilds = await getTrendingBuildsOverviewData();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 lg:py-24">
      <section className="max-w-3xl space-y-5">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
          Trending
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Public completed builds ranked by their seeded trend score.
        </h1>
        <p className="text-lg leading-8 text-slate-300">
          Only public completed rigs belong here. Private drafts stay invisible, which keeps
          discovery pages clean and aligned with the product rules we locked for v1.
        </p>
      </section>

      <section className="space-y-4">
        {trendingBuilds.map((build, index) => (
          <Link
            key={build.id}
            href={`/builds/${build.id}`}
            className="block rounded-[2rem] border border-white/10 bg-white/5 p-8 transition hover:border-cyan-400/40"
          >
            <div className="grid gap-6 lg:grid-cols-[auto_1fr_auto] lg:items-center">
              <div className="text-5xl font-semibold text-cyan-200">0{index + 1}</div>
              <div>
                <h2 className="text-2xl font-semibold text-white">{build.title}</h2>
                <p className="mt-1 text-sm text-cyan-400 font-medium">By {build.authorName}</p>
                <p className="mt-3 text-sm leading-7 text-slate-400">{build.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {build.intendedUse ? (
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                      {build.intendedUse}
                    </span>
                  ) : null}
                  {build.performanceTier ? (
                    <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs text-cyan-200">
                      {build.performanceTier}
                    </span>
                  ) : null}
                  {build.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-left lg:text-right">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Trend</p>
                <p className="mt-2 text-3xl font-semibold text-white">{build.trendScore}</p>
                <p className="mt-3 text-sm text-slate-400">{formatPrice(build.totalPriceCents)}</p>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
