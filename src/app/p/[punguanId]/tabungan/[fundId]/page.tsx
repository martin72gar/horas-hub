import Link from "next/link";
import { notFound } from "next/navigation";
import { verifyTenantAccess } from "@/lib/dal";
import { db } from "@/db";
import { tabunganFunds, tabunganTransactions, households, users, meetings } from "@/db/schema";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CalendarDays, PiggyBank } from "lucide-react";
import { formatRupiah } from "@/lib/utils";
import { hitungRingkasan, NAMA_BULAN, type TabunganTxType } from "@/lib/tabungan";
import SetoranDialog from "./SetoranDialog";
import OutflowDialog from "./OutflowDialog";

const BULAN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default async function FundDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ punguanId: string; fundId: string }>;
  searchParams: Promise<{ tahun?: string; tipe?: string; bulan?: string; kk?: string }>;
}) {
  const { punguanId, fundId } = await params;
  const { tahun: tahunParam, tipe, bulan, kk } = await searchParams;
  const role = await verifyTenantAccess(punguanId);
  const isBendaharaOrAdmin = role === 'BENDAHARA' || role === 'SUPERADMIN';

  const [fund] = await db.select().from(tabunganFunds)
    .where(and(eq(tabunganFunds.id, fundId), eq(tabunganFunds.punguanId, punguanId)))
    .limit(1);
  if (!fund) notFound();

  const tahunSekarang = new Date().getFullYear();
  const tahun = tahunParam ? parseInt(tahunParam, 10) : tahunSekarang;

  // Ringkasan seluruh dana (lintas tahun), dilipat oleh hitungRingkasan().
  const totalPerTipe = await db.select({
    type: tabunganTransactions.type,
    total: sql<number>`sum(${tabunganTransactions.amount})::int`,
  })
  .from(tabunganTransactions)
  .where(eq(tabunganTransactions.fundId, fundId))
  .groupBy(tabunganTransactions.type);
  const ringkasan = hitungRingkasan(
    totalPerTipe.map((r) => ({ type: r.type as TabunganTxType, total: r.total }))
  );
  const persen = fund.targetAmount
    ? Math.min(100, Math.round((ringkasan.danaTerkumpul / fund.targetAmount) * 100))
    : null;

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

  // Tuan rumah per bulan, ditampilkan di header matriks.
  const tuanRumah = await db.select({
    periodMonth: meetings.periodMonth,
    hostName: households.headName,
  })
  .from(meetings)
  .leftJoin(households, eq(meetings.hostHouseholdId, households.id))
  .where(and(eq(meetings.fundId, fundId), eq(meetings.periodYear, tahun)));

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

  // Buku besar, dengan filter opsional lewat query string (tanpa JavaScript).
  const filterLedger: SQL[] = [eq(tabunganTransactions.fundId, fundId)];
  if (tipe) filterLedger.push(eq(tabunganTransactions.type, tipe as TabunganTxType));
  if (bulan) filterLedger.push(eq(tabunganTransactions.periodMonth, parseInt(bulan, 10)));
  if (kk) filterLedger.push(eq(tabunganTransactions.householdId, kk));

  const ledger = await db.select({
    id: tabunganTransactions.id,
    type: tabunganTransactions.type,
    amount: tabunganTransactions.amount,
    transactionDate: tabunganTransactions.transactionDate,
    periodMonth: tabunganTransactions.periodMonth,
    periodYear: tabunganTransactions.periodYear,
    description: tabunganTransactions.description,
    headName: households.headName,
    recorderName: users.name,
  })
  .from(tabunganTransactions)
  .leftJoin(households, eq(tabunganTransactions.householdId, households.id))
  .leftJoin(users, eq(tabunganTransactions.recordedBy, users.id))
  .where(and(...filterLedger))
  .orderBy(desc(tabunganTransactions.transactionDate), desc(tabunganTransactions.createdAt))
  .limit(200);

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
          <div className="flex flex-wrap gap-3">
            <OutflowDialog punguanId={punguanId} fundId={fundId} households={semuaKK} />
            <SetoranDialog punguanId={punguanId} fundId={fundId} households={semuaKK} defaultYear={tahun} />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Setoran", nilai: ringkasan.setoran, warna: "text-emerald-700" },
          { label: "Total Pengembalian", nilai: ringkasan.pengembalian, warna: "text-amber-700" },
          { label: "Total Pengeluaran", nilai: ringkasan.pengeluaran, warna: "text-red-700" },
          { label: "Dana Terkumpul", nilai: ringkasan.danaTerkumpul, warna: "text-stone-900" },
        ].map((k) => (
          <div key={k.label} className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
            <p className="text-sm text-stone-500">{k.label}</p>
            <p className={`text-xl font-bold mt-1 ${k.warna}`}>{formatRupiah(k.nilai)}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
          <p className="text-sm font-semibold text-stone-700 mb-3">Posisi Kas</p>
          <div className="flex justify-between items-end">
            <div>
              <p className="text-sm text-stone-500">Kas Tunai</p>
              <p className="text-lg font-bold text-stone-900">{formatRupiah(ringkasan.tunai)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-stone-500">Rekening{fund.bankName ? ` (${fund.bankName})` : ""}</p>
              <p className="text-lg font-bold text-stone-900">{formatRupiah(ringkasan.rekening)}</p>
            </div>
          </div>
          <p className="text-xs text-stone-400 mt-3">Transfer ke rekening tidak mengurangi dana terkumpul.</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5">
          <p className="text-sm font-semibold text-stone-700 mb-3">Target Dana</p>
          {persen === null ? (
            <p className="text-sm text-stone-500">Dana ini tidak memakai target nominal.</p>
          ) : (
            <>
              <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${persen}%` }} />
              </div>
              <p className="text-sm text-stone-600 mt-2">
                <span className="font-bold text-stone-900">{persen}%</span> — {formatRupiah(ringkasan.danaTerkumpul)} dari {formatRupiah(fund.targetAmount!)}
              </p>
            </>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-5 border-b border-stone-200 bg-stone-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <h3 className="text-lg font-semibold text-stone-800">Rekap Setoran {tahun}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={`/p/${punguanId}/tabungan/${fundId}/pertemuan`}>
              <Button variant="outline" size="sm" className="border-stone-300 text-stone-700 hover:bg-stone-50 mr-2">
                <CalendarDays className="h-4 w-4 mr-1.5" /> Tuan Rumah
              </Button>
            </Link>
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
                {BULAN.map((b) => {
                  const host = tuanRumah.find((m) => m.periodMonth === b)?.hostName;
                  return (
                    <th key={b} className="px-3 py-3 text-right whitespace-nowrap align-bottom">
                      <div>{NAMA_BULAN[b - 1].slice(0, 3)}</div>
                      {host && <div className="font-normal normal-case text-[10px] text-stone-400 max-w-[110px] truncate ml-auto">{host}</div>}
                    </th>
                  );
                })}
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
                      {totalBaris(h.id) === 0 ? <span className="text-stone-300">–</span> : formatRupiah(totalBaris(h.id))}
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

      <div className="bg-white rounded-xl shadow-sm border border-stone-200 overflow-hidden">
        <div className="p-5 border-b border-stone-200 bg-stone-50/50 flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <h3 className="text-lg font-semibold text-stone-800">Buku Besar</h3>
          <form className="flex flex-wrap gap-2 items-center">
            <input type="hidden" name="tahun" value={tahun} />
            <select name="tipe" defaultValue={tipe ?? ""} className="px-3 py-2 text-sm border border-stone-300 rounded-md bg-white">
              <option value="">Semua jenis</option>
              {["SETORAN", "PENGEMBALIAN", "PENGELUARAN", "TRANSFER", "PENYESUAIAN"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select name="bulan" defaultValue={bulan ?? ""} className="px-3 py-2 text-sm border border-stone-300 rounded-md bg-white">
              <option value="">Semua bulan</option>
              {BULAN.map((b) => <option key={b} value={b}>{NAMA_BULAN[b - 1]}</option>)}
            </select>
            <select name="kk" defaultValue={kk ?? ""} className="px-3 py-2 text-sm border border-stone-300 rounded-md bg-white">
              <option value="">Semua KK</option>
              {semuaKK.map((h) => <option key={h.id} value={h.id}>{h.headName}</option>)}
            </select>
            <Button type="submit" variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-50">Filter</Button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-stone-600 bg-stone-100/80 border-b border-stone-200 uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Tanggal</th>
                <th className="px-6 py-4">Jenis</th>
                <th className="px-6 py-4">Keluarga</th>
                <th className="px-6 py-4">Periode</th>
                <th className="px-6 py-4">Keterangan</th>
                <th className="px-6 py-4 text-right">Nominal</th>
                <th className="px-6 py-4">Dicatat oleh</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {ledger.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-stone-500">
                    Belum ada transaksi yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                ledger.map((t) => (
                  <tr key={t.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-6 py-4 text-stone-600 whitespace-nowrap">
                      {new Date(t.transactionDate).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary" className={`border-none ${
                        t.type === 'SETORAN' ? 'bg-emerald-100 text-emerald-800' :
                        t.type === 'TRANSFER' ? 'bg-sky-100 text-sky-800' :
                        t.type === 'PENYESUAIAN' ? 'bg-stone-200 text-stone-700' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {t.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-medium text-stone-900">{t.headName ?? '–'}</td>
                    <td className="px-6 py-4 text-stone-600 whitespace-nowrap">
                      {t.periodMonth ? `${NAMA_BULAN[t.periodMonth - 1]} ${t.periodYear ?? ''}` : '–'}
                    </td>
                    <td className="px-6 py-4 text-stone-600">{t.description ?? '–'}</td>
                    <td className={`px-6 py-4 text-right font-medium whitespace-nowrap ${t.type === 'SETORAN' ? 'text-emerald-700' : 'text-stone-700'}`}>
                      {formatRupiah(t.amount)}
                    </td>
                    <td className="px-6 py-4 text-stone-500">{t.recorderName ?? '–'}</td>
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
