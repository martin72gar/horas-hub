import { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPengurus, getPublishedPunguan, getPublishedStatutes } from '@/lib/public-site';
import { STATUTE_LABELS } from '@/lib/statute';
import Logo from '@/components/Logo';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const punguan = await getPublishedPunguan(slug);
  if (!punguan) return { title: 'Halaman tidak ditemukan' };
  return {
    title: punguan.name,
    description: punguan.tagline ?? punguan.description ?? undefined,
  };
}

export default async function PublicSiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const punguan = await getPublishedPunguan(slug);
  if (!punguan) notFound();

  const [published, pengurus] = await Promise.all([
    getPublishedStatutes(punguan.id),
    getPengurus(punguan.id),
  ]);

  // Anchor absolut (`/#...`) supaya nav yang sama juga jalan dari halaman AD/ART.
  const sections = [
    { href: '/', label: 'Beranda' },
    ...(punguan.about || punguan.description ? [{ href: '/#profil', label: 'Profil' }] : []),
    ...(punguan.pengurus || pengurus.length > 0 ? [{ href: '/#pengurus', label: 'Pengurus' }] : []),
    ...(punguan.contactPhone || punguan.contactEmail || punguan.contactAddress
      ? [{ href: '/#kontak', label: 'Kontak' }]
      : []),
  ];
  const statuteHref = published.length > 0 ? `/${published[0].type.toLowerCase()}` : null;
  const statuteLabel = published.map((s) => s.type).join('/');

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-800">
      <header className="sticky top-0 z-50 bg-stone-900/95 text-stone-100 border-b border-stone-800 shadow-lg shadow-stone-950/20 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link href="/" className="flex items-center space-x-3 min-w-0">
            <Logo size={32} className="flex-shrink-0" />
            <span className="text-lg font-bold font-serif text-white truncate">{punguan.name}</span>
          </Link>
          <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm ml-auto">
            {sections.map((s) => (
              <Link
                key={s.href}
                href={s.href}
                className="text-stone-300 hover:text-white transition-colors"
              >
                {s.label}
              </Link>
            ))}
            {statuteHref && (
              <Link
                href={statuteHref}
                className="rounded-lg border border-stone-600 px-3 py-1.5 text-stone-200 hover:border-red-700 hover:bg-red-900/40 hover:text-white transition-colors"
              >
                {statuteLabel}
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>

      <footer className="bg-stone-900 text-stone-400 text-sm">
        <div className="max-w-5xl mx-auto px-6 py-10 flex flex-col gap-6 sm:flex-row sm:justify-between">
          <div>
            <p className="font-serif text-base text-stone-200">{punguan.name}</p>
            {punguan.tagline && <p className="mt-1 max-w-sm text-stone-500">{punguan.tagline}</p>}
            <p className="mt-3 text-stone-500">
              &copy; {new Date().getFullYear()} {punguan.name}
            </p>
          </div>
          <nav className="flex flex-col gap-2">
            {sections.map((s) => (
              <Link key={s.href} href={s.href} className="hover:text-stone-100 transition-colors">
                {s.label}
              </Link>
            ))}
            {published.map((s) => (
              <Link
                key={s.type}
                href={`/${s.type.toLowerCase()}`}
                className="hover:text-stone-100 transition-colors"
              >
                {STATUTE_LABELS[s.type]}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
