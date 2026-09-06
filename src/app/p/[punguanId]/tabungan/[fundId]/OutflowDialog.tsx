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
import { MinusCircle, Save } from "lucide-react";
import { recordOutflow } from "./actions";
import type { HouseholdOption } from "./SetoranDialog";

const inputClass =
  "w-full px-3 py-2 text-sm border border-stone-300 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 rounded-md bg-white";

export default function OutflowDialog({
  punguanId,
  fundId,
  households,
}: {
  punguanId: string;
  fundId: string;
  households: HouseholdOption[];
}) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("PENGEMBALIAN");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const result = await recordOutflow(punguanId, fundId, new FormData(e.currentTarget));

    setIsPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="outline" className="border-stone-300 text-stone-700 hover:bg-stone-50 shadow-sm" />}>
        <MinusCircle className="mr-2 h-4 w-4" /> Catat Uang Keluar
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-stone-800">Catat Uang Keluar</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Jenis Transaksi</label>
            <select name="type" value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              <option value="PENGEMBALIAN">Pengembalian ke anggota</option>
              <option value="TRANSFER">Transfer tunai ke rekening</option>
              <option value="PENGELUARAN">Pengeluaran / biaya</option>
              <option value="PENYESUAIAN">Penyesuaian (koreksi)</option>
            </select>
            <p className="text-xs text-stone-500">
              {type === "TRANSFER"
                ? "Transfer hanya memindahkan uang dari kas tunai ke rekening; dana terkumpul tidak berubah."
                : type === "PENYESUAIAN"
                ? "Koreksi manual. Isi nominal minus untuk mengurangi dana terkumpul."
                : "Nominal ini mengurangi dana terkumpul."}
            </p>
          </div>

          {type === "PENGEMBALIAN" && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Dikembalikan ke <span className="text-red-500">*</span></label>
              <select required name="householdId" defaultValue="" className={inputClass}>
                <option value="" disabled>Pilih keluarga...</option>
                {households.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.headName}{h.status !== "AKTIF" ? ` (${h.status})` : ""}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Nominal (Rp) <span className="text-red-500">*</span></label>
              <input required type="number" name="amount" className={inputClass} placeholder="100000" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Tanggal</label>
              <input type="date" name="transactionDate" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Catatan</label>
            <input name="description" className={inputClass} placeholder="Contoh: TF ke rekening BRI" />
          </div>

          {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-md font-medium">{error}</div>}

          <div className="pt-2 flex justify-end border-t border-stone-200">
            <Button type="submit" disabled={isPending} className="bg-stone-800 hover:bg-stone-900 text-white min-w-[130px] shadow-sm">
              {isPending ? "Menyimpan..." : <><Save className="h-4 w-4 mr-2" /> Simpan Transaksi</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
