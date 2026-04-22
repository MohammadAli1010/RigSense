import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getUserProfileData } from "@/lib/public-content";
import { formatPrice } from "@/lib/format";

type UserProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params;
  const user = await getUserProfileData(id);

  if (!user) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-12 px-6 py-16 lg:py-24">
      {/* Profile Header */}
      <section className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-center gap-6">
          <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-3xl font-bold text-white shadow-inner relative overflow-hidden">
            {user.imageUrl ? (
              <Image src={user.imageUrl} alt={user.name} fill className="object-cover" />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h1 className="text-4xl font-semibold tracking-tight text-white">{user.name}</h1>
            <p className="mt-2 text-slate-400">
              Joined {new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(user.joinedAt)}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-300 max-w-xl">{user.bio}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 rounded-3xl border border-white/10 bg-white/5 p-6 md:flex-col md:gap-6 lg:flex-row">
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Reputation</p>
            <p className="mt-1 text-2xl font-bold text-cyan-400">{user.stats.reputation}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Builds</p>
            <p className="mt-1 text-2xl font-bold text-white">{user.stats.publicBuilds}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Forum posts</p>
            <p className="mt-1 text-2xl font-bold text-white">{user.stats.questions + user.stats.answers}</p>
          </div>
        </div>
      </section>

      {/* Public Builds */}
      <section>
        <h2 className="text-2xl font-semibold text-white mb-6">Public Builds</h2>
        {user.builds.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2">
            {user.builds.map((build) => (
              <Link
                key={build.id}
                href={`/builds/${build.id}`}
                className="flex flex-col justify-between rounded-3xl border border-white/10 bg-slate-950/60 p-6 transition hover:border-cyan-400/40 hover:bg-slate-900/50"
              >
                <div>
                  <h3 className="text-xl font-semibold text-white">{build.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-400 line-clamp-2">
                    {build.description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {build.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-wider text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                  <span className="text-lg font-medium text-cyan-400">{formatPrice(build.totalPriceCents)}</span>
                  <span className="text-xs text-slate-500">{build.estimatedWattage}W</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-white/10 p-8 text-center">
            <p className="text-slate-400">{user.name} hasn&apos;t published any public builds yet.</p>
          </div>
        )}
      </section>

      {/* Forum Activity */}
      {user.recentQuestions.length > 0 && (
        <section>
          <h2 className="text-2xl font-semibold text-white mb-6">Recent Forum Questions</h2>
          <div className="divide-y divide-white/5 rounded-3xl border border-white/10 bg-white/5">
            {user.recentQuestions.map((q) => (
              <Link
                key={q.id}
                href={`/forum/questions/${q.id}`}
                className="flex flex-col gap-2 p-6 transition hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex-1">
                  <h3 className="text-base font-medium text-white">{q.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">
                    Posted on {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(q.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <span>{q.viewCount} views</span>
                  <span className="rounded-full bg-cyan-400/10 px-3 py-1 font-medium text-cyan-400">
                    {q.answerCount} {q.answerCount === 1 ? "answer" : "answers"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
