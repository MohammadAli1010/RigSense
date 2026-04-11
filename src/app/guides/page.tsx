import Link from "next/link";

import { getGuidesOverviewData } from "@/lib/public-content";

export default async function GuidesPage() {
  const guides = await getGuidesOverviewData();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 lg:py-24">
      <section className="max-w-3xl space-y-5">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
          Guides
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Public buying guides and build advice are already seeded.
        </h1>
        <p className="text-lg leading-8 text-slate-300">
          Visitors can browse recommendations before logging in. These guide pages
          are the editorial counterpart to the catalog and benchmark views.
        </p>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {guides.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-8 transition hover:border-cyan-400/40"
          >
            <p className="text-sm text-slate-400">{guide.readTime}</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{guide.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">{guide.excerpt}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {guide.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
