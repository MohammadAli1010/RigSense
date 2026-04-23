import { requireRole } from "@/lib/session";
import Link from "next/link";
import { ReactNode } from "react";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole(["EDITOR", "MODERATOR", "ADMIN"]);
  const canManageContent = user.role === "EDITOR" || user.role === "ADMIN";
  const canModerate = user.role === "MODERATOR" || user.role === "ADMIN";
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 bg-slate-900 text-white p-6 hidden md:block flex-shrink-0">
        <h2 className="text-xl font-bold mb-8">Admin Panel</h2>
        <nav className="space-y-4">
          {canModerate ? (
            <Link href="/admin/moderation" className="block text-slate-300 hover:text-white">
              Moderation Queue
            </Link>
          ) : null}
          {canManageContent ? (
            <>
              <Link href="/admin/parts" className="block text-slate-300 hover:text-white">
                Catalog Management
              </Link>
              <Link href="/admin/offers" className="block text-slate-300 hover:text-white">
                Offers
              </Link>
              <Link href="/admin/guides" className="block text-slate-300 hover:text-white">
                Guides (Editorial)
              </Link>
              <Link href="/admin/benchmarks" className="block text-slate-300 hover:text-white">
                Benchmarks
              </Link>
              <Link href="/admin/featured-modules" className="block text-slate-300 hover:text-white">
                Featured Modules
              </Link>
            </>
          ) : null}
          {isAdmin ? (
            <>
              <Link href="/admin/categories" className="block text-slate-300 hover:text-white">
                Forum Categories
              </Link>
              <Link href="/admin/settings" className="block text-slate-300 hover:text-white">
                Operational Settings
              </Link>
              <Link href="/admin/users" className="block text-slate-300 hover:text-white">
                User Roles
              </Link>
              <Link href="/admin/jobs" className="block text-slate-300 hover:text-white">
                Background Jobs
              </Link>
              <Link href="/admin/audit" className="block text-slate-300 hover:text-white">
                Audit Log
              </Link>
            </>
          ) : null}
        </nav>
      </aside>
      <main className="flex-1 p-8 bg-slate-50 overflow-auto">
        {children}
      </main>
    </div>
  );
}
