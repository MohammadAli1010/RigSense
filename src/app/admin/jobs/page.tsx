import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { retryJobAction, deleteJobAction } from "@/actions/admin-jobs";

export default async function AdminJobsPage() {
  await requireRole(["ADMIN"]);

  const jobs = await prisma.backgroundJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Background Jobs Dashboard</h1>
        <p className="text-slate-500 mt-2">Operational view for provider health, price scraping, and ingestion runs.</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-semibold text-slate-700">Type</th>
              <th className="p-4 font-semibold text-slate-700">Status</th>
              <th className="p-4 font-semibold text-slate-700">Attempts</th>
              <th className="p-4 font-semibold text-slate-700">Created At</th>
              <th className="p-4 font-semibold text-slate-700">Last Error</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">No background jobs found.</td>
              </tr>
            )}
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{job.type}</td>
                <td className="p-4">
                  <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                    job.status === "SUCCEEDED" ? "bg-green-100 text-green-800" :
                    job.status === "FAILED" ? "bg-red-100 text-red-800" :
                    job.status === "RUNNING" ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="p-4 text-slate-600">{job.attempts} / {job.maxAttempts}</td>
                <td className="p-4 text-slate-600">{new Date(job.createdAt).toLocaleString()}</td>
                <td className="p-4 text-slate-600 max-w-xs truncate text-xs" title={job.lastError || ""}>
                  {job.lastError || "-"}
                </td>
                <td className="p-4 text-right flex justify-end gap-3">
                  {job.status === "FAILED" && (
                    <form action={retryJobAction}>
                      <input type="hidden" name="id" value={job.id} />
                      <button type="submit" className="text-blue-600 hover:text-blue-800 font-medium">Retry</button>
                    </form>
                  )}
                  <form action={deleteJobAction} onSubmit={(e) => { if (!confirm('Delete this job?')) e.preventDefault(); }}>
                    <input type="hidden" name="id" value={job.id} />
                    <button type="submit" className="text-slate-400 hover:text-red-600 font-medium">Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
