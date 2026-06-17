"use client"

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Save, X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";
import { createBatchKK } from "./actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

const HEADER_MAPPING: Record<string, string> = {
  "nama kepala keluarga": "headName",
  "nama kk": "headName",
  "kepala keluarga": "headName",
  "nama suami": "headName",
  "suami": "headName",
  "nama lengkap": "headName",
  "nama": "headName",

  "panggoaran": "panggoaran",
  "panggilan": "panggoaran",
  "ama": "panggoaran",
  "ama...": "panggoaran",

  "pomparan": "pomparan",
  "marga": "pomparan",
  "garis keturunan": "pomparan",

  "no. pomparan / keturunan": "nomorKeturunan",
  "no. pomparan": "nomorKeturunan",
  "no. keturunan": "nomorKeturunan",
  "nomor keturunan": "nomorKeturunan",
  "no keturunan": "nomorKeturunan",
  "keturunan ke": "nomorKeturunan",
  "generasi": "nomorKeturunan",

  "nama istri": "wifeName",
  "istri": "wifeName",
  "boru": "wifeName",

  "sektor": "sektor",
  "wilayah": "sektor",

  "no. hp": "phone",
  "no. handphone": "phone",
  "no hp": "phone",
  "no handphone": "phone",
  "handphone": "phone",
  "hp": "phone",
  "telepon": "phone",
  "no. telp": "phone",
  "no telp": "phone",

  "alamat": "address",
  "alamat lengkap": "address",
};

export default function BatchKKForm({ punguanId }: { punguanId: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [rows, setRows] = useState([
    { headName: "", panggoaran: "", phone: "", address: "", wifeName: "", sektor: "", pomparan: "", nomorKeturunan: "" },
    { headName: "", panggoaran: "", phone: "", address: "", wifeName: "", sektor: "", pomparan: "", nomorKeturunan: "" },
    { headName: "", panggoaran: "", phone: "", address: "", wifeName: "", sektor: "", pomparan: "", nomorKeturunan: "" },
  ]);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [skippedRows, setSkippedRows] = useState<number[]>([]);
  const [isDragging, setIsDragging] = useState(false);

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

  const handleExcelUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import("xlsx");
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // returns array of arrays (rows)
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (rawRows.length === 0) {
          setError("Berkas Excel kosong atau tidak terbaca.");
          return;
        }
        
        // First row is headers
        const headers = rawRows[0].map(h => String(h).trim().toLowerCase());
        
        // Map headers to fields index
        const fieldIndices: Record<string, number> = {};
        headers.forEach((header, index) => {
          const field = HEADER_MAPPING[header];
          if (field) {
            fieldIndices[field] = index;
          }
        });
        
        // Verify we mapped headName
        if (fieldIndices['headName'] === undefined) {
          setError("Kolom 'Nama Kepala Keluarga' (atau 'Nama KK' / 'Nama Lengkap') tidak ditemukan di baris pertama Excel.");
          return;
        }
        
        const parsedRows: any[] = [];
        const skipped: number[] = [];
        
        // Parse data rows (starting from index 1)
        for (let i = 1; i < rawRows.length; i++) {
          const row = rawRows[i];
          if (!row || row.length === 0) continue;
          
          const getVal = (field: string) => {
            const idx = fieldIndices[field];
            if (idx === undefined) return "";
            const val = row[idx];
            return val !== undefined && val !== null ? String(val).trim() : "";
          };
          
          const headName = getVal("headName");
          
          if (!headName) {
            // Check if there is any data at all in the row
            const hasAnyData = row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== "");
            if (hasAnyData) {
              skipped.push(i + 1); // 1-indexed row number
            }
            continue;
          }
          
          // Sanitize nomorKeturunan: extract digits from things like "no. 16"
          let nomorKeturunan = getVal("nomorKeturunan");
          if (nomorKeturunan) {
            const match = nomorKeturunan.match(/\d+/);
            nomorKeturunan = match ? match[0] : "";
          }
          
          parsedRows.push({
            headName,
            panggoaran: getVal("panggoaran"),
            pomparan: getVal("pomparan"),
            nomorKeturunan,
            wifeName: getVal("wifeName"),
            sektor: getVal("sektor"),
            phone: getVal("phone"),
            address: getVal("address"),
          });
        }
        
        if (parsedRows.length === 0) {
          setError("Tidak ada baris data yang valid ditemukan untuk diimpor.");
          return;
        }
        
        setRows(parsedRows);
        setSkippedRows(skipped);
        setImportSuccess(`${parsedRows.length} baris data berhasil diimpor dari Excel.`);
        setError(null);
        
      } catch (err: any) {
        console.error(err);
        setError("Gagal membaca berkas Excel: " + (err.message || "format tidak valid"));
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleExcelUpload(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        handleExcelUpload(file);
      } else {
        setError("Format berkas harus berupa Excel (.xlsx atau .xls).");
      }
    }
  };

  const handleDownloadTemplate = async () => {
    const XLSX = await import("xlsx");
    const headers = [
      "Nama Kepala Keluarga",
      "Panggoaran",
      "Pomparan",
      "No. Pomparan / Keturunan",
      "Nama Istri",
      "Sektor",
      "No. Handphone",
      "Alamat"
    ];
    const sampleData = [
      [
        "Jasmin Siregar",
        "A. Friska",
        "Silo Jambe",
        "16",
        "br. Sipahutar",
        "Warakas",
        "081234567890",
        "Jl. Warakas V No. 96A"
      ]
    ];
    
    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...sampleData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, "Template_Batch_KK.xlsx");
  };

  const handleSubmit = async () => {
    // Filter rows that have at least a headName
    const validRows = rows.filter(r => r.headName.trim() !== "");

    if (validRows.length === 0) {
      setError("Isi atau impor minimal satu baris Kepala Keluarga.");
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
      {/* Excel Drag & Drop Import Zone */}
      <div className="p-6 border-b border-stone-200 bg-stone-50/50 flex flex-col md:flex-row gap-6 items-stretch">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragging
              ? "border-red-800 bg-red-50/30 scale-[1.01]"
              : "border-stone-300 bg-white hover:border-red-800/40 hover:bg-stone-50/40"
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx, .xls"
            className="hidden"
          />
          <div className="p-3 bg-red-50 rounded-full text-red-800 mb-3 transition-colors">
            <Upload className="w-6 h-6 animate-pulse" />
          </div>
          <p className="text-sm font-semibold text-stone-700">
            Seret & lepas file Excel di sini
          </p>
          <p className="text-xs text-stone-500 mt-1">
            atau klik untuk memilih berkas dari komputer Anda (.xlsx, .xls)
          </p>
        </div>

        <div className="w-full md:w-80 flex flex-col justify-between p-4 bg-white rounded-xl border border-stone-200 shadow-sm">
          <div>
            <h4 className="text-sm font-bold text-stone-800 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-red-800" />
              Petunjuk Pengimporan
            </h4>
            <ul className="text-xs text-stone-500 space-y-1.5 mt-3 list-disc pl-4">
              <li>Pastikan baris pertama berisi nama kolom (Header).</li>
              <li>Kolom wajib diisi: <strong className="text-stone-700">Nama Kepala Keluarga</strong> (atau Nama KK / Nama Lengkap).</li>
              <li>Sistem memetakan otomatis kolom nama istri, nomor keturunan, sektor, telepon, dll.</li>
              <li>Baris tanpa Nama Kepala Keluarga akan otomatis dilewati.</li>
            </ul>
          </div>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadTemplate}
            className="w-full mt-4 text-stone-700 border-stone-300 hover:bg-stone-50 hover:text-red-800 gap-2 font-medium"
          >
            <Download className="w-4 h-4" /> Unduh Templat Excel
          </Button>
        </div>
      </div>

      {/* Notification Feedback */}
      {(importSuccess || skippedRows.length > 0) && (
        <div className="p-4 border-b border-stone-200 bg-stone-50/80 flex flex-col gap-2">
          {importSuccess && (
            <div className="flex items-start gap-2 text-sm text-emerald-800 font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{importSuccess} Silakan periksa kembali data di bawah sebelum menyimpan.</span>
            </div>
          )}
          {skippedRows.length > 0 && (
            <div className="flex items-start gap-2 text-sm text-amber-800 font-medium bg-amber-50/60 p-3 rounded-lg border border-amber-200/50">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Ada baris data yang dilewati:</p>
                <p className="mt-0.5 text-xs text-stone-500 leading-relaxed">
                  Baris ke-<strong>{skippedRows.join(", ")}</strong> tidak memiliki Nama Kepala Keluarga sehingga dilewati dan tidak diimpor.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-stone-600 bg-stone-100/80 border-b border-stone-200 uppercase font-semibold">
            <tr>
              <th className="px-4 py-3 w-10 text-center">#</th>
              <th className="px-4 py-3 min-w-[200px]">Nama KK <span className="text-red-500">*</span></th>
              <th className="px-4 py-3 min-w-[150px]">Panggoaran</th>
              <th className="px-4 py-3 min-w-[150px]">Pomparan</th>
              <th className="px-4 py-3 min-w-[120px]">No. Pomp/Ke</th>
              <th className="px-4 py-3 min-w-[200px]">Nama Istri</th>
              <th className="px-4 py-3 min-w-[150px]">Sektor</th>
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
                    value={row.sektor}
                    onChange={e => handleRowChange(i, 'sektor', e.target.value)}
                    className="w-full px-2 py-1.5 text-sm border-transparent hover:border-stone-200 focus:border-red-500 focus:ring-1 focus:ring-red-500 rounded bg-transparent focus:bg-white"
                    placeholder="Cilincing"
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
