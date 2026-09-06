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
import { PlusCircle, Pencil, Save } from "lucide-react";
import { createFund, updateFund } from "./actions";

type Fund = {
  id: string;
  name: string;
  description: string | null;
  targetEvent: string | null;
  targetYear: number | null;
  targetAmount: number | null;
  bankName: string | null;
  bankAccount: string | null;
  status: "AKTIF" | "SELESAI";
};

const inputClass =
  "w-full px-3 py-2 text-sm border border-stone-300 focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 rounded-md bg-white";

export default function FundFormDialog({ punguanId, fund }: { punguanId: string; fund?: Fund }) {
  const [open, setOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = fund
      ? await updateFund(punguanId, fund.id, formData)
      : await createFund(punguanId, formData);

    setIsPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          fund ? (
            <Button variant="outline" size="sm" className="text-emerald-700 border-emerald-200 hover:bg-emerald-50" />
          ) : (
            <Button className="bg-emerald-700 hover:bg-emerald-800 text-white w-full md:w-auto shadow-sm" />
          )
        }
      >
        {fund ? (
          <><Pencil className="h-4 w-4 mr-1.5" /> Ubah</>
        ) : (
          <><PlusCircle className="mr-2 h-4 w-4" /> Buat Dana</>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-stone-800">
            {fund ? "Ubah Dana" : "Buat Dana Bertujuan"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Nama Dana <span className="text-red-500">*</span></label>
            <input required name="name" defaultValue={fund?.name} className={inputClass} placeholder="Contoh: Dana Bona Taon 2027" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Acara / Tujuan</label>
              <input name="targetEvent" defaultValue={fund?.targetEvent ?? ""} className={inputClass} placeholder="Contoh: Bona Taon" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Tahun Sasaran</label>
              <input type="number" name="targetYear" defaultValue={fund?.targetYear ?? ""} className={inputClass} placeholder="Contoh: 2027" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-medium text-stone-700">Target Dana (Rp)</label>
              <input type="number" min={1} name="targetAmount" defaultValue={fund?.targetAmount ?? ""} className={inputClass} placeholder="Kosongkan bila tanpa target" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Nama Bank</label>
              <input name="bankName" defaultValue={fund?.bankName ?? ""} className={inputClass} placeholder="Contoh: BRI" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">No. Rekening</label>
              <input name="bankAccount" defaultValue={fund?.bankAccount ?? ""} className={inputClass} placeholder="Contoh: 1234567890" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Keterangan</label>
            <textarea name="description" rows={2} defaultValue={fund?.description ?? ""} className={inputClass} placeholder="Catatan singkat tentang dana ini..." />
          </div>

          {fund && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-stone-700">Status</label>
              <select name="status" defaultValue={fund.status} className={inputClass}>
                <option value="AKTIF">Aktif</option>
                <option value="SELESAI">Selesai</option>
              </select>
            </div>
          )}

          {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-md font-medium">{error}</div>}

          <div className="pt-2 flex justify-end border-t border-stone-200">
            <Button type="submit" disabled={isPending} className="bg-emerald-700 hover:bg-emerald-800 text-white min-w-[130px] shadow-sm">
              {isPending ? "Menyimpan..." : <><Save className="h-4 w-4 mr-2" /> Simpan Dana</>}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
