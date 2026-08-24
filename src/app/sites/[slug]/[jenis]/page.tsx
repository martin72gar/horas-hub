import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getPublishedPunguan, getPublishedStatutes } from '@/lib/public-site';
import { parseStatuteType, STATUTE_LABELS, toRoman } from '@/lib/statute';
import type { PublishedArticle } from '@/db/schema';

async function load(slug: string, jenis: string) {
  const type = parseStatuteType(jenis);
  if (!type) return null;

  const punguan = await getPublishedPunguan(slug);
  if (!punguan) return null;

  const doc = (await getPublishedStatutes(punguan.id)).find((s) => s.type === type);
  return doc ? { type, doc } : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; jenis: string }>;
}): Promise<Metadata> {
  const { slug, jenis } = await params;
  const found = await load(slug, jenis);
  return { title: found ? found.doc.publishedContent.title : 'Halaman tidak ditemukan' };
}

export default async function StatutePage({
  params,
}: {
  params: Promise<{ slug: string; jenis: string }>;
}) {
  const { slug, jenis } = await params;
  const found = await load(slug, jenis);
  if (!found) notFound();

  const { type, doc } = found;
  const { title, preamble, articles } = doc.publishedContent;

  // Kelompokkan per BAB. Urutan sudah dibekukan saat publish.
  const babs: { number: number; title: string; articles: PublishedArticle[] }[] = [];
  for (const a of articles) {
    const last = babs[babs.length - 1];
    if (last && last.number === a.babNumber) last.articles.push(a);
    else babs.push({ number: a.babNumber, title: a.babTitle, articles: [a] });
  }

  return (
    <article className="max-w-3xl mx-auto px-6 py-12">
      <header className="border-b border-stone-200 pb-6 mb-8">
        <p className="text-sm font-semibold tracking-wider text-red-800 uppercase">
          {STATUTE_LABELS[type]}
        </p>
        <h1 className="text-3xl font-bold font-serif text-stone-900 mt-2">{title}</h1>
        {doc.publishedAt && (
          <p className="text-sm text-stone-500 mt-3">
            Terakhir diperbarui {doc.publishedAt.toLocaleDateString('id-ID', { dateStyle: 'long' })}
          </p>
        )}
      </header>

      {preamble && (
        <section className="mb-10">
          <h2 className="text-lg font-bold font-serif text-stone-800 mb-3 text-center">MUKADIMAH</h2>
          <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{preamble}</p>
        </section>
      )}

      {babs.length === 0 ? (
        <p className="text-stone-500">Dokumen ini belum memiliki pasal.</p>
      ) : (
        <div className="space-y-10">
          {babs.map((bab) => (
            <section key={`${bab.number}-${bab.title}`}>
              <h2 className="text-lg font-bold font-serif text-stone-900 text-center">
                BAB {toRoman(bab.number)}
                <span className="block text-base font-semibold text-stone-700 mt-1 uppercase tracking-wide">
                  {bab.title}
                </span>
              </h2>
              <div className="mt-6 space-y-6">
                {bab.articles.map((a) => (
                  <div key={`${a.pasalNumber}-${a.pasalTitle ?? ''}`}>
                    <h3 className="font-semibold text-stone-900 text-center">
                      Pasal {a.pasalNumber}
                      {a.pasalTitle && (
                        <span className="block text-sm font-normal text-stone-600">{a.pasalTitle}</span>
                      )}
                    </h3>
                    <p className="mt-2 text-stone-700 whitespace-pre-wrap leading-relaxed">
                      {a.content}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </article>
  );
}
