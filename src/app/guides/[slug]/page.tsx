import Link from "next/link";
import { notFound } from "next/navigation";

import { getGuideDetailData } from "@/lib/public-content";

type GuideDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function GuideDetailPage({ params }: GuideDetailPageProps) {
  const { slug } = await params;
  const guide = await getGuideDetailData(slug);

  if (!guide) {
    notFound();
  }

  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16 lg:py-24">
      <div className="space-y-5">
        <Link href="/guides" className="text-sm text-cyan-200 hover:text-cyan-100">
          Back to guides
        </Link>
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
          {guide.readTime}
        </span>
        <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          {guide.title}
        </h1>
        <p className="text-lg leading-8 text-slate-300">{guide.excerpt}</p>
        <div className="flex flex-wrap gap-2">
          {guide.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-white/10 px-3 py-1 text-sm text-slate-300"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <div className="space-y-6 text-lg leading-8 text-slate-300">
          {guide.content.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
