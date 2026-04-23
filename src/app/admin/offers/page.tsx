import Link from "next/link";

import { deleteOfferAction } from "@/actions/admin-offers";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/session";

export default async function AdminOffersPage() {
  await requireRole(["EDITOR", "ADMIN"]);

  const offers = await prisma.offer.findMany({
    include: {
      part: true,
    },
    orderBy: [{ retrievedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
  });

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Offers</h1>
          <p className="mt-2 text-sm text-slate-500">
            Manual price corrections, provider conflicts, and fallback retailer entries.
          </p>
        </div>
        <Link href="/admin/offers/new" className="rounded bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">
          Add Offer
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="p-4 font-semibold text-slate-700">Part</th>
              <th className="p-4 font-semibold text-slate-700">Retailer</th>
              <th className="p-4 font-semibold text-slate-700">Availability</th>
              <th className="p-4 font-semibold text-slate-700">Price</th>
              <th className="p-4 font-semibold text-slate-700">Retrieved</th>
              <th className="p-4 text-right font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {offers.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-4 text-center text-slate-500">
                  No offers found.
                </td>
              </tr>
            ) : null}
            {offers.map((offer) => (
              <tr key={offer.id} className="border-b border-slate-100 hover:bg-slate-50">
                <td className="p-4 font-medium text-slate-900">{offer.part.brand} {offer.part.name}</td>
                <td className="p-4 text-slate-700">{offer.retailer}</td>
                <td className="p-4 text-slate-600">{offer.availability}</td>
                <td className="p-4 text-slate-700">${(offer.priceCents / 100).toFixed(2)}</td>
                <td className="p-4 text-slate-600">{offer.retrievedAt.toLocaleString()}</td>
                <td className="p-4 text-right">
                  <div className="flex justify-end gap-4">
                    <Link href={`/admin/offers/${offer.id}`} className="text-sm font-medium text-blue-600 hover:text-blue-800">
                      Edit
                    </Link>
                    <form action={deleteOfferAction}>
                      <input type="hidden" name="id" value={offer.id} />
                      <button type="submit" className="text-sm font-medium text-red-600 hover:text-red-800">
                        Delete
                      </button>
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
