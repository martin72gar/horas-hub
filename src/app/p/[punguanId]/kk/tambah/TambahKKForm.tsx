"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save } from "lucide-react";
import { createKK } from "./action";

export default function TambahKKForm({ punguanId }: { punguanId: string }) {
  const [anggota, setAnggota] = useState([
    { relation: "ISTRI", fullName: "", gender: "P" as "P" | "L" }
  ]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddAnggota = () => {
    setAnggota([...anggota, { relation: "ANAK", fullName: "", gender: "L" }]);
  };

  const handleRemoveAnggota = (index: number) => {
    setAnggota(anggota.filter((_, i) => i !== index));
  };

  const handleAnggotaChange = (index: number, field: string, value: string) => {
    const newAnggota = [...anggota];
    newAnggota[index] = { ...newAnggota[index], [field as any]: value };
    setAnggota(newAnggota);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await createKK(punguanId, formData, anggota);
    
    if (result?.error) {
      setError(result.error);
      setIsPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Kepala Keluarga */}
      <div className="space-y-5">
        <h3 className="text-lg font-semibold text-red-900 border-b border-red-100 pb-2 flex items-center">
          <span className="w-1.5 h-4 bg-red-800 rounded mr-2 inline-block"></span>
          Data Kepala Keluarga
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Nama Lengkap <span className="text-red-500">*</span></label>
            <input required name="headName" className="w-full px-3 py-2 border border-stone-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-md" placeholder="Contoh: Osmartin Pardomuan Siregar" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Panggilan (Panggoaran)</label>
            <input name="panggoaran" className="w-full px-3 py-2 border border-stone-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-md" placeholder="Contoh: A. Paima" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">No. Handphone</label>
            <input name="phone" className="w-full px-3 py-2 border border-stone-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-md" placeholder="Contoh: 081234567890" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Sektor</label>
            <input name="sektor" className="w-full px-3 py-2 border border-stone-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-md" placeholder="Contoh: Cilincing" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">Pomparan</label>
            <input name="pomparan" className="w-full px-3 py-2 border border-stone-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-md" placeholder="Contoh: Silo" />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-stone-700">No. Pomparan/Ke</label>
            <input type="number" name="nomorKeturunan" className="w-full px-3 py-2 border border-stone-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-md" placeholder="Contoh: 17" />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-sm font-medium text-stone-700">Alamat</label>
            <textarea name="address" rows={2} className="w-full px-3 py-2 border border-stone-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-md" placeholder="Alamat domisili lengkap..." />
          </div>
        </div>
      </div>

      {/* Anggota Keluarga */}
      <div className="space-y-5">
        <h3 className="text-lg font-semibold text-red-900 border-b border-red-100 pb-2 flex items-center">
          <span className="w-1.5 h-4 bg-red-800 rounded mr-2 inline-block"></span>
          Anggota Keluarga (Opsional)
        </h3>
        {anggota.map((a, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-stone-50 p-4 rounded-xl border border-stone-200">
            <div className="space-y-1.5 w-full md:col-span-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Nama Anggota</label>
              <input 
                value={a.fullName} 
                onChange={(e) => handleAnggotaChange(i, "fullName", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-md bg-white" 
                placeholder="Nama Lengkap" 
                required={i === 0}
              />
            </div>
            <div className="w-full space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Hubungan</label>
              <select 
                value={a.relation}
                onChange={(e) => handleAnggotaChange(i, "relation", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-md bg-white"
              >
                <option value="ISTRI">Istri</option>
                <option value="ANAK">Anak</option>
                <option value="LAINNYA">Lainnya</option>
              </select>
            </div>
            <div className="w-full space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Gender</label>
              <select 
                value={a.gender}
                onChange={(e) => handleAnggotaChange(i, "gender", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-md bg-white"
              >
                <option value="L">L</option>
                <option value="P">P</option>
              </select>
            </div>
            <div className="w-full space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">Pomparan</label>
              <input 
                value={a.pomparan || ''} 
                onChange={(e) => handleAnggotaChange(i, "pomparan", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-md bg-white" 
                placeholder="Cth: Silo" 
              />
            </div>
            <div className="w-full space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-stone-500">No. Pomp/Ke</label>
              <input 
                type="number"
                value={a.nomorKeturunan || ''} 
                onChange={(e) => handleAnggotaChange(i, "nomorKeturunan", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-stone-300 focus:ring-1 focus:ring-red-500 focus:border-red-500 rounded-md bg-white" 
                placeholder="Cth: 17" 
              />
            </div>
            <div className="flex justify-end w-full md:col-span-1 pb-1">
              <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveAnggota(i)} className="text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full h-9 w-9">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={handleAddAnggota} className="w-full border-dashed border-2 text-stone-600 hover:border-stone-400 hover:bg-stone-50 py-6">
          <Plus className="h-4 w-4 mr-2" /> Tambah Anggota Lainnya
        </Button>
      </div>

      {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-4 rounded-md font-medium">{error}</div>}

      <div className="pt-6 flex justify-end border-t border-stone-200">
        <Button type="submit" disabled={isPending} className="bg-red-800 hover:bg-red-900 text-white min-w-[140px] shadow-sm">
          {isPending ? "Menyimpan..." : <><Save className="h-4 w-4 mr-2" /> Simpan Data KK</>}
        </Button>
      </div>
    </form>
  );
}
