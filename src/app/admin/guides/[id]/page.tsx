import { saveGuideAction } from "@/actions/admin-guides";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["EDITOR", "ADMIN"]);
  
  const { id } = await params;
  const guide = await prisma.guide.findUnique({
    where: { id },
  });

  if (!guide) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/guides" className="text-slate-500 hover:text-slate-800">&larr; Back to Guides</Link>
        <h1 className="text-3xl font-bold text-slate-900">Edit Guide: {guide.title}</h1>
        <Link href={`/admin/guides/${guide.id}/history`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
          View history
        </Link>
      </div>

      <div className="bg-white p-8 rounded-lg shadow border border-slate-200">
        <form action={saveGuideAction} className="space-y-6">
          <input type="hidden" name="id" value={guide.id} />

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input type="text" id="title" name="title" defaultValue={guide.title} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">Slug</label>
            <input type="text" id="slug" name="slug" defaultValue={guide.slug} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label htmlFor="coverImageUrl" className="block text-sm font-medium text-slate-700 mb-1">Cover Image URL (Optional)</label>
            <input type="url" id="coverImageUrl" name="coverImageUrl" defaultValue={guide.coverImageUrl || ""} className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" />
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-slate-700 mb-1">Excerpt</label>
            <textarea id="excerpt" name="excerpt" rows={3} defaultValue={guide.excerpt} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium text-slate-700 mb-1">Body (Markdown Supported)</label>
            <textarea id="body" name="body" rows={12} defaultValue={guide.body} required className="font-mono text-sm w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500"></textarea>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isPublished" name="isPublished" defaultChecked={guide.isPublished} className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" />
            <label htmlFor="isPublished" className="text-sm font-medium text-slate-700">Publish this guide</label>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
            <Link href="/admin/guides" className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">Cancel</Link>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
