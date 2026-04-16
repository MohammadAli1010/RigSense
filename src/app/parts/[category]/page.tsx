import Link from "next/link";
import { notFound } from "next/navigation";

import { getPartCategoryData } from "@/lib/public-content";
import { formatPrice, formatRelativeTime, isPriceStale } from "@/lib/format";

type PartCategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
  searchParams: Promise<{
    q?: string;
    sort?: string;
    page?: string;
  }>;
};

export default async function PartCategoryPage({ params, searchParams }: PartCategoryPageProps) {
  const { category } = await params;
  const sp = await searchParams;
  
  const search = sp.q || "";
  const sort = sp.sort || "";
  const page = parseInt(sp.page || "1", 10);
  
  const data = await getPartCategoryData(category, search, sort, page, 20);

  if (!data) {
    notFound();
  }

  const { categoryInfo, parts: categoryParts, total, totalPages } = data;

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

      <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <form className="flex items-center gap-4">
          <input 
            name="q" 
            defaultValue={search} 
            placeholder="Search parts..." 
            className="rounded border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white" 
          />
          <select 
            name="sort" 
            defaultValue={sort} 
            className="rounded border border-white/10 bg-slate-900 px-4 py-2 text-sm text-white"
          >
            <option value="">Name</option>
            <option value="price-asc">Price (Low to High)</option>
            <option value="price-desc">Price (High to Low)</option>
          </select>
          <button type="submit" className="rounded bg-cyan-600 px-4 py-2 text-sm text-white hover:bg-cyan-500">
            Apply
          </button>
        </form>
        <p className="text-sm text-slate-400">{total} items found</p>
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
            <div className="mt-5 flex items-center justify-between">
              <p className="text-lg font-semibold text-cyan-200">
                {formatPrice(part.priceCents)}
              </p>
              {part.lastUpdated && (
                <div className="flex flex-col items-end text-xs text-slate-400">
                  {part.priceSource && <span>{part.priceSource}</span>}
                  <span className={isPriceStale(new Date(part.lastUpdated)) ? "text-amber-400" : ""}>
                    {formatRelativeTime(new Date(part.lastUpdated))}
                  </span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </section>

      {totalPages && totalPages > 1 && (
        <section className="flex items-center justify-center gap-4 py-8">
          {page > 1 && (
            <Link 
              href={`?q=${search}&sort=${sort}&page=${page - 1}`}
              className="rounded border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white"
            >
              Previous
            </Link>
          )}
          <span className="text-sm text-slate-400">Page {page} of {totalPages}</span>
          {page < totalPages && (
             <Link 
             href={`?q=${search}&sort=${sort}&page=${page + 1}`}
             className="rounded border border-white/10 px-4 py-2 text-sm text-slate-300 hover:text-white"
           >
             Next
           </Link>
          )}
        </section>
      )}
    </div>
  );
}
