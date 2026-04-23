import { savePartAction } from "@/actions/admin-parts";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import { PartCategory } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditPartPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["MODERATOR", "ADMIN"]);
  
  const { id } = await params;
  const part = await prisma.part.findUnique({
    where: { id },
  });

  if (!part) {
    notFound();
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/parts" className="text-slate-500 hover:text-slate-800">&larr; Back to Catalog</Link>
        <h1 className="text-3xl font-bold text-slate-900">Edit Part: {part.name}</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow border border-slate-200">
        <form action={savePartAction} className="space-y-6">
          <input type="hidden" name="id" value={part.id} />
          
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="brand" className="block text-sm font-medium text-slate-700 mb-1">Brand</label>
              <input type="text" id="brand" name="brand" required defaultValue={part.brand} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
            </div>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1">Product Name</label>
              <input type="text" id="name" name="name" required defaultValue={part.name} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select id="category" name="category" required defaultValue={part.category} className="w-full px-3 py-2 border border-slate-300 rounded bg-white focus:ring-blue-500 focus:border-blue-500">
                {Object.values(PartCategory).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priceCents" className="block text-sm font-medium text-slate-700 mb-1">Price (Cents)</label>
              <input type="number" id="priceCents" name="priceCents" required min="0" defaultValue={part.priceCents} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700 mb-1">Description (Optional)</label>
            <textarea id="description" name="description" rows={4} defaultValue={part.description || ""} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
            <Link href="/admin/parts" className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">Cancel</Link>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
