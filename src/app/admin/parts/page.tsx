import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";
import Link from "next/link";

export default async function AdminPartsPage() {
  await requireRole(["MODERATOR", "ADMIN"]);

  const parts = await prisma.part.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Catalog Management</h1>
        <Link href="/admin/parts/new" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium">
          Add New Part
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="p-4 font-semibold text-slate-700">Brand</th>
              <th className="p-4 font-semibold text-slate-700">Name</th>
              <th className="p-4 font-semibold text-slate-700">Category</th>
              <th className="p-4 font-semibold text-slate-700">Price</th>
              <th className="p-4 font-semibold text-slate-700 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((part) => (
              <tr key={part.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                <td className="p-4 text-slate-800">{part.brand}</td>
                <td className="p-4 font-medium text-slate-900">{part.name}</td>
                <td className="p-4 text-slate-600">
                  <span className="inline-block px-2 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-full">
                    {part.category}
                  </span>
                </td>
                <td className="p-4 text-slate-800">${(part.priceCents / 100).toFixed(2)}</td>
                <td className="p-4 text-right">
                  <Link href={`/admin/parts/${part.id}`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                    Edit &rarr;
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
