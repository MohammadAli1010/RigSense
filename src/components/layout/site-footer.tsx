export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-6 py-8 text-sm text-slate-400 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="font-medium text-slate-200">RigSense</p>
          <p>
            The first milestone focuses on auth, structure, and the foundation for
            the catalog, builder, benchmarks, and forum.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <span>Private builds by default</span>
          <span>Public guides and forum</span>
          <span>Seeded data first</span>
        </div>
      </div>
    </footer>
  );
}
