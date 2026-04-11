import Link from "next/link";

import { getPartsOverviewData } from "@/lib/public-content";
import { formatPrice } from "@/lib/format";

export default async function PartsPage() {
  const { categories, featuredParts } = await getPartsOverviewData();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-16 lg:py-24">
      <section className="max-w-3xl space-y-5">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
          Catalog
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Browse the first seeded RigSense parts catalog.
        </h1>
        <p className="text-lg leading-8 text-slate-300">
          Every major component category is populated with realistic dummy data so
          the catalog, benchmark, and future builder flows all have a shared source
          of truth before live pricing integrations arrive.
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {categories.map((category) => (
          <Link
            key={category.path}
            href={`/parts/${category.path}`}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/40"
          >
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
              {category.count} items
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{category.label}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">
              {category.description}
            </p>
          </Link>
        ))}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
              Featured parts
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-white">
              Current spotlight picks from the dummy dataset
            </h2>
          </div>
          <Link
            href="/benchmarks"
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
          >
            View benchmarks
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featuredParts.map((part) => (
            <Link
              key={part.slug}
              href={`/parts/${part.categoryPath}/${part.slug}`}
              className="rounded-[2rem] border border-white/10 bg-slate-950/60 p-6 transition hover:border-cyan-400/40"
            >
              <p className="text-sm text-slate-400">{part.brand}</p>
              <h3 className="mt-2 text-xl font-semibold text-white">{part.name}</h3>
              <p className="mt-4 text-sm leading-7 text-slate-400">{part.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {part.highlights.map((highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                  >
                    {highlight}
                  </span>
                ))}
              </div>
              <p className="mt-5 text-lg font-semibold text-cyan-200">
                {formatPrice(part.priceCents)}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
