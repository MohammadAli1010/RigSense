import { saveBenchmarkAction } from "@/actions/admin-benchmarks";
import { requireRole } from "@/lib/session";
import { BenchmarkKind } from "@prisma/client";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";

export default async function EditBenchmarkPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["MODERATOR", "ADMIN"]);
  
  const { id } = await params;
  const bench = await prisma.benchmark.findUnique({
    where: { id },
  });

  if (!bench) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/benchmarks" className="text-slate-500 hover:text-slate-800">&larr; Back to Benchmarks</Link>
        <h1 className="text-3xl font-bold text-slate-900">Edit Benchmark</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow border border-slate-200">
        <form action={saveBenchmarkAction} className="space-y-6">
          <input type="hidden" name="id" value={bench.id} />
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="kind" className="block text-sm font-medium text-slate-700 mb-1">Kind</label>
              <select id="kind" name="kind" required defaultValue={bench.kind} className="w-full px-3 py-2 border border-slate-300 rounded bg-white focus:ring-blue-500 focus:border-blue-500">
                {Object.values(BenchmarkKind).map((kind) => (
                  <option key={kind} value={kind}>{kind}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Title</label>
              <input type="text" id="title" name="title" defaultValue={bench.title} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="workload" className="block text-sm font-medium text-slate-700 mb-1">Workload</label>
              <input type="text" id="workload" name="workload" defaultValue={bench.workload} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="source" className="block text-sm font-medium text-slate-700 mb-1">Source (Optional)</label>
              <input type="text" id="source" name="source" defaultValue={bench.source || ""} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="score" className="block text-sm font-medium text-slate-700 mb-1">Score (Optional)</label>
              <input type="number" id="score" name="score" defaultValue={bench.score ?? ""} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="avgFps" className="block text-sm font-medium text-slate-700 mb-1">Avg FPS (Optional)</label>
              <input type="number" id="avgFps" name="avgFps" defaultValue={bench.avgFps ?? ""} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="partId" className="block text-sm font-medium text-slate-700 mb-1">Part ID (Optional)</label>
              <input type="text" id="partId" name="partId" defaultValue={bench.partId || ""} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="buildId" className="block text-sm font-medium text-slate-700 mb-1">Build ID (Optional)</label>
              <input type="text" id="buildId" name="buildId" defaultValue={bench.buildId || ""} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
            <Link href="/admin/benchmarks" className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">Cancel</Link>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
