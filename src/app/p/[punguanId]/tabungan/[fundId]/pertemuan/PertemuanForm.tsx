"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { setTuanRumah } from "../actions";
import { NAMA_BULAN, type HouseholdOption } from "@/lib/tabungan";

const inputClass =
  "w-full px-3 py-2 text-sm border border-stone-300 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 rounded-md bg-white";

export default function PertemuanForm({
  punguanId,
  fundId,
  households,
  defaultYear,
}: {
  punguanId: string;
  fundId: string;
  households: HouseholdOption[];
  defaultYear: number;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const form = e.currentTarget;
    const result = await setTuanRumah(punguanId, fundId, new FormData(form));

    setIsPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    form.reset();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Bulan</label>
          <select name="periodMonth" defaultValue={new Date().getMonth() + 1} className={inputClass}>
            {NAMA_BULAN.map((b, i) => <option key={b} value={i + 1}>{b}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Tahun</label>
          <input type="number" name="periodYear" defaultValue={defaultYear} className={inputClass} />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-medium text-stone-700">Tuan Rumah</label>
          <select name="hostHouseholdId" defaultValue="" className={inputClass}>
            <option value="">Belum ditentukan</option>
            {households.map((h) => (
              <option key={h.id} value={h.id}>
                {h.headName}{h.status !== "AKTIF" ? ` (${h.status})` : ""}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label className="text-sm font-medium text-stone-700">Judul Pertemuan</label>
          <input name="title" className={inputClass} placeholder="Contoh: Partangiangan Agustus" />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Tanggal</label>
          <input type="date" name="meetingDate" className={inputClass} />
        </div>
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-stone-700">Catatan</label>
          <input name="notes" className={inputClass} placeholder="Opsional" />
        </div>
      </div>

      {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-md font-medium">{error}</div>}

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending} className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-[150px] shadow-sm">
          {isPending ? "Menyimpan..." : <><Save className="h-4 w-4 mr-2" /> Simpan Tuan Rumah</>}
        </Button>
      </div>
    </form>
  );
}
