import Link from "next/link";

import { formatPrice } from "@/lib/format";
import { getHomePageData } from "@/lib/public-content";

const featureTracks = [
  {
    title: "Parts discovery",
    description:
      "Search across CPUs, GPUs, motherboards, RAM, storage, PSUs, cases, and coolers with seeded catalog data first.",
  },
  {
    title: "Builder workflow",
    description:
      "Assemble builds with compatibility checks, estimated wattage, and private-by-default saved drafts.",
  },
  {
    title: "Guides and benchmarks",
    description:
      "Pair editorial recommendations with quick benchmark views so users can choose parts with context.",
  },
  {
    title: "Community Q&A",
    description:
      "Let users ask questions, vote on answers, and mark a single answer as solved before expanding into larger threads later.",
  },
];

const launchPriorities = [
  "Credentials-based authentication with name and email profiles.",
  "A catalog-first builder flow with practical compatibility rules.",
  "Publicly readable guides, benchmarks, and forum pages.",
  "Private build drafts with an optional public publish step after completion.",
];

export default async function Home() {
  const { categoryCards, featuredParts, guides, recentQuestions, stats, trendingBuilds } =
    await getHomePageData();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-20 px-6 py-16 lg:py-24">
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
        <div className="space-y-8">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
            Custom PC Planning
          </span>
          <div className="space-y-5">
            <h1 className="max-w-4xl text-5xl font-semibold tracking-tight text-white sm:text-6xl">
              Build smarter rigs with catalog clarity, private planning, and community-backed answers.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-300">
              RigSense is the foundation for a custom PC website with parts browsing,
              a guided builder, public benchmarks, build sharing, and a Q&A forum that
              surfaces the most useful answers first.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/parts"
              className="rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
            >
              Browse parts
            </Link>
            <Link
              href="/builder"
              className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
            >
              Open builder
            </Link>
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8 backdrop-blur">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-200">
            V1 launch priorities
          </p>
          <div className="mt-6 space-y-4">
            {launchPriorities.map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-4 text-sm leading-7 text-slate-300"
              >
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-[2rem] border border-cyan-400/20 bg-cyan-400/10 p-6"
          >
            <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
              {stat.label}
            </p>
            <p className="mt-4 text-4xl font-semibold text-white">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {featureTracks.map((track) => (
          <article
            key={track.title}
            className="rounded-[2rem] border border-white/10 bg-white/5 p-6"
          >
            <h2 className="text-xl font-semibold text-white">{track.title}</h2>
            <p className="mt-4 text-sm leading-7 text-slate-400">{track.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
                Category coverage
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Every core PC part category is seeded.
              </h2>
            </div>
            <Link
              href="/parts"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
            >
              View catalog
            </Link>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {categoryCards.map((category) => (
              <Link
                key={category.path}
                href={`/parts/${category.path}`}
                className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-cyan-400/40"
              >
                <h3 className="text-lg font-semibold text-white">{category.label}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
                Featured parts
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Real dummy data now powers the public catalog.
              </h2>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {featuredParts.map((part) => (
              <Link
                key={part.slug}
                href={`/parts/${part.categoryPath}/${part.slug}`}
                className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-cyan-400/40"
              >
                <p className="text-sm text-slate-400">{part.brand}</p>
                <h3 className="mt-2 text-lg font-semibold text-white">{part.name}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400">{part.description}</p>
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
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
                Trending builds
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Public completed rigs already have sample momentum.
              </h2>
            </div>
            <Link
              href="/trending"
              className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
            >
              Open trending
            </Link>
          </div>

          <div className="mt-8 space-y-4">
            {trendingBuilds.map((build) => (
              <Link
                key={build.id}
                href={`/builds/${build.id}`}
                className="block rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-cyan-400/40"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{build.title}</h3>
                    <p className="mt-2 text-sm leading-7 text-slate-400">
                      {build.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                      Trend score
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-cyan-200">
                      {build.trendScore}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.25em] text-cyan-200">
                Learn and ask
              </p>
              <h2 className="mt-3 text-3xl font-semibold text-white">
                Public guides and forum pages are already seeded.
              </h2>
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <div className="grid gap-4">
              {guides.slice(0, 2).map((guide) => (
                <Link
                  key={guide.slug}
                  href={`/guides/${guide.slug}`}
                  className="rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-cyan-400/40"
                >
                  <p className="text-sm text-slate-400">{guide.readTime}</p>
                  <h3 className="mt-2 text-lg font-semibold text-white">{guide.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{guide.excerpt}</p>
                </Link>
              ))}
            </div>

            <div className="space-y-4 border-t border-white/10 pt-6">
              {recentQuestions.map((question) => (
                <Link
                  key={question.id}
                  href={`/forum/questions/${question.id}`}
                  className="block rounded-3xl border border-white/10 bg-slate-950/60 p-5 transition hover:border-cyan-400/40"
                >
                  <h3 className="text-lg font-semibold text-white">{question.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-400">{question.body}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
