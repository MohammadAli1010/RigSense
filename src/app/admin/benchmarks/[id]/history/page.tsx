import Link from "next/link";
import { notFound } from "next/navigation";

import { rollbackBenchmarkRevisionAction } from "@/actions/admin-benchmarks";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function BenchmarkHistoryPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["EDITOR", "ADMIN"]);

  const { id } = await params;
  const [benchmark, revisions] = await Promise.all([
    prisma.benchmark.findUnique({
      where: { id },
    }),
    prisma.auditLog.findMany({
      where: {
        entityType: "benchmark",
        entityId: id,
      },
      include: {
        actor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!benchmark) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center gap-4">
        <Link href={`/admin/benchmarks/${benchmark.id}`} className="text-slate-500 hover:text-slate-800">
          &larr; Back to benchmark
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Benchmark History</h1>
      </div>

      <div className="space-y-4">
        {revisions.length === 0 ? (
          <div className="rounded-lg border border-slate-200 bg-white p-6 text-slate-500 shadow-sm">
            No revisions recorded yet.
          </div>
        ) : null}
        {revisions.map((revision) => {
          const details = revision.details as { previous?: unknown } | null;
          const canRollback = Boolean(details?.previous);

          return (
            <div key={revision.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-xs text-slate-500">{revision.action}</p>
                  <h2 className="mt-2 text-lg font-semibold text-slate-900">{revision.summary ?? "Benchmark revision"}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {revision.createdAt.toLocaleString()} by {revision.actor?.name ?? revision.actor?.email ?? "System"}
                  </p>
                </div>
                {canRollback ? (
                  <form action={rollbackBenchmarkRevisionAction}>
                    <input type="hidden" name="benchmarkId" value={benchmark.id} />
                    <input type="hidden" name="auditLogId" value={revision.id} />
                    <button type="submit" className="rounded border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 hover:text-slate-900">
                      Roll back to this version
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
