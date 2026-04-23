import Link from "next/link";

import { deleteFeaturedModuleAction } from "@/actions/admin-featured-modules";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function AdminFeaturedModulesPage() {
  await requireRole(["EDITOR", "ADMIN"]);

  const modules = await prisma.featuredModule.findMany({
    orderBy: [{ slot: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Featured Modules</h1>
          <p className="mt-2 text-sm text-slate-500">Curate homepage and discovery surfaces without code edits.</p>
        </div>
        <Link href="/admin/featured-modules/new" className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Add Module
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-4 font-semibold text-slate-700">Slot</th>
              <th className="p-4 font-semibold text-slate-700">Title</th>
              <th className="p-4 font-semibold text-slate-700">Type</th>
              <th className="p-4 font-semibold text-slate-700">Order</th>
              <th className="p-4 font-semibold text-slate-700">Status</th>
              <th className="p-4 text-right font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {modules.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">No featured modules configured.</td>
              </tr>
            ) : null}
            {modules.map((module) => (
              <tr key={module.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-mono text-sm text-slate-600">{module.slot}</td>
                <td className="p-4 font-medium text-slate-900">{module.title}</td>
                <td className="p-4 text-slate-600">{module.type}</td>
                <td className="p-4 text-slate-600">{module.sortOrder}</td>
                <td className="p-4 text-slate-600">{module.isActive ? "Active" : "Inactive"}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-4">
                    <Link href={`/admin/featured-modules/${module.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      Edit
                    </Link>
                    <form action={deleteFeaturedModuleAction}>
                      <input type="hidden" name="id" value={module.id} />
                      <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">Delete</button>
                    </form>
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
