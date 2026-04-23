import Link from "next/link";
import { OfferAvailability } from "@prisma/client";

import { saveOfferAction } from "@/actions/admin-offers";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function NewOfferPage() {
  await requireRole(["EDITOR", "ADMIN"]);

  const parts = await prisma.part.findMany({
    orderBy: [{ brand: "asc" }, { name: "asc" }],
    select: {
      id: true,
      brand: true,
      name: true,
    },
    take: 200,
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center gap-4">
        <Link href="/admin/offers" className="text-slate-500 hover:text-slate-800">
          &larr; Back to offers
        </Link>
        <h1 className="text-3xl font-bold text-slate-900">Add Offer</h1>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow">
        <form action={saveOfferAction} className="space-y-6">
          <div>
            <label htmlFor="partId" className="mb-1 block text-sm font-medium text-slate-700">Part</label>
            <select id="partId" name="partId" required className="w-full rounded border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:ring-blue-500">
              <option value="">Select a part</option>
              {parts.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.brand} {part.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label htmlFor="retailer" className="mb-1 block text-sm font-medium text-slate-700">Retailer</label>
              <input id="retailer" name="retailer" required className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="source" className="mb-1 block text-sm font-medium text-slate-700">Source</label>
              <input id="source" name="source" required className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label htmlFor="url" className="mb-1 block text-sm font-medium text-slate-700">Offer URL</label>
            <input id="url" name="url" type="url" required className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div>
              <label htmlFor="priceCents" className="mb-1 block text-sm font-medium text-slate-700">Price (cents)</label>
              <input id="priceCents" name="priceCents" type="number" min="0" required className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
            </div>
            <div>
              <label htmlFor="availability" className="mb-1 block text-sm font-medium text-slate-700">Availability</label>
              <select id="availability" name="availability" required className="w-full rounded border border-slate-300 bg-white px-3 py-2 focus:border-blue-500 focus:ring-blue-500">
                {Object.values(OfferAvailability).map((availability) => (
                  <option key={availability} value={availability}>
                    {availability}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="retrievedAt" className="mb-1 block text-sm font-medium text-slate-700">Retrieved At</label>
              <input id="retrievedAt" name="retrievedAt" type="datetime-local" className="w-full rounded border border-slate-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" />
            </div>
          </div>

          <div className="flex justify-end gap-4 border-t border-slate-100 pt-4">
            <Link href="/admin/offers" className="px-4 py-2 font-medium text-slate-600 hover:text-slate-900">
              Cancel
            </Link>
            <button type="submit" className="rounded bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700">
              Save Offer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
