import Link from "next/link";
import { notFound } from "next/navigation";

import { getPartDetailData } from "@/lib/public-content";
import { formatPrice, formatSegment, formatSpecValue } from "@/lib/format";

type PartDetailPageProps = {
  params: Promise<{
    category: string;
    slug: string;
  }>;
};

export default async function PartDetailPage({ params }: PartDetailPageProps) {
  const { category, slug } = await params;
  const data = await getPartDetailData(category, slug);

  if (!data) {
    notFound();
  }

  const { categoryInfo, part, relatedParts, benchmarks: relatedBenchmarks } = data;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16 lg:py-24">
      <section className="grid gap-8 lg:grid-cols-[1fr_0.72fr]">
        <div className="space-y-5">
          <Link
            href={`/parts/${category}`}
            className="text-sm text-cyan-200 hover:text-cyan-100"
          >
            Back to {categoryInfo.label}
          </Link>
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
            {categoryInfo.singular}
          </span>
          <div>
            <p className="text-sm text-slate-400">{part.brand}</p>
            <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              {part.name}
            </h1>
          </div>
          <p className="text-lg leading-8 text-slate-300">{part.description}</p>
          <div className="flex flex-wrap gap-2">
            {part.highlights.map((highlight) => (
              <span
                key={highlight}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-200"
              >
                {highlight}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
            Quick summary
          </p>
          <p className="mt-4 text-3xl font-semibold text-white">
            {formatPrice(part.priceCents)}
          </p>
          <p className="mt-4 text-sm leading-7 text-slate-400">
            This seeded profile is already structured for the builder, benchmark, and
            future live pricing flows. The specs below are the same facts the
            compatibility layer will use later.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">Specs</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {Object.entries(part.specs).map(([key, value]) => (
              <div key={key} className="rounded-3xl border border-white/10 bg-slate-950/60 p-5">
                <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                  {formatSegment(key)}
                </p>
                <p className="mt-3 text-lg font-semibold text-white">
                  {formatSpecValue(value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
            Benchmark references
          </p>
          <div className="mt-6 space-y-4">
            {relatedBenchmarks.length > 0 ? (
              relatedBenchmarks.map((benchmark) => (
                <div
                  key={benchmark.id}
                  className="rounded-3xl border border-white/10 bg-slate-950/60 p-5"
                >
                  <h2 className="text-lg font-semibold text-white">{benchmark.workload}</h2>
                  <p className="mt-2 text-sm text-slate-400">{benchmark.notes}</p>
                  <p className="mt-4 text-2xl font-semibold text-cyan-200">
                    {benchmark.avgFps ? `${benchmark.avgFps} FPS` : `Score ${benchmark.score}`}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-white/10 p-5 text-sm leading-7 text-slate-400">
                Benchmark cards for this part will appear here once the relevant manual benchmark rows are seeded.
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
              Related {categoryInfo.label.toLowerCase()}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              More picks in the same category
            </h2>
          </div>
          <Link
            href="/builder"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
          >
            Open builder
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {relatedParts.map((relatedPart) => (
            <Link
              key={relatedPart.slug}
              href={`/parts/${relatedPart.categoryPath}/${relatedPart.slug}`}
              className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 transition hover:border-cyan-400/40"
            >
              <h3 className="text-xl font-semibold text-white">{relatedPart.name}</h3>
              <p className="mt-3 text-sm leading-7 text-slate-400">
                {relatedPart.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
