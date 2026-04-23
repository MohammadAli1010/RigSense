import Link from "next/link";

import { deleteOperationalSettingAction } from "@/actions/admin-settings";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function AdminSettingsPage() {
  await requireRole(["ADMIN"]);

  const settings = await prisma.operationalSetting.findMany({
    orderBy: { key: "asc" },
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Operational Settings</h1>
          <p className="mt-2 text-sm text-slate-500">Manage runtime-facing product configuration without editing code.</p>
        </div>
        <Link href="/admin/settings/new" className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">Add Setting</Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-4 font-semibold text-slate-700">Key</th>
              <th className="p-4 font-semibold text-slate-700">Label</th>
              <th className="p-4 font-semibold text-slate-700">Value</th>
              <th className="p-4 font-semibold text-slate-700">Description</th>
              <th className="p-4 text-right font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {settings.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-4 text-center text-slate-500">No settings found.</td>
              </tr>
            ) : null}
            {settings.map((setting) => (
              <tr key={setting.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-mono text-sm text-slate-700">{setting.key}</td>
                <td className="p-4 font-medium text-slate-900">{setting.label}</td>
                <td className="p-4 text-slate-600">{setting.value}</td>
                <td className="p-4 text-slate-600">{setting.description}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-4">
                    <Link href={`/admin/settings/${setting.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">Edit</Link>
                    <form action={deleteOperationalSettingAction}>
                      <input type="hidden" name="id" value={setting.id} />
                      <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">Delete</button>
                    </form>
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
