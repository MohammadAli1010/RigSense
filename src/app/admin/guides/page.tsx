import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import Link from "next/link";
import { deleteGuideAction } from "@/actions/admin-guides";

export default async function AdminGuidesPage() {
  const user = await requireRole(["MODERATOR", "ADMIN"]);
  const isAdmin = user.role === "ADMIN";

  const guides = await prisma.guide.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Guides Management</h1>
        <Link href="/admin/guides/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
          Write New Guide
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-semibold text-slate-700">Title</th>
              <th className="p-4 font-semibold text-slate-700">Status</th>
              <th className="p-4 font-semibold text-slate-700">Created At</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {guides.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-slate-500">No guides found.</td>
              </tr>
            )}
            {guides.map((guide) => (
              <tr key={guide.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{guide.title}</td>
                <td className="p-4">
                  {guide.isPublished ? (
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded-full">
                      Published
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                      Draft
                    </span>
                  )}
                </td>
                <td className="p-4 text-slate-600">{new Date(guide.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-right flex justify-end gap-4">
                  {guide.isPublished && (
                    <Link href={`/guides/${guide.slug}`} target="_blank" className="text-slate-600 hover:text-slate-900 font-medium text-sm">
                      View
                    </Link>
                  )}
                  <Link href={`/admin/guides/${guide.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                    Edit
                  </Link>
                  {isAdmin && (
                    <form action={deleteGuideAction} onSubmit={(e) => { if (!confirm('Are you sure?')) e.preventDefault(); }}>
                      <input type="hidden" name="id" value={guide.id} />
                      <button type="submit" className="text-red-600 hover:text-red-800 font-medium text-sm">
                        Delete
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
