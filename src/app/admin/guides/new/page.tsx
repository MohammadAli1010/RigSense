import { saveGuideAction } from "@/actions/admin-guides";
import { requireRole } from "@/lib/session";
import Link from "next/link";

export default async function NewGuidePage() {
  await requireRole(["MODERATOR", "ADMIN"]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/guides" className="text-slate-500 hover:text-slate-800">&larr; Back to Guides</Link>
        <h1 className="text-3xl font-bold text-slate-900">Write New Guide</h1>
      </div>

      <div className="bg-white p-8 rounded-lg shadow border border-slate-200">
        <form action={saveGuideAction} className="space-y-6">
          
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input type="text" id="title" name="title" required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="E.g., The Ultimate PC Build Guide 2024" />
          </div>

          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">Slug (Optional)</label>
            <input type="text" id="slug" name="slug" className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="Will be auto-generated from title if left blank" />
          </div>

          <div>
            <label htmlFor="coverImageUrl" className="block text-sm font-medium text-slate-700 mb-1">Cover Image URL (Optional)</label>
            <input type="url" id="coverImageUrl" name="coverImageUrl" className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="https://example.com/image.jpg" />
          </div>

          <div>
            <label htmlFor="excerpt" className="block text-sm font-medium text-slate-700 mb-1">Excerpt</label>
            <textarea id="excerpt" name="excerpt" rows={3} required className="w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="A short summary of the guide..."></textarea>
          </div>

          <div>
            <label htmlFor="body" className="block text-sm font-medium text-slate-700 mb-1">Body (Markdown Supported)</label>
            <textarea id="body" name="body" rows={12} required className="font-mono text-sm w-full px-3 py-2 border border-slate-300 rounded focus:ring-blue-500 focus:border-blue-500" placeholder="## Introduction\n\nWelcome to the guide..."></textarea>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
            <Link href="/admin/guides" className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium">Cancel</Link>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">Publish Guide</button>
          </div>
        </form>
      </div>
    </div>
  );
}
