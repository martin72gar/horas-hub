'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Globe, Loader2, Lock, PlusCircle, Trash2, X } from 'lucide-react';
import { createAnnouncement, deleteAnnouncement, toggleAnnouncementPublic } from './actions';

const inputClass =
  'w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500';

export function BuatPengumumanForm({ punguanId }: { punguanId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center bg-red-800 hover:bg-red-900 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition-colors"
      >
        <PlusCircle className="mr-2 h-4 w-4" /> Buat Pengumuman
      </button>
    );
  }

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setError(null);
        setIsPending(true);
        const result = await createAnnouncement(punguanId, new FormData(e.currentTarget));
        setIsPending(false);
        if (result?.error) {
          setError(result.error);
          return;
        }
        setOpen(false);
        router.refresh();
      }}
      className="w-full bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-4 max-w-4xl"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-stone-800">Pengumuman Baru</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Tutup"
          className="p-1 text-stone-400 hover:text-stone-700 rounded"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md px-4 py-3">
          {error}
        </p>
      )}

      <div>
        <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-1">
          Judul
        </label>
        <input id="title" name="title" maxLength={255} required className={inputClass} />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-stone-700 mb-1">
          Isi
        </label>
        <textarea id="content" name="content" rows={5} required className={inputClass} />
      </div>

      <label className="flex items-start gap-3 text-sm text-stone-700">
        <input type="checkbox" name="isPublic" className="mt-0.5 h-4 w-4 accent-red-800" />
        <span>
          Tampilkan di landing page publik
          <span className="block text-xs text-stone-500">
            Kalau tidak dicentang, pengumuman hanya terlihat pengurus di panel ini.
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-md transition-colors"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
      </button>
    </form>
  );
}

export function PengumumanRowActions({
  punguanId,
  id,
  isPublic,
}: {
  punguanId: string;
  id: string;
  isPublic: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<{ error?: string } | undefined>) {
    setBusy(key);
    const result = await fn();
    setBusy(null);
    if (result?.error) alert(result.error);
    else router.refresh();
  }

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => run('toggle', () => toggleAnnouncementPublic(punguanId, id, !isPublic))}
        disabled={busy === 'toggle'}
        title={isPublic ? 'Sembunyikan dari landing page' : 'Tampilkan di landing page'}
        className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md border transition-colors ${
          isPublic
            ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100'
            : 'bg-stone-50 border-stone-200 text-stone-600 hover:bg-stone-100'
        }`}
      >
        {busy === 'toggle' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : isPublic ? (
          <Globe className="h-3.5 w-3.5" />
        ) : (
          <Lock className="h-3.5 w-3.5" />
        )}
        {isPublic ? 'Publik' : 'Internal'}
      </button>
      <button
        onClick={() => {
          if (!confirm('Hapus pengumuman ini?')) return;
          run('delete', () => deleteAnnouncement(punguanId, id));
        }}
        disabled={busy === 'delete'}
        aria-label="Hapus pengumuman"
        className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}
