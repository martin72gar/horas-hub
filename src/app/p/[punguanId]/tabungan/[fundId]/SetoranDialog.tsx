"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle, Save } from "lucide-react";
import { recordSetoran } from "./actions";
import { NAMA_BULAN, type HouseholdOption } from "@/lib/tabungan";

const inputClass =
  "w-full px-3 py-2 text-sm border border-stone-300 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 rounded-md bg-white";

export default function SetoranDialog({
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
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keluarga non-aktif tetap bisa dipilih: seorang anggota bisa menyetor pada
  // bulan yang sama dengan bulan ia keluar, lalu dananya dikembalikan kemudian.
  const aktif = households.filter((h) => h.status === "AKTIF");
  const nonAktif = households.filter((h) => h.status !== "AKTIF");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const result = await recordSetoran(punguanId, fundId, new FormData(e.currentTarget));

    setIsPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm" />}>
        <PlusCircle className="mr-2 h-4 w-4" /> Catat Setoran
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-stone-800">Catat Setoran</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Keluarga (KK) <span className="text-red-500">*</span></label>
            <select required name="householdId" defaultValue="" className={inputClass}>
              <option value="" disabled>Pilih keluarga...</option>
              <optgroup label="Aktif">
                {aktif.map((h) => <option key={h.id} value={h.id}>{h.headName}</option>)}
              </optgroup>
              {nonAktif.length > 0 && (
                <optgroup label="Non-aktif">
                  {nonAktif.map((h) => <option key={h.id} value={h.id}>{h.headName} ({h.status})</option>)}
                </optgroup>
              )}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Nominal (Rp) <span className="text-red-500">*</span></label>
              <input required type="number" min={1} name="amount" className={inputClass} placeholder="50000" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Tanggal Terima</label>
              <input type="date" name="transactionDate" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Catatan</label>
              <input name="description" className={inputClass} placeholder="Opsional" />
            </div>
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-md font-medium">{error}</div>}

          <div className="pt-2 flex justify-end border-t border-stone-200">
            <Button type="submit" disabled={isPending} className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-[130px] shadow-sm">
              {isPending ? "Menyimpan..." : <><Save className="h-4 w-4 mr-2" /> Simpan Setoran</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
