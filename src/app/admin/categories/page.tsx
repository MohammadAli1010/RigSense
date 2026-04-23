import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import Link from "next/link";
import { deleteCategoryAction } from "@/actions/admin-categories";

export default async function AdminCategoriesPage() {
  await requireRole(["ADMIN"]);

  const categories = await prisma.forumCategory.findMany({
    include: {
      _count: {
        select: {
          questions: true,
        },
      },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Forum Taxonomy</h1>
        <Link href="/admin/categories/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
          Add Category
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-semibold text-slate-700">Name</th>
              <th className="p-4 font-semibold text-slate-700">Slug</th>
              <th className="p-4 font-semibold text-slate-700">Questions</th>
              <th className="p-4 font-semibold text-slate-700">Description</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">No categories found.</td>
              </tr>
            )}
            {categories.map((cat) => (
              <tr key={cat.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-4 font-medium text-slate-900">{cat.name}</td>
                <td className="p-4 text-slate-600 font-mono text-sm">{cat.slug}</td>
                <td className="p-4 text-slate-600">{cat._count.questions}</td>
                <td className="p-4 text-slate-600 max-w-sm truncate">{cat.description}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-4">
                    <Link href={`/admin/categories/${cat.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      Edit
                    </Link>
                    {cat._count.questions === 0 ? (
                      <form action={deleteCategoryAction}>
                        <input type="hidden" name="id" value={cat.id} />
                        <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">
                          Delete
                        </button>
                      </form>
                    ) : (
                      <span className="text-sm text-slate-400">Reassign questions first</span>
                    )}
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
