import { saveCategoryAction } from "@/actions/admin-categories";
import { requireRole } from "@/lib/session";
import Link from "next/link";

export default async function NewCategoryPage() {
  await requireRole(["ADMIN"]);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/categories" className="text-slate-500 hover:text-slate-800">&larr; Back to Taxonomy</Link>
        <h1 className="text-3xl font-bold text-slate-900">Add New Category</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow border border-slate-200">
        <form action={saveCategoryAction} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input type="text" id="name" name="name" required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="E.g., General Discussion" />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">Slug (Optional)</label>
            <input type="text" id="slug" name="slug" className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="Will be auto-generated from name if left blank" />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea id="description" name="description" rows={3} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="Describe the purpose of this category..."></textarea>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
            <Link href="/admin/categories" className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">Cancel</Link>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Save Category</button>
          </div>
        </form>
      </div>
    </div>
  );
}
