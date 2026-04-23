import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import Link from "next/link";
import { deleteBenchmarkAction } from "@/actions/admin-benchmarks";

export default async function AdminBenchmarksPage() {
  const user = await requireRole(["EDITOR", "ADMIN"]);
  const isAdmin = user.role === "ADMIN";

  const benchmarks = await prisma.benchmark.findMany({
    orderBy: { createdAt: "desc" },
    include: { part: true, build: true },
    take: 50,
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Benchmarks Management</h1>
        <Link href="/admin/benchmarks/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
          Add New Benchmark
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-semibold text-slate-700">Kind</th>
              <th className="p-4 font-semibold text-slate-700">Target</th>
              <th className="p-4 font-semibold text-slate-700">Workload</th>
              <th className="p-4 font-semibold text-slate-700">Score / FPS</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {benchmarks.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">No benchmarks found.</td>
              </tr>
            )}
            {benchmarks.map((bench) => (
              <tr key={bench.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-600">
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                    {bench.kind}
                  </span>
                </td>
                <td className="p-4 font-medium text-slate-900">
                  {bench.part ? bench.part.name : bench.build ? bench.build.title : bench.title}
                </td>
                <td className="p-4 text-slate-600">{bench.workload}</td>
                <td className="p-4 text-slate-800">
                  {bench.avgFps ? `${bench.avgFps} FPS` : bench.score ? bench.score : "-"}
                </td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-4">
                    <Link href={`/admin/benchmarks/${bench.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      Edit
                    </Link>
                    <Link href={`/admin/benchmarks/${bench.id}/history`} className="text-sm font-medium text-slate-600 hover:text-slate-900">
                      History
                    </Link>
                    {isAdmin && (
                      <form action={deleteBenchmarkAction}>
                        <input type="hidden" name="id" value={bench.id} />
                        <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">
                          Delete
                        </button>
                      </form>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
