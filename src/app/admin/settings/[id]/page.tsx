import Link from "next/link";
import { notFound } from "next/navigation";

import { saveOperationalSettingAction } from "@/actions/admin-settings";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function EditSettingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireRole(["ADMIN"]);

  const { id } = await params;
  const setting = await prisma.operationalSetting.findUnique({
    where: { id },
  });

  if (!setting) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/settings" className="text-slate-500 hover:text-slate-800">&larr; Back to settings</Link>
        <h1 className="text-3xl font-bold text-slate-900">Edit Setting</h1>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow">
        <form action={saveOperationalSettingAction} className="space-y-6">
          <input type="hidden" name="id" value={setting.id} />
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="key" className="mb-1 block text-sm font-medium text-slate-700">Key</label>
              <input id="key" name="key" required defaultValue={setting.key} className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="label" className="mb-1 block text-sm font-medium text-slate-700">Label</label>
              <input id="label" name="label" required defaultValue={setting.label} className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label htmlFor="value" className="mb-1 block text-sm font-medium text-slate-700">Value</label>
            <input id="value" name="value" required defaultValue={setting.value} className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea id="description" name="description" rows={3} defaultValue={setting.description || ""} className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
          </div>
          <div className="flex justify-end gap-4 border-t border-slate-100 pt-4">
            <Link href="/admin/settings" className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900">Cancel</Link>
            <button type="submit" className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
}
