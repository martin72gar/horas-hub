"use client"

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, X } from "lucide-react";
import { createBatchKK } from "./actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BatchKKForm({ punguanId }: { punguanId: string }) {
  const router = useRouter();
  const [rows, setRows] = useState([
    { headName: "", panggoaran: "", phone: "", address: "", wifeName: "", sektor: "", pomparan: "", nomorKeturunan: "" },
    { headName: "", panggoaran: "", phone: "", address: "", wifeName: "", sektor: "", pomparan: "", nomorKeturunan: "" },
    { headName: "", panggoaran: "", phone: "", address: "", wifeName: "", sektor: "", pomparan: "", nomorKeturunan: "" },
  ]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddRow = () => {
    setRows([...rows, { headName: "", panggoaran: "", phone: "", address: "", wifeName: "", sektor: "", pomparan: "", nomorKeturunan: "" }]);
  };

  const handleRemoveRow = (index: number) => {
    if (rows.length <= 1) return;
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleRowChange = (index: number, field: string, value: string) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field as any]: value };
    setRows(newRows);

    // Auto-add row if typing in the last row
    if (index === rows.length - 1 && value.length > 0) {
      handleAddRow();
    }
  };

  const handleSubmit = async () => {
    // Filter rows that have at least a headName
    const validRows = rows.filter(r => r.headName.trim() !== "");

    if (validRows.length === 0) {
      setError("Isi minimal satu baris Kepala Keluarga.");
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      const result = await createBatchKK(punguanId, validRows);
      if (result?.error) {
        setError(result.error);
        setIsPending(false);
      } else {
        router.push(`/p/${punguanId}/kk`);
      }
    } catch (e: any) {
      setError(e.message || "Terjadi kesalahan.");
      setIsPending(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-stone-600 bg-stone-100/80 border-b border-stone-200 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3 w-10 text-center">#</th>
              <th className="px-4 py-3 min-w-[200px]">Nama KK <span className="text-red-500">*</span></th>
              <th className="px-4 py-3 min-w-[150px]">Panggoaran</th>
              <th className="px-4 py-3 min-w-[150px]">Sektor</th>
              <th className="px-4 py-3 min-w-[150px]">Pomparan</th>
              <th className="px-4 py-3 min-w-[120px]">No. Ket</th>
              <th className="px-4 py-3 min-w-[200px]">Nama Istri</th>
              <th className="px-4 py-3 min-w-[150px]">No. Handphone</th>
              <th className="px-4 py-3 min-w-[250px]">Alamat</th>
              <th className="px-4 py-3 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-200">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-stone-50 group">
                <td className="px-4 py-2 text-center text-stone-400">{i + 1}</td>
                <td className="px-2 py-2">
                  <input
                    value={row.headName}
                    onChange={e => handleRowChange(i, 'headName', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border-transparent hover:border-stone-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded bg-transparent focus:bg-white"
                    placeholder="Contoh: Osmartin Pardomuan Siregar"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.panggoaran}
                    onChange={e => handleRowChange(i, 'panggoaran', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border-transparent hover:border-stone-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded bg-transparent focus:bg-white"
                    placeholder="A. Paima"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.sektor}
                    onChange={e => handleRowChange(i, 'sektor', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border-transparent hover:border-stone-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded bg-transparent focus:bg-white"
                    placeholder="Cilincing"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.pomparan}
                    onChange={e => handleRowChange(i, 'pomparan', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border-transparent hover:border-stone-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded bg-transparent focus:bg-white"
                    placeholder="Silo"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    type="number"
                    value={row.nomorKeturunan}
                    onChange={e => handleRowChange(i, 'nomorKeturunan', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border-transparent hover:border-stone-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded bg-transparent focus:bg-white"
                    placeholder="17"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.wifeName}
                    onChange={e => handleRowChange(i, 'wifeName', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border-transparent hover:border-stone-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded bg-transparent focus:bg-white"
                    placeholder="Tiurmauli br. Tampubolon"
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.phone}
                    onChange={e => handleRowChange(i, 'phone', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border-transparent hover:border-stone-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded bg-transparent focus:bg-white"
                    placeholder="0812..."
                  />
                </td>
                <td className="px-2 py-2">
                  <input
                    value={row.address}
                    onChange={e => handleRowChange(i, 'address', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border-transparent hover:border-stone-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded bg-transparent focus:bg-white"
                    placeholder="Alamat lengkap..."
                  />
                </td>
                <td className="px-2 py-2 text-center">
                  <button
                    onClick={() => handleRemoveRow(i)}
                    className="text-stone-300 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 p-1"
                    title="Hapus baris"
                    disabled={rows.length <= 1}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-stone-200 bg-stone-50 flex items-center">
        <Button variant="ghost" onClick={handleAddRow} size="sm" className="text-stone-600">
          <Plus className="w-4 h-4 mr-2" /> Tambah Baris Kosong
        </Button>
      </div>

      <div className="p-5 border-t border-stone-200 bg-white">
        {error && <div className="mb-4 text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-md font-medium">{error}</div>}
        <div className="flex justify-end space-x-3">
          <Link href={`/p/${punguanId}/kk`}>
            <Button variant="outline" className="text-stone-600 hover:bg-stone-50">
              <X className="w-4 h-4 mr-2" /> Batal
            </Button>
          </Link>
          <Button onClick={handleSubmit} disabled={isPending} className="bg-red-800 hover:bg-red-900 text-white min-w-[140px] shadow-sm">
            {isPending ? "Menyimpan..." : <><Save className="h-4 w-4 mr-2" /> Simpan Batch Data</>}
          </Button>
        </div>
      </div>
    </div>
  );
}
