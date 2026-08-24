import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Mail, MapPin, Megaphone, Phone, ScrollText, Users } from 'lucide-react';
import { getPengurus, getPublicAnnouncements, getPublishedPunguan, getPublishedStatutes } from '@/lib/public-site';
import { STATUTE_LABELS } from '@/lib/statute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const punguan = await getPublishedPunguan(slug);
  if (!punguan) notFound();

  const [pengurus, berita, published] = await Promise.all([
    getPengurus(punguan.id),
    getPublicAnnouncements(punguan.id),
    getPublishedStatutes(punguan.id),
  ]);

  const hasKontak = punguan.contactPhone || punguan.contactEmail || punguan.contactAddress;

  return (
    <>
      <section className="bg-stone-900 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10" aria-hidden="true">
          <svg width="240" height="240" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,0 L100,100 M100,0 L0,100 M50,0 L50,100 M0,50 L100,50" stroke="#FF0000" strokeWidth="4" />
            <circle cx="50" cy="50" r="20" stroke="#FFFFFF" strokeWidth="2" fill="none" />
          </svg>
        </div>
        <div className="max-w-5xl mx-auto px-6 py-20 relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight">{punguan.name}</h1>
          {punguan.tagline && (
            <p className="mt-4 text-lg text-stone-300 max-w-2xl">{punguan.tagline}</p>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        {(punguan.about || punguan.description) && (
          <section>
            <h2 className="text-2xl font-bold font-serif text-stone-800 mb-4">Profil</h2>
            <p className="text-stone-700 whitespace-pre-wrap leading-relaxed max-w-3xl">
              {punguan.about || punguan.description}
            </p>
          </section>
        )}

        {published.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold font-serif text-stone-800 mb-4">Dasar Organisasi</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {published.map((s) => (
                <Link key={s.type} href={`/${s.type.toLowerCase()}`}>
                  <Card className="border-stone-200 shadow-sm hover:border-red-800 hover:shadow-md transition-all h-full">
                    <CardHeader className="pb-2">
                      <CardTitle className="flex items-center gap-2 text-lg text-stone-900">
                        <ScrollText className="h-5 w-5 text-red-800" />
                        {STATUTE_LABELS[s.type]}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-stone-500">
                      {s.publishedContent.articles.length} pasal
                      {s.publishedAt && (
                        <> · diterbitkan {s.publishedAt.toLocaleDateString('id-ID', { dateStyle: 'long' })}</>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {berita.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold font-serif text-stone-800 mb-4 flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-red-800" /> Pengumuman
            </h2>
            <div className="space-y-4">
              {berita.map((item) => (
                <Card key={item.id} className="border-stone-200 shadow-sm overflow-hidden">
                  <div className="h-1.5 w-full bg-red-800" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-stone-900">{item.title}</CardTitle>
                    <p className="text-xs text-stone-500">
                      {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: localeId })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-stone-700 whitespace-pre-wrap leading-relaxed">{item.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {pengurus.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold font-serif text-stone-800 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-red-800" /> Pengurus
            </h2>
            <div className="flex flex-wrap gap-3">
              {pengurus.map((p) => (
                <div
                  key={`${p.role}-${p.name}`}
                  className="bg-white border border-stone-200 rounded-lg px-4 py-3 shadow-sm"
                >
                  <p className="font-medium text-stone-900">{p.name}</p>
                  <Badge className="mt-1 bg-red-900 text-red-50">{p.role}</Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {hasKontak && (
          <section>
            <h2 className="text-2xl font-bold font-serif text-stone-800 mb-4">Kontak</h2>
            <ul className="space-y-2 text-stone-700">
              {punguan.contactPhone && (
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-red-800 flex-shrink-0" />
                  <a href={`tel:${punguan.contactPhone}`} className="hover:text-red-800">
                    {punguan.contactPhone}
                  </a>
                </li>
              )}
              {punguan.contactEmail && (
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-red-800 flex-shrink-0" />
                  <a href={`mailto:${punguan.contactEmail}`} className="hover:text-red-800">
                    {punguan.contactEmail}
                  </a>
                </li>
              )}
              {punguan.contactAddress && (
                <li className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-red-800 flex-shrink-0 mt-1" />
                  <span className="whitespace-pre-wrap">{punguan.contactAddress}</span>
                </li>
              )}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
