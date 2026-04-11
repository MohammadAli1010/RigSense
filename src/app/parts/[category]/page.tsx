import Link from "next/link";
import { notFound } from "next/navigation";

import { getPartCategoryData } from "@/lib/public-content";
import { formatPrice } from "@/lib/format";

type PartCategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function PartCategoryPage({ params }: PartCategoryPageProps) {
  const { category } = await params;
  const data = await getPartCategoryData(category);

  if (!data) {
    notFound();
  }

  const { categoryInfo, parts: categoryParts } = data;

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6 py-16 lg:py-24">
      <section className="max-w-3xl space-y-5">
        <Link href="/parts" className="text-sm text-cyan-200 hover:text-cyan-100">
          Back to all parts
        </Link>
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
          {categoryInfo.singular}
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {categoryInfo.label}
        </h1>
        <p className="text-lg leading-8 text-slate-300">
          {categoryInfo.description}
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categoryParts.map((part) => (
          <Link
            key={part.slug}
            href={`/parts/${part.categoryPath}/${part.slug}`}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-6 transition hover:border-cyan-400/40"
          >
            <p className="text-sm text-slate-400">{part.brand}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{part.name}</h2>
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
      </section>
    </div>
  );
}
