import { Role } from "@prisma/client";

import { updateUserRoleAction } from "@/actions/admin-users";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function AdminUsersPage() {
  const admin = await requireRole(["ADMIN"]);

  const users = await prisma.user.findMany({
    orderBy: [{ role: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">User Roles</h1>
        <p className="mt-2 text-sm text-slate-500">Assign editor and moderator access without touching the database directly.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-4 font-semibold text-slate-700">User</th>
              <th className="p-4 font-semibold text-slate-700">Email</th>
              <th className="p-4 font-semibold text-slate-700">Joined</th>
              <th className="p-4 font-semibold text-slate-700">Role</th>
              <th className="p-4 text-right font-semibold text-slate-700">Apply</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-900">{user.name}</td>
                <td className="p-4 text-slate-600">{user.email}</td>
                <td className="p-4 text-slate-600">{user.createdAt.toLocaleDateString()}</td>
                <td className="p-4">
                  <form action={updateUserRoleAction} className="flex items-center gap-3">
                    <input type="hidden" name="userId" value={user.id} />
                    <select name="role" defaultValue={user.role} disabled={user.id === admin.id} className="rounded border border-slate-300 bg-white px-3 py-2 text-sm focus:border-blue-500 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-slate-100">
                      {Object.values(Role).map((role) => (
                        <option key={role} value={role}>{role}</option>
                      ))}
                    </select>
                    <button type="submit" disabled={user.id === admin.id} className="rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300">
                      Save
                    </button>
                  </form>
                </td>
                <td className="p-4 text-right text-sm text-slate-400">
                  {user.id === admin.id ? "Current admin" : ""}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
