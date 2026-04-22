import Link from "next/link";
import { getComparePartsData } from "@/lib/public-content";
import { formatPrice } from "@/lib/format";
import { compareBenchmarks } from "@/lib/compare";

type ComparePageProps = {
  searchParams: Promise<{
    a?: string;
    b?: string;
  }>;
};

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const { a, b } = await searchParams;

  if (!a || !b) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16 lg:py-24 text-center">
        <h1 className="text-3xl font-semibold text-white">Compare Parts</h1>
        <p className="text-slate-400">Please provide two parts to compare using the `a` and `b` URL parameters.</p>
        <Link href="/parts" className="text-cyan-400 hover:text-cyan-300">Browse parts</Link>
      </div>
    );
  }

  const partsData = await getComparePartsData([a, b]);

  if (partsData.length !== 2) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-6 py-16 lg:py-24 text-center">
        <h1 className="text-3xl font-semibold text-white">Parts not found</h1>
        <p className="text-slate-400">One or both of the parts could not be found.</p>
        <Link href="/parts" className="text-cyan-400 hover:text-cyan-300">Browse parts</Link>
      </div>
    );
  }

  const partA = partsData.find((p) => p.part.slug === a)!;
  const partB = partsData.find((p) => p.part.slug === b)!;

  // Align benchmarks by workload for easy comparison
  const commonWorkloads = Array.from(
    new Set([
      ...partA.benchmarks.map((b) => b.workload),
      ...partB.benchmarks.map((b) => b.workload),
    ])
  );

  const specKeys = Array.from(
    new Set([
      ...Object.keys(partA.part.specs),
      ...Object.keys(partB.part.specs),
    ])
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 lg:py-24">
      <div className="mb-6">
        <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
          Compare
        </span>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Side-by-Side Comparison
        </h1>
      </div>

      {/* Header Row */}
      <div className="grid grid-cols-2 gap-8 border-b border-white/10 pb-8">
        {[partA, partB].map(({ part }) => (
          <div key={part.slug} className="flex flex-col">
            <p className="text-sm text-slate-400">{part.brand}</p>
            <h2 className="mt-1 text-2xl font-bold text-white">{part.name}</h2>
            <p className="mt-2 text-lg font-medium text-cyan-400">{formatPrice(part.priceCents)}</p>
            <Link
              href={`/parts/${part.categoryPath}/${part.slug}`}
              className="mt-4 self-start rounded-full bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20"
            >
              View details
            </Link>
          </div>
        ))}
      </div>

      {/* Benchmarks Section */}
      {commonWorkloads.length > 0 && (
        <section className="space-y-6">
          <h3 className="text-xl font-semibold text-white">Benchmarks</h3>
          <div className="grid gap-4">
            {commonWorkloads.map((workload) => {
              const bmA = partA.benchmarks.find((b) => b.workload === workload);
              const bmB = partB.benchmarks.find((b) => b.workload === workload);
              
              const comparison = bmA && bmB ? compareBenchmarks(bmA, bmB) : null;

              return (
                <div key={workload} className="rounded-2xl border border-white/10 bg-white/5 p-6">
                  <h4 className="text-lg font-medium text-slate-200">{workload}</h4>
                  
                  <div className="mt-4 grid grid-cols-2 gap-8">
                    {[bmA, bmB].map((bm, index) => {
                      if (!bm) return <div key={index} className="text-sm text-slate-500">No data</div>;
                      
                      const isWinner = comparison?.winnerId === bm.id;
                      const score = bm.avgFps ?? bm.score;
                      
                      return (
                        <div key={bm.id} className={`flex flex-col rounded-xl border p-4 ${isWinner ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/5 bg-black/20'}`}>
                          <span className="text-3xl font-bold text-white">
                            {score} <span className="text-lg font-normal text-slate-400">{bm.unit ?? (bm.avgFps ? 'FPS' : 'Score')}</span>
                          </span>
                          
                          {isWinner && comparison && comparison.differencePercent && (
                            <span className="mt-1 text-sm font-medium text-cyan-400">
                              +{comparison.differencePercent.toFixed(1)}% performance
                            </span>
                          )}
                          
                          <div className="mt-3 flex flex-col gap-1 text-xs text-slate-500">
                            {bm.resolution && <span>Res: {bm.resolution}</span>}
                            {bm.settings && <span>Settings: {bm.settings}</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Specs Section */}
      <section className="space-y-6">
        <h3 className="text-xl font-semibold text-white">Specifications</h3>
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <table className="w-full text-left text-sm text-slate-300">
            <tbody className="divide-y divide-white/5">
              {specKeys.map((key) => {
                const valA = partA.part.specs[key];
                const valB = partB.part.specs[key];
                const formattedA = Array.isArray(valA) ? valA.join(", ") : valA ?? "—";
                const formattedB = Array.isArray(valB) ? valB.join(", ") : valB ?? "—";
                
                return (
                  <tr key={key} className="hover:bg-white/5">
                    <td className="w-1/3 p-4 font-medium text-slate-400">{key}</td>
                    <td className={`w-1/3 p-4 ${formattedA !== formattedB ? 'text-white' : ''}`}>{formattedA}</td>
                    <td className={`w-1/3 p-4 ${formattedA !== formattedB ? 'text-white' : ''}`}>{formattedB}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
