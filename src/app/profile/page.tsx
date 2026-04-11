import { requireUser } from "@/lib/session";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <section className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-16 lg:py-24">
      <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
          Profile
        </span>
        <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white">
          {user.name}
        </h1>
        <p className="mt-3 text-lg text-slate-300">{user.email}</p>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-slate-400">
          This page is already running through the protected auth flow. In the next milestone,
          it will expand into saved builds, public build publishing controls, and account settings.
        </p>
      </div>
    </section>
  );
}
