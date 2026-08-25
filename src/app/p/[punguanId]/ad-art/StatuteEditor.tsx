'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Loader2, Pencil, Plus, Trash2, Upload } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DEFAULT_PREAMBLE_TITLE, groupByBab, toRoman, type StatuteType } from '@/lib/statute';
import type { StatuteExportData } from '@/lib/statute-export';
import StatuteExportButtons from '@/components/StatuteExportButtons';
import {
  deleteArticle,
  publishStatute,
  unpublishStatute,
  updateStatuteMeta,
  upsertArticle,
} from './actions';

type Article = {
  id: string;
  babNumber: number;
  babTitle: string;
  pasalNumber: number;
  pasalTitle: string | null;
  content: string;
};

type Statute = {
  id: string;
  type: StatuteType;
  title: string;
  preamble: string | null;
  preambleTitle: string | null;
  preamblePublished: boolean;
  publishedAt: Date | null;
  isPublished: boolean;
};

const inputClass =
  'w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500';

export default function StatuteEditor({
  punguanId,
  statute,
  articles,
  hasUnpublishedChanges,
  publicUrl,
}: {
  punguanId: string;
  statute: Statute;
  articles: Article[];
  hasUnpublishedChanges: boolean;
  publicUrl: string | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editingMeta, setEditingMeta] = useState(false);
  // null = tidak ada form terbuka, '' = form tambah, id = form edit
  const [editingArticle, setEditingArticle] = useState<string | null>(null);

  async function run<T extends { error?: string } | undefined>(
    key: string,
    fn: () => Promise<T>,
    onDone?: () => void
  ) {
    setBusy(key);
    setError(null);
    const result = await fn();
    setBusy(null);
    if (result?.error) {
      setError(result.error);
      return;
    }
    onDone?.();
    router.refresh();
  }

  // Kelompokkan per BAB untuk tampilan; urutan sudah dari query.
  const babs = groupByBab(articles);

  const exportData: StatuteExportData = {
    type: statute.type,
    title: statute.title,
    preamble: statute.preamble,
    preambleTitle: statute.preambleTitle,
    // Tanggal terbit hanya ikut kalau isi draft memang sama dengan yang terbit,
    // supaya berkas ekspor tidak mengklaim tanggal untuk konten yang belum terbit.
    publishedAt: statute.isPublished && !hasUnpublishedChanges ? statute.publishedAt : null,
    articles,
  };

  const lastBab = babs[babs.length - 1];
  const nextDefaults = {
    babNumber: lastBab?.number ?? 1,
    babTitle: lastBab?.title ?? '',
    pasalNumber: articles.length > 0 ? Math.max(...articles.map((a) => a.pasalNumber)) + 1 : 1,
  };

  return (
    <div className="space-y-6">
      {error && (
        <p className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md px-4 py-3">
          {error}
        </p>
      )}

      {/* Status & aksi terbit */}
      <div className="bg-white border border-stone-200 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="font-semibold text-stone-900 text-lg">{statute.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {!statute.isPublished ? (
                <Badge className="bg-stone-200 text-stone-700">Belum pernah diterbitkan</Badge>
              ) : hasUnpublishedChanges ? (
                <Badge className="bg-amber-100 text-amber-900">Ada perubahan belum diterbitkan</Badge>
              ) : (
                <Badge className="bg-green-100 text-green-900">Terbit</Badge>
              )}
              {statute.publishedAt && (
                <span className="text-xs text-stone-500">
                  Terakhir terbit {statute.publishedAt.toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </span>
              )}
            </div>
            {publicUrl && statute.isPublished && (
              <a
                href={publicUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-red-800 hover:underline mt-2"
              >
                Lihat di landing page <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <StatuteExportButtons data={exportData} onError={setError} />
            <button
              onClick={() => setEditingMeta((v) => !v)}
              className="inline-flex items-center gap-2 border border-stone-300 hover:bg-stone-50 text-stone-700 text-sm px-4 py-2 rounded-md transition-colors"
            >
              <Pencil className="h-4 w-4" /> Judul &amp; Pembuka
            </button>
            <button
              onClick={() =>
                run('publish', () => publishStatute(punguanId, statute.id))
              }
              disabled={busy === 'publish'}
              className="inline-flex items-center gap-2 bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-md shadow-sm transition-colors"
            >
              {busy === 'publish' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {statute.isPublished ? 'Terbitkan Ulang' : 'Terbitkan'}
            </button>
            {statute.isPublished && (
              <button
                onClick={() => {
                  if (!confirm('Tarik dokumen ini dari landing page? Draft tetap tersimpan.')) return;
                  run('unpublish', () => unpublishStatute(punguanId, statute.id));
                }}
                disabled={busy === 'unpublish'}
                className="inline-flex items-center gap-2 border border-stone-300 hover:bg-stone-50 disabled:opacity-60 text-stone-700 text-sm px-4 py-2 rounded-md transition-colors"
              >
                {busy === 'unpublish' && <Loader2 className="h-4 w-4 animate-spin" />}
                Tarik dari Publik
              </button>
            )}
          </div>
        </div>

        {editingMeta && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              run('meta', () => updateStatuteMeta(punguanId, statute.id, fd), () =>
                setEditingMeta(false)
              );
            }}
            className="border-t border-stone-100 pt-4 space-y-4"
          >
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-1">
                Judul dokumen
              </label>
              <input id="title" name="title" defaultValue={statute.title} maxLength={255} className={inputClass} />
            </div>
            <div>
              <label htmlFor="preambleTitle" className="block text-sm font-medium text-stone-700 mb-1">
                Judul seksi pembuka{' '}
                <span className="text-stone-400 font-normal">
                  (kosongkan = {DEFAULT_PREAMBLE_TITLE})
                </span>
              </label>
              <input
                id="preambleTitle"
                name="preambleTitle"
                defaultValue={statute.preambleTitle ?? ''}
                placeholder={DEFAULT_PREAMBLE_TITLE}
                maxLength={120}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="preamble" className="block text-sm font-medium text-stone-700 mb-1">
                Isi seksi pembuka <span className="text-stone-400 font-normal">(opsional)</span>
              </label>
              <textarea id="preamble" name="preamble" rows={5} defaultValue={statute.preamble ?? ''} className={inputClass} />
            </div>
            <label className="flex items-center gap-2 text-sm text-stone-700">
              <input
                type="checkbox"
                name="preamblePublished"
                defaultChecked={statute.preamblePublished}
                className="h-4 w-4 rounded border-stone-300 text-red-800 focus:ring-red-500"
              />
              Tampilkan seksi pembuka di landing page
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={busy === 'meta'}
                className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-md transition-colors"
              >
                {busy === 'meta' && <Loader2 className="h-4 w-4 animate-spin" />} Simpan
              </button>
              <button
                type="button"
                onClick={() => setEditingMeta(false)}
                className="text-sm text-stone-500 hover:text-stone-800 px-3"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Daftar pasal */}
      <div className="space-y-6">
        {babs.map((bab) => (
          <section key={`${bab.number}-${bab.title}`} className="bg-white border border-stone-200 rounded-xl shadow-sm overflow-hidden">
            <header className="bg-stone-50 border-b border-stone-200 px-6 py-3">
              <h3 className="font-semibold text-stone-900">
                BAB {toRoman(bab.number)} — <span className="uppercase">{bab.title}</span>
              </h3>
            </header>
            <div className="divide-y divide-stone-100">
              {bab.items.map((a) =>
                editingArticle === a.id ? (
                  <ArticleForm
                    key={a.id}
                    article={a}
                    busy={busy === `article-${a.id}`}
                    onCancel={() => setEditingArticle(null)}
                    onSubmit={(fd) =>
                      run(`article-${a.id}`, () => upsertArticle(punguanId, statute.id, a.id, fd), () =>
                        setEditingArticle(null)
                      )
                    }
                  />
                ) : (
                  <div key={a.id} className="px-6 py-4 flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-stone-900">
                        Pasal {a.pasalNumber}
                        {a.pasalTitle && (
                          <span className="font-normal text-stone-600"> — {a.pasalTitle}</span>
                        )}
                      </p>
                      <p className="text-sm text-stone-700 whitespace-pre-wrap mt-1 leading-relaxed">
                        {a.content}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => setEditingArticle(a.id)}
                        aria-label={`Edit Pasal ${a.pasalNumber}`}
                        className="p-2 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-md transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (!confirm(`Hapus Pasal ${a.pasalNumber}?`)) return;
                          run(`delete-${a.id}`, () => deleteArticle(punguanId, a.id));
                        }}
                        disabled={busy === `delete-${a.id}`}
                        aria-label={`Hapus Pasal ${a.pasalNumber}`}
                        className="p-2 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          </section>
        ))}

        {editingArticle === '' ? (
          <div className="bg-white border border-stone-200 rounded-xl shadow-sm">
            <ArticleForm
              article={{
                id: '',
                babNumber: nextDefaults.babNumber,
                babTitle: nextDefaults.babTitle,
                pasalNumber: nextDefaults.pasalNumber,
                pasalTitle: null,
                content: '',
              }}
              busy={busy === 'article-new'}
              onCancel={() => setEditingArticle(null)}
              onSubmit={(fd) =>
                run('article-new', () => upsertArticle(punguanId, statute.id, null, fd), () =>
                  setEditingArticle(null)
                )
              }
            />
          </div>
        ) : (
          <button
            onClick={() => setEditingArticle('')}
            className="inline-flex items-center gap-2 border border-dashed border-stone-300 hover:border-red-800 hover:text-red-800 text-stone-600 text-sm px-5 py-3 rounded-lg w-full justify-center transition-colors"
          >
            <Plus className="h-4 w-4" /> Tambah Pasal
          </button>
        )}
      </div>
    </div>
  );
}

function ArticleForm({
  article,
  busy,
  onSubmit,
  onCancel,
}: {
  article: Article;
  busy: boolean;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="px-6 py-5 space-y-4 bg-stone-50/60"
    >
      <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">No. BAB</label>
          <input name="babNumber" type="number" min={1} defaultValue={article.babNumber} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Judul BAB</label>
          <input name="babTitle" defaultValue={article.babTitle} placeholder="KEANGGOTAAN" maxLength={255} required className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[100px_1fr]">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">No. Pasal</label>
          <input name="pasalNumber" type="number" min={1} defaultValue={article.pasalNumber} required className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Judul Pasal <span className="text-stone-400 font-normal">(opsional)</span>
          </label>
          <input name="pasalTitle" defaultValue={article.pasalTitle ?? ''} maxLength={255} className={inputClass} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-stone-700 mb-1">Isi pasal</label>
        <textarea
          name="content"
          rows={6}
          defaultValue={article.content}
          required
          placeholder={'(1) Anggota punguan adalah ...\n(2) Setiap anggota berhak ...'}
          className={inputClass}
        />
        <p className="text-xs text-stone-500 mt-1">
          Tulis tiap ayat di baris baru. Format baris akan dipertahankan apa adanya.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm px-4 py-2 rounded-md transition-colors"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />} Simpan Pasal
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-stone-500 hover:text-stone-800 px-3">
          Batal
        </button>
      </div>
    </form>
  );
}
