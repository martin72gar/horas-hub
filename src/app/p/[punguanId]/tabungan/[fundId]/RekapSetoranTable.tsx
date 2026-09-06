"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Maximize2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/utils";
import { NAMA_BULAN } from "@/lib/tabungan";

const BULAN = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

type HouseholdRow = {
  id: string;
  headName: string;
  status: string;
};

type SetoranRow = {
  householdId: string | null;
  periodMonth: number | null;
  total: number;
};

type HostRow = {
  periodMonth: number | null;
  hostName: string | null;
};

type RekapSetoranTableProps = {
  punguanId: string;
  fundId: string;
  year: number;
  availableYears: number[];
  households: HouseholdRow[];
  setoranRows: SetoranRow[];
  hosts: HostRow[];
};

export default function RekapSetoranTable({
  punguanId,
  fundId,
  year,
  availableYears,
  households,
  setoranRows,
  hosts,
}: RekapSetoranTableProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const amounts = useMemo(
    () => new Map(setoranRows.map((row) => [`${row.householdId}:${row.periodMonth}`, row.total])),
    [setoranRows]
  );

  useEffect(() => {
    if (!isFullscreen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsFullscreen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [isFullscreen]);

  const valueFor = (householdId: string, month: number) => amounts.get(`${householdId}:${month}`) ?? null;
  const totalRow = (householdId: string) => BULAN.reduce((sum, month) => sum + (valueFor(householdId, month) ?? 0), 0);
  const totalMonth = (month: number) => households.reduce((sum, household) => sum + (valueFor(household.id, month) ?? 0), 0);
  const totalYear = households.reduce((sum, household) => sum + totalRow(household.id), 0);

  const table = (fullHeight = false) => (
    <div className={fullHeight ? "h-full overflow-auto" : "overflow-x-auto"}>
      <table className="w-full min-w-[900px] text-left text-sm">
        <thead className="sticky top-0 z-10 border-b border-stone-200 bg-stone-100/95 text-xs font-semibold uppercase text-stone-600 backdrop-blur">
          <tr>
            <th className="sticky left-0 z-20 min-w-[180px] bg-stone-100/95 px-4 py-3">Nama KK</th>
            {BULAN.map((month) => {
              const host = hosts.find((item) => item.periodMonth === month)?.hostName;
              return (
                <th key={month} className="whitespace-nowrap px-3 py-3 text-right align-bottom">
                  <div>{NAMA_BULAN[month - 1].slice(0, 3)}</div>
                  {host && <div className="ml-auto max-w-[110px] truncate text-[10px] font-normal normal-case text-stone-400">{host}</div>}
                </th>
              );
            })}
            <th className="px-4 py-3 text-right">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-200 bg-white">
          {households.length === 0 ? (
            <tr><td colSpan={14} className="px-6 py-8 text-center text-stone-500">Belum ada keluarga terdaftar.</td></tr>
          ) : households.map((household) => (
            <tr key={household.id} className="transition-colors hover:bg-stone-50">
              <td className="sticky left-0 z-[1] bg-white px-4 py-3 font-medium text-stone-900 group-hover:bg-stone-50">
                {household.headName}
                {household.status !== "AKTIF" && <span className="ml-2 text-xs text-stone-400">({household.status})</span>}
              </td>
              {BULAN.map((month) => {
                const value = valueFor(household.id, month);
                return <td key={month} className="whitespace-nowrap px-3 py-3 text-right text-stone-600">{value === null ? <span className="text-stone-300">–</span> : formatRupiah(value)}</td>;
              })}
              <td className="whitespace-nowrap px-4 py-3 text-right font-semibold text-stone-900">
                {totalRow(household.id) === 0 ? <span className="text-stone-300">–</span> : formatRupiah(totalRow(household.id))}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="sticky bottom-0 z-10 border-t-2 border-stone-300 bg-stone-50 font-semibold text-stone-800">
          <tr>
            <td className="sticky left-0 z-20 bg-stone-50 px-4 py-3">Total per Bulan</td>
            {BULAN.map((month) => <td key={month} className="whitespace-nowrap px-3 py-3 text-right">{totalMonth(month) === 0 ? <span className="text-stone-300">–</span> : formatRupiah(totalMonth(month))}</td>)}
            <td className="whitespace-nowrap px-4 py-3 text-right">{formatRupiah(totalYear)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-stone-200 bg-stone-50/50 p-4 sm:p-5 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-stone-800">Rekap Setoran {year}</h3>
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={`/p/${punguanId}/tabungan/${fundId}/pertemuan`}>
              <Button variant="outline" size="sm" className="mr-1 border-stone-300 text-stone-700 hover:bg-stone-50">
                <CalendarDays className="mr-1.5 h-4 w-4" /> Tuan Rumah
              </Button>
            </Link>
            <Button variant="outline" size="sm" onClick={() => setIsFullscreen(true)} className="border-stone-300 text-stone-700 hover:bg-stone-50">
              <Maximize2 className="mr-1.5 h-4 w-4" /> Layar penuh
            </Button>
            {availableYears.map((availableYear) => (
              <Link
                key={availableYear}
                href={`/p/${punguanId}/tabungan/${fundId}?tahun=${availableYear}`}
                className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${availableYear === year ? "border-emerald-700 bg-emerald-700 text-white" : "border-stone-300 bg-white text-stone-600 hover:bg-stone-50"}`}
              >
                {availableYear}
              </Link>
            ))}
          </div>
        </div>
        {table()}
      </section>

      {isFullscreen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-stone-100" role="dialog" aria-modal="true" aria-label={`Rekap setoran ${year} layar penuh`}>
          <header className="flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 py-3 sm:px-6">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Dana Tabungan</p>
              <h2 className="text-lg font-semibold text-stone-900">Rekap Setoran {year}</h2>
            </div>
            <Button variant="outline" aria-label="Tutup tampilan layar penuh" onClick={() => setIsFullscreen(false)} className="min-h-11 border-stone-300 text-stone-700">
              <X className="mr-1.5 h-4 w-4" /> <span className="hidden sm:inline">Tutup</span>
              <span className="sr-only">Tutup tampilan layar penuh</span>
            </Button>
          </header>
          <div className="min-h-0 flex-1 p-3 sm:p-6">{table(true)}</div>
        </div>
      )}
    </>
  );
}
