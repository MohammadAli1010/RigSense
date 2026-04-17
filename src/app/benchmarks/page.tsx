import Link from "next/link";

import { getBenchmarksOverviewData } from "@/lib/public-content";

export default async function BenchmarksPage() {
  const { partBenchmarks, buildBenchmarks } = await getBenchmarksOverviewData();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16 lg:py-24">
      <section className="max-w-3xl space-y-5">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
          Benchmarks
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Manual benchmark cards are live with seeded part and build results.
        </h1>
        <p className="text-lg leading-8 text-slate-300">
          V1 keeps benchmarks intentionally simple: curated records grouped by workload.
          That gives the catalog and public build pages useful context without requiring
          a complicated ingestion pipeline yet.
        </p>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Part benchmarks</p>
            <h2 className="mt-2 text-3xl font-semibold text-white">Component-level snapshots</h2>
          </div>
          <Link
            href="/parts"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
          >
            Browse parts
          </Link>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {partBenchmarks.map((benchmark) => (
            <article
              key={benchmark.id}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
            >
              <p className="text-sm text-slate-400">{benchmark.title}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{benchmark.workload}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">{benchmark.notes}</p>
              <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500">
                {benchmark.resolution && <span>Resolution: {benchmark.resolution}</span>}
                {benchmark.settings && <span>Settings: {benchmark.settings}</span>}
                {benchmark.source && <span>Source: {benchmark.source}</span>}
              </div>
              <p className="mt-5 text-2xl font-semibold text-cyan-200">
                {benchmark.avgFps ? `${benchmark.avgFps} ${benchmark.unit ?? "FPS"}` : `${benchmark.score} ${benchmark.unit ?? "Score"}`}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div>
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Build benchmarks</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Full rig performance snapshots</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {buildBenchmarks.map((benchmark) => (
            <article
              key={benchmark.id}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
            >
              <p className="text-sm text-slate-400">{benchmark.title}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{benchmark.workload}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">{benchmark.notes}</p>
              <div className="mt-4 flex flex-col gap-1 text-xs text-slate-500">
                {benchmark.resolution && <span>Resolution: {benchmark.resolution}</span>}
                {benchmark.settings && <span>Settings: {benchmark.settings}</span>}
                {benchmark.source && <span>Source: {benchmark.source}</span>}
              </div>
              <p className="mt-5 text-2xl font-semibold text-cyan-200">
                {benchmark.avgFps ? `${benchmark.avgFps} ${benchmark.unit ?? "FPS"}` : `${benchmark.score} ${benchmark.unit ?? "Score"}`}
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
