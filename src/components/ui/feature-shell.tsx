import Link from "next/link";

type Action = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type FeatureShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  highlights: string[];
  note?: string;
  actions?: Action[];
};

export function FeatureShell({
  eyebrow,
  title,
  description,
  highlights,
  note,
  actions = [],
}: FeatureShellProps) {
  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-16 lg:py-24">
      <div className="max-w-3xl space-y-5">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
          {eyebrow}
        </span>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
          <p className="text-lg leading-8 text-slate-300">{description}</p>
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {actions.map((action) => (
              <Link
                key={action.href}
                href={action.href}
                className={
                  action.variant === "secondary"
                    ? "rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
                    : "rounded-full bg-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                }
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {highlights.map((highlight) => (
          <div
            key={highlight}
            className="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm leading-7 text-slate-300"
          >
            {highlight}
          </div>
        ))}
      </div>

      {note ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 text-sm leading-7 text-slate-400">
          {note}
        </div>
      ) : null}
    </section>
  );
}
