import { requireRole } from "@/lib/session";
import Link from "next/link";
import { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireRole(["MODERATOR", "ADMIN"]);

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block">
        <h2 className="text-xl font-bold mb-8">Admin Panel</h2>
        <nav className="space-y-4">
          <Link href="/admin/moderation" className="block text-slate-300 hover:text-white">
            Moderation Queue
          </Link>
          <Link href="/admin/parts" className="block text-slate-300 hover:text-white">
            Catalog Management
          </Link>
          <Link href="/admin/guides" className="block text-slate-300 hover:text-white">
            Guides (Editorial)
          </Link>
          <Link href="/admin/benchmarks" className="block text-slate-300 hover:text-white">
            Benchmarks
          </Link>
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-slate-50">
        {children}
      </main>
    </div>
  );
}
