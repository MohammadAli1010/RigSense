import type { ReactNode } from "react";

type AuthCardProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/80 p-8 shadow-2xl shadow-cyan-950/20">
      <div className="space-y-3">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">
          RigSense
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-white">{title}</h1>
        <p className="text-sm leading-7 text-slate-400">{description}</p>
      </div>
      <div className="mt-8">{children}</div>
      {footer ? <div className="mt-6 text-sm text-slate-400">{footer}</div> : null}
    </div>
  );
}
