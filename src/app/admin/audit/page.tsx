import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function AdminAuditPage() {
  await requireRole(["ADMIN"]);

  const auditLogs = await prisma.auditLog.findMany({
    include: {
      actor: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Audit Log</h1>
        <p className="mt-2 text-sm text-slate-500">High-impact admin and moderation actions are recorded here for review and rollback workflows.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-4 font-semibold text-slate-700">When</th>
              <th className="p-4 font-semibold text-slate-700">Actor</th>
              <th className="p-4 font-semibold text-slate-700">Action</th>
              <th className="p-4 font-semibold text-slate-700">Entity</th>
              <th className="p-4 font-semibold text-slate-700">Summary</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">No audit entries recorded yet.</td>
              </tr>
            ) : null}
            {auditLogs.map((entry) => (
              <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 text-slate-600">{entry.createdAt.toLocaleString()}</td>
                <td className="p-4 text-slate-600">{entry.actor?.name ?? entry.actor?.email ?? "System"}</td>
                <td className="p-4 font-mono text-xs text-slate-700">{entry.action}</td>
                <td className="p-4 text-slate-600">{entry.entityType}:{entry.entityId}</td>
                <td className="p-4 text-slate-700">{entry.summary ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
