import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyTenantAccess } from "@/lib/dal";
import { db } from "@/db";
import { tabunganFunds, meetings, households } from "@/db/schema";
import { and, asc, desc, eq } from "drizzle-orm";
import { ArrowLeft, Home } from "lucide-react";
import { NAMA_BULAN } from "@/lib/tabungan";
import PertemuanForm from "./PertemuanForm";

export default async function PertemuanPage({
  params,
}: {
  params: Promise<{ punguanId: string; fundId: string }>;
}) {
  const { punguanId, fundId } = await params;
  const role = await verifyTenantAccess(punguanId);
  const isBendaharaOrAdmin = role === 'BENDAHARA' || role === 'SUPERADMIN';

  const [fund] = await db.select().from(tabunganFunds)
    .where(and(eq(tabunganFunds.id, fundId), eq(tabunganFunds.punguanId, punguanId)))
    .limit(1);
  if (!fund) notFound();

  const daftar = await db.select({
    id: meetings.id,
    title: meetings.title,
    meetingDate: meetings.meetingDate,
    periodMonth: meetings.periodMonth,
    periodYear: meetings.periodYear,
    notes: meetings.notes,
    hostName: households.headName,
  })
  .from(meetings)
  .leftJoin(households, eq(meetings.hostHouseholdId, households.id))
  .where(eq(meetings.fundId, fundId))
  .orderBy(desc(meetings.periodYear), desc(meetings.periodMonth));

  const semuaKK = await db.select({
    id: households.id,
    headName: households.headName,
    status: households.status,
  })
  .from(households)
  .where(eq(households.punguanId, punguanId))
  .orderBy(asc(households.headName));

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/p/${punguanId}/tabungan/${fundId}`} className="text-sm text-stone-500 hover:text-emerald-700 flex items-center mb-2">
          <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali ke {fund.name}
        </Link>
        <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">Pertemuan &amp; Tuan Rumah</h2>
        <p className="text-stone-500 mt-1">Tuan rumah bergilir setiap bulan. Satu pertemuan per bulan untuk dana ini.</p>
      </div>

      {isBendaharaOrAdmin && (
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
          <h3 className="text-lg font-semibold text-stone-800 mb-4">Tentukan Tuan Rumah</h3>
          <PertemuanForm
            punguanId={punguanId}
            fundId={fundId}
            households={semuaKK}
            defaultYear={new Date().getFullYear()}
          />
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-stone-600 bg-stone-100/80 border-b border-stone-200 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Periode</th>
                <th className="px-6 py-4">Tuan Rumah</th>
                <th className="px-6 py-4">Judul</th>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Catatan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {daftar.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-stone-500">
                    Belum ada pertemuan yang dicatat.
                  </td>
                </tr>
              ) : (
                daftar.map((m) => (
                  <tr key={m.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-stone-900 whitespace-nowrap">
                      {m.periodMonth ? NAMA_BULAN[m.periodMonth - 1] : '–'} {m.periodYear ?? ''}
                    </td>
                    <td className="px-6 py-4 text-stone-700 flex items-center">
                      <Home className="w-4 h-4 mr-2 text-emerald-600" />
                      {m.hostName ?? <span className="text-stone-400 italic">Belum ditentukan</span>}
                    </td>
                    <td className="px-6 py-4 text-stone-600">{m.title ?? '–'}</td>
                    <td className="px-6 py-4 text-stone-600 whitespace-nowrap">
                      {m.meetingDate ? new Date(m.meetingDate).toLocaleDateString('id-ID') : '–'}
                    </td>
                    <td className="px-6 py-4 text-stone-600">{m.notes ?? '–'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
