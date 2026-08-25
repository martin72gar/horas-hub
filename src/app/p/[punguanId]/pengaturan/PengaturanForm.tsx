'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ExternalLink, Loader2 } from 'lucide-react';
import { validateSlug } from '@/lib/tenant-slug';
import { checkSlugAvailability, updateLandingSettings } from './actions';

type Punguan = {
  id: string;
  name: string;
  slug: string | null;
  landingPublished: boolean;
  tagline: string | null;
  about: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactAddress: string | null;
};

const inputClass =
  'w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500';

type SlugCheck = {
  status: 'idle' | 'waiting' | 'checking' | 'available' | 'unavailable';
  message?: string;
};

export default function PengaturanForm({
  punguan,
  rootDomain,
}: {
  punguan: Punguan;
  rootDomain: string;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(punguan.slug ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [slugCheck, setSlugCheck] = useState<SlugCheck>(
    punguan.slug
      ? { status: 'available', message: 'Alamat ini sedang digunakan punguan Anda.' }
      : { status: 'idle' }
  );

  const protocol = rootDomain.startsWith('localhost') ? 'http' : 'https';
  const previewUrl = slug ? `${protocol}://${slug}.${rootDomain}` : null;

  useEffect(() => {
    const normalizedSlug = slug.trim().toLowerCase();
    if (!normalizedSlug || validateSlug(normalizedSlug) || normalizedSlug === punguan.slug) return;

    let cancelled = false;

    const timer = window.setTimeout(async () => {
      setSlugCheck({ status: 'checking', message: 'Memeriksa ketersediaan alamat…' });
      const result = await checkSlugAvailability(punguan.id, normalizedSlug);
      if (cancelled) return;

      setSlugCheck(
        result.available
          ? { status: 'available', message: 'Alamat tersedia.' }
          : { status: 'unavailable', message: result.error }
      );
    }, 3000);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [punguan.id, punguan.slug, slug]);

  function handleSlugChange(value: string) {
    const nextSlug = value.toLowerCase();
    const normalizedSlug = nextSlug.trim();
    setSlug(nextSlug);
    setSaved(false);

    if (!normalizedSlug) {
      setSlugCheck({ status: 'idle' });
      return;
    }

    const validationError = validateSlug(normalizedSlug);
    if (validationError) {
      setSlugCheck({ status: 'unavailable', message: validationError });
      return;
    }

    setSlugCheck(
      normalizedSlug === punguan.slug
        ? { status: 'available', message: 'Alamat ini sedang digunakan punguan Anda.' }
        : { status: 'waiting', message: 'Ketersediaan diperiksa setelah Anda berhenti mengetik.' }
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setIsPending(true);

    const result = await updateLandingSettings(punguan.id, new FormData(e.currentTarget));

    setIsPending(false);
    if (result?.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {error && (
        <p className="bg-red-50 border border-red-200 text-red-800 text-sm rounded-md px-4 py-3">
          {error}
        </p>
      )}
      {saved && (
        <p className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-md px-4 py-3">
          Pengaturan tersimpan.
        </p>
      )}

      <section className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-sm">
        <h3 className="font-semibold text-stone-800">Alamat &amp; Status</h3>

        <div>
          <label htmlFor="slug" className="block text-sm font-medium text-stone-700 mb-1">
            Alamat landing page
          </label>
          <div className="flex items-center gap-2">
            <input
              id="slug"
              name="slug"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              placeholder="punguan-toba-jakarta"
              className={inputClass}
            />
            <span className="text-sm text-stone-500 whitespace-nowrap">.{rootDomain}</span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Huruf kecil, angka, dan tanda hubung saja.
          </p>
          {slugCheck.status !== 'idle' && (
            <p
              aria-live="polite"
              className={`mt-2 flex items-center gap-1.5 text-xs ${
                slugCheck.status === 'available'
                  ? 'text-green-700'
                  : slugCheck.status === 'unavailable'
                    ? 'text-red-700'
                    : 'text-stone-500'
              }`}
            >
              {slugCheck.status === 'checking' && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {slugCheck.message}
            </p>
          )}
          {previewUrl && punguan.landingPublished && punguan.slug === slug && (
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-red-800 hover:underline mt-2"
            >
              {previewUrl} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>

        <label className="flex items-start gap-3 text-sm text-stone-700">
          <input
            type="checkbox"
            name="landingPublished"
            defaultChecked={punguan.landingPublished}
            className="mt-0.5 h-4 w-4 accent-red-800"
          />
          <span>
            Terbitkan landing page
            <span className="block text-xs text-stone-500">
              Kalau dimatikan, alamat di atas akan menampilkan halaman 404.
            </span>
          </span>
        </label>
      </section>

      <section className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-sm">
        <h3 className="font-semibold text-stone-800">Profil Publik</h3>

        <div>
          <label htmlFor="tagline" className="block text-sm font-medium text-stone-700 mb-1">
            Tagline
          </label>
          <input
            id="tagline"
            name="tagline"
            defaultValue={punguan.tagline ?? ''}
            placeholder="Marsiurupan, marsihaholongan"
            maxLength={255}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="about" className="block text-sm font-medium text-stone-700 mb-1">
            Tentang punguan
          </label>
          <textarea
            id="about"
            name="about"
            rows={6}
            defaultValue={punguan.about ?? ''}
            placeholder="Sejarah singkat, visi, dan kegiatan punguan."
            className={inputClass}
          />
        </div>
      </section>

      <section className="bg-white border border-stone-200 rounded-xl p-6 space-y-4 shadow-sm">
        <h3 className="font-semibold text-stone-800">Kontak</h3>
        <p className="text-xs text-stone-500 -mt-2">
          Ini tampil publik. Gunakan kontak resmi punguan, bukan nomor pribadi pengurus.
        </p>

        <div>
          <label htmlFor="contactPhone" className="block text-sm font-medium text-stone-700 mb-1">
            Telepon / WhatsApp
          </label>
          <input id="contactPhone" name="contactPhone" defaultValue={punguan.contactPhone ?? ''} className={inputClass} />
        </div>

        <div>
          <label htmlFor="contactEmail" className="block text-sm font-medium text-stone-700 mb-1">
            Email
          </label>
          <input id="contactEmail" name="contactEmail" type="email" defaultValue={punguan.contactEmail ?? ''} className={inputClass} />
        </div>

        <div>
          <label htmlFor="contactAddress" className="block text-sm font-medium text-stone-700 mb-1">
            Alamat sekretariat
          </label>
          <textarea id="contactAddress" name="contactAddress" rows={3} defaultValue={punguan.contactAddress ?? ''} className={inputClass} />
        </div>
      </section>

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 bg-red-800 hover:bg-red-900 disabled:opacity-60 text-white text-sm font-medium px-5 py-2.5 rounded-md shadow-sm transition-colors"
      >
        {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
        Simpan Pengaturan
      </button>
    </form>
  );
}
