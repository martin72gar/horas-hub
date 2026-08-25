'use client';

import { useState } from 'react';
import { FileDown, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  buildStatuteDocx,
  buildStatutePdf,
  downloadBlob,
  statuteFileName,
  type StatuteExportData,
} from '@/lib/statute-export';

type Format = 'docx' | 'pdf';

const FORMATS: { format: Format; name: string; Icon: typeof FileText }[] = [
  { format: 'docx', name: 'Word', Icon: FileText },
  { format: 'pdf', name: 'PDF', Icon: FileDown },
];

/**
 * Ekspor dijalankan di browser supaya tidak membebani server: `docx` dan `jspdf`
 * baru diunduh saat tombolnya benar-benar ditekan.
 *
 * Dipakai pengurus (halaman kelola) dan pembaca umum (landing page). Kalau
 * pemanggil tidak memberi `onError`, galat ditampilkan sendiri di bawah tombol.
 */
export default function StatuteExportButtons({
  data,
  label = 'Ekspor',
  className,
  onError,
}: {
  data: StatuteExportData;
  label?: string;
  className?: string;
  onError?: (message: string) => void;
}) {
  const [busy, setBusy] = useState<Format | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  function report(message: string) {
    if (onError) onError(message);
    else setLocalError(message);
  }

  async function handleExport(format: Format) {
    if (busy) return;
    if (data.articles.length === 0) {
      report('Dokumen ini belum memiliki pasal untuk diunduh.');
      return;
    }

    setBusy(format);
    setLocalError(null);
    try {
      const blob = format === 'docx' ? await buildStatuteDocx(data) : await buildStatutePdf(data);
      downloadBlob(blob, statuteFileName(data, format));
    } catch (error: unknown) {
      console.error(error);
      report(
        error instanceof Error
          ? `Gagal membuat berkas: ${error.message}`
          : 'Gagal membuat berkas unduhan.'
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {FORMATS.map(({ format, name, Icon }) => (
        <button
          key={format}
          type="button"
          onClick={() => handleExport(format)}
          disabled={busy !== null}
          className="inline-flex items-center gap-2 border border-stone-300 hover:bg-stone-50 disabled:opacity-60 text-stone-700 text-sm px-4 py-2 rounded-md transition-colors"
        >
          {busy === format ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Icon className="h-4 w-4" />
          )}
          {label} {name}
        </button>
      ))}
      {localError && <p className="w-full text-sm text-red-700">{localError}</p>}
    </div>
  );
}
