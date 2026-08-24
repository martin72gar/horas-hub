import { ReactNode } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublishedPunguan, getPublishedStatutes } from '@/lib/public-site';
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

  const published = await getPublishedStatutes(punguan.id);

  return (
    <div className="min-h-screen flex flex-col bg-stone-50 text-stone-800">
      <header className="bg-stone-900 text-stone-100 border-b border-stone-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-wrap items-center gap-x-8 gap-y-3">
          <Link href="/" className="flex items-center space-x-3 min-w-0">
            <Logo size={32} className="flex-shrink-0" />
            <span className="text-lg font-bold font-serif text-white truncate">{punguan.name}</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm ml-auto">
            <Link href="/" className="text-stone-300 hover:text-white transition-colors">
              Beranda
            </Link>
            {published.length > 0 && (
              <Link
                href={`/${published[0].type.toLowerCase()}`}
                className="text-stone-300 hover:text-white transition-colors"
              >
                {published.map((s) => s.type).join('/')}
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full">{children}</main>

      <footer className="bg-stone-900 text-stone-400 text-sm">
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-wrap justify-between gap-4">
          <p>
            &copy; {new Date().getFullYear()} {punguan.name}
          </p>
          <p className="text-stone-500">
            {published.length > 0
              ? published.map((s) => STATUTE_LABELS[s.type]).join(' · ')
              : 'HorasHub'}
          </p>
        </div>
      </footer>
    </div>
  );
}
