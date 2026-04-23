import Link from "next/link";
import { FeaturedModuleType } from "@prisma/client";
import { notFound } from "next/navigation";

import { saveFeaturedModuleAction } from "@/actions/admin-featured-modules";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function EditFeaturedModulePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["EDITOR", "ADMIN"]);

  const { id } = await params;
  const featuredModule = await prisma.featuredModule.findUnique({
    where: { id },
  });

  if (!featuredModule) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/featured-modules" className="text-slate-500 hover:text-slate-800">&larr; Back to featured modules</Link>
        <h1 className="text-3xl font-bold text-slate-900">Edit Featured Module</h1>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow">
        <form action={saveFeaturedModuleAction} className="space-y-6">
          <input type="hidden" name="id" value={featuredModule.id} />

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="slot" className="mb-1 block text-sm font-medium text-slate-700">Slot</label>
              <input id="slot" name="slot" required defaultValue={featuredModule.slot} className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="type" className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select id="type" name="type" required defaultValue={featuredModule.type} className="w-full rounded border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:ring-blue-500">
                {Object.values(FeaturedModuleType).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="title" className="mb-1 block text-sm font-medium text-slate-700">Title</label>
            <input id="title" name="title" required defaultValue={featuredModule.title} className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea id="description" name="description" rows={3} defaultValue={featuredModule.description || ""} className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div>
            <label htmlFor="href" className="mb-1 block text-sm font-medium text-slate-700">Href</label>
            <input id="href" name="href" required defaultValue={featuredModule.href} className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="sortOrder" className="mb-1 block text-sm font-medium text-slate-700">Sort Order</label>
              <input id="sortOrder" name="sortOrder" type="number" defaultValue={featuredModule.sortOrder} className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div className="flex items-center gap-2 pt-7">
              <input id="isActive" name="isActive" type="checkbox" defaultChecked={featuredModule.isActive} className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <label htmlFor="isActive" className="text-sm font-medium text-slate-700">Active</label>
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-slate-100 pt-4">
            <Link href="/admin/featured-modules" className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900">Cancel</Link>
            <button type="submit" className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
