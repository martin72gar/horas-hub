'use client';

import { useState } from 'react';
import { FileDown, FileText, Loader2 } from 'lucide-react';
import {
  buildStatuteDocx,
  buildStatutePdf,
  downloadBlob,
  statuteFileName,
  type StatuteExportData,
} from '@/lib/statute-export';

type Format = 'docx' | 'pdf';

const BUTTONS: { format: Format; label: string; Icon: typeof FileText }[] = [
  { format: 'docx', label: 'Ekspor Word', Icon: FileText },
  { format: 'pdf', label: 'Ekspor PDF', Icon: FileDown },
];

/**
 * Ekspor dijalankan di browser supaya tidak membebani server: `docx` dan `jspdf`
 * baru diunduh saat tombolnya benar-benar ditekan.
 */
export default function StatuteExportButtons({
  data,
  onError,
}: {
  data: StatuteExportData;
  onError?: (message: string) => void;
}) {
  const [busy, setBusy] = useState<Format | null>(null);

  async function handleExport(format: Format) {
    if (busy) return;
    if (data.articles.length === 0) {
      onError?.('Tambahkan minimal satu pasal sebelum mengekspor.');
      return;
    }

    setBusy(format);
    try {
      const blob = format === 'docx' ? await buildStatuteDocx(data) : await buildStatutePdf(data);
      downloadBlob(blob, statuteFileName(data, format));
    } catch (error: unknown) {
      console.error(error);
      onError?.(
        error instanceof Error
          ? `Gagal membuat berkas: ${error.message}`
          : 'Gagal membuat berkas ekspor.'
      );
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      {BUTTONS.map(({ format, label, Icon }) => (
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
          {label}
        </button>
      ))}
    </>
  );
}
