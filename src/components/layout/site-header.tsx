import Link from "next/link";

import { auth } from "@/auth";
import { logoutAction } from "@/actions/auth";

const navItems = [
  { href: "/parts", label: "Parts" },
  { href: "/builder", label: "Builder" },
  { href: "/guides", label: "Guides" },
  { href: "/benchmarks", label: "Benchmarks" },
  { href: "/forum", label: "Forum" },
  { href: "/trending", label: "Trending" },
];

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b border-white/10 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 text-white">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-cyan-400/40 bg-cyan-400/10 text-sm font-semibold text-cyan-200">
              RS
            </span>
            <div>
              <div className="text-lg font-semibold tracking-tight">RigSense</div>
              <p className="text-sm text-slate-400">
                Smart PC planning, builds, and community answers.
              </p>
            </div>
          </Link>
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end">
          <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/10 px-4 py-2 transition hover:border-cyan-400/50 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {session?.user ? (
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Link
                href="/builds"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 transition hover:border-cyan-400/50 hover:text-white"
              >
                My Builds
              </Link>
              <Link
                href="/profile"
                className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-200"
              >
                {session.user.name ?? "Profile"}
              </Link>
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-rose-400/50 hover:text-white"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <Link
                href="/login"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300 transition hover:border-cyan-400/50 hover:text-white"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
