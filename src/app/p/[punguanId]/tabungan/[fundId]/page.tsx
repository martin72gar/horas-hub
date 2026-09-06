import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyTenantAccess } from "@/lib/dal";
import { db } from "@/db";
import { tabunganFunds, tabunganTransactions, households } from "@/db/schema";
import { and, asc, eq, sql } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, PiggyBank } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import SetoranDialog, { NAMA_BULAN } from "./SetoranDialog";

const BULAN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default async function FundDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ punguanId: string; fundId: string }>;
  searchParams: Promise<{ tahun?: string }>;
}) {
  const { punguanId, fundId } = await params;
  const { tahun: tahunParam } = await searchParams;
  const role = await verifyTenantAccess(punguanId);
  const isBendaharaOrAdmin = role === 'BENDAHARA' || role === 'SUPERADMIN';

  const [fund] = await db.select().from(tabunganFunds)
    .where(and(eq(tabunganFunds.id, fundId), eq(tabunganFunds.punguanId, punguanId)))
    .limit(1);
  if (!fund) notFound();

  const tahunSekarang = new Date().getFullYear();
  const tahun = tahunParam ? parseInt(tahunParam, 10) : tahunSekarang;

  // Tahun yang punya riwayat setoran, untuk pemilih tahun.
  const tahunRows = await db.selectDistinct({ year: tabunganTransactions.periodYear })
    .from(tabunganTransactions)
    .where(eq(tabunganTransactions.fundId, fundId));
  const daftarTahun = [...new Set(
    [tahunSekarang, tahun, fund.targetYear, ...tahunRows.map((r) => r.year)].filter((y): y is number => !!y)
  )].sort((a, b) => b - a);

  // Matriks rekap: hanya SETORAN, dipivot di memori jadi baris KK x kolom bulan.
  const setoranRows = await db.select({
    householdId: tabunganTransactions.householdId,
    periodMonth: tabunganTransactions.periodMonth,
    total: sql<number>`sum(${tabunganTransactions.amount})::int`,
  })
  .from(tabunganTransactions)
  .where(and(
    eq(tabunganTransactions.fundId, fundId),
    eq(tabunganTransactions.type, "SETORAN"),
    eq(tabunganTransactions.periodYear, tahun),
  ))
  .groupBy(tabunganTransactions.householdId, tabunganTransactions.periodMonth);

  const semuaKK = await db.select({
    id: households.id,
    headName: households.headName,
    status: households.status,
  })
  .from(households)
  .where(eq(households.punguanId, punguanId))
  .orderBy(asc(households.headName));

  // KK aktif selalu tampil; KK non-aktif hanya kalau punya riwayat di tahun ini.
  const punyaRiwayat = new Set(setoranRows.map((r) => r.householdId));
  const barisKK = [
    ...semuaKK.filter((h) => h.status === "AKTIF"),
    ...semuaKK.filter((h) => h.status !== "AKTIF" && punyaRiwayat.has(h.id)),
  ];

  const sel = (householdId: string, bulan: number) =>
    setoranRows.find((r) => r.householdId === householdId && r.periodMonth === bulan)?.total ?? null;
  const totalBaris = (householdId: string) =>
    setoranRows.filter((r) => r.householdId === householdId).reduce((a, r) => a + r.total, 0);
  const totalBulan = (bulan: number) =>
    setoranRows.filter((r) => r.periodMonth === bulan).reduce((a, r) => a + r.total, 0);
  const totalTahun = setoranRows.reduce((a, r) => a + r.total, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <div>
          <Link href={`/p/${punguanId}/tabungan`} className="text-sm text-stone-500 hover:text-emerald-700 flex items-center mb-2">
            <ArrowLeft className="h-4 w-4 mr-1.5" /> Kembali ke daftar dana
          </Link>
          <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif flex items-center">
            <PiggyBank className="w-5 h-5 mr-2 text-emerald-600" />
            {fund.name}
            <Badge variant={fund.status === 'AKTIF' ? 'default' : 'secondary'} className={`ml-3 ${fund.status === 'AKTIF' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-none' : ''}`}>
              {fund.status}
            </Badge>
          </h2>
          <p className="text-stone-500 mt-1">
            {[fund.targetEvent, fund.targetYear].filter(Boolean).join(" ") || "Tanpa acara sasaran"}
            {fund.bankName && ` · ${fund.bankName} ${fund.bankAccount ?? ""}`}
          </p>
        </div>
        {isBendaharaOrAdmin && (
          <SetoranDialog punguanId={punguanId} fundId={fundId} households={semuaKK} defaultYear={tahun} />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-5 border-b border-stone-200 bg-stone-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-semibold text-stone-800">Rekap Setoran {tahun}</h3>
          <div className="flex flex-wrap gap-1.5">
            {daftarTahun.map((y) => (
              <Link
                key={y}
                href={`/p/${punguanId}/tabungan/${fundId}?tahun=${y}`}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                  y === tahun
                    ? "bg-emerald-700 text-white border-emerald-700"
                    : "bg-white text-stone-600 border-stone-300 hover:bg-stone-50"
                }`}
              >
                {y}
              </Link>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-stone-600 bg-stone-100/80 border-b border-stone-200 uppercase font-semibold">
              <tr>
                <th className="px-4 py-3 sticky left-0 bg-stone-100/80 min-w-[180px]">Nama KK</th>
                {BULAN.map((b) => (
                  <th key={b} className="px-3 py-3 text-right whitespace-nowrap">{NAMA_BULAN[b - 1].slice(0, 3)}</th>
                ))}
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {barisKK.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-6 py-8 text-center text-stone-500">
                    Belum ada keluarga terdaftar.
                  </td>
                </tr>
              ) : (
                barisKK.map((h) => (
                  <tr key={h.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-stone-900 sticky left-0 bg-white">
                      {h.headName}
                      {h.status !== "AKTIF" && <span className="ml-2 text-xs text-stone-400">({h.status})</span>}
                    </td>
                    {BULAN.map((b) => {
                      const nilai = sel(h.id, b);
                      return (
                        <td key={b} className="px-3 py-3 text-right text-stone-600 whitespace-nowrap">
                          {nilai === null ? <span className="text-stone-300">–</span> : formatRupiah(nilai)}
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-right font-semibold text-stone-900 whitespace-nowrap">
                      {formatRupiah(totalBaris(h.id))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-stone-50 border-t-2 border-stone-300 font-semibold text-stone-800">
              <tr>
                <td className="px-4 py-3 sticky left-0 bg-stone-50">Total per Bulan</td>
                {BULAN.map((b) => (
                  <td key={b} className="px-3 py-3 text-right whitespace-nowrap">
                    {totalBulan(b) === 0 ? <span className="text-stone-300">–</span> : formatRupiah(totalBulan(b))}
                  </td>
                ))}
                <td className="px-4 py-3 text-right whitespace-nowrap">{formatRupiah(totalTahun)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
