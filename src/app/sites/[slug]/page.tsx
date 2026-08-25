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
      <section className="relative flex min-h-[360px] items-center overflow-hidden bg-stone-950 text-white md:min-h-[430px]">
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-md"
          style={{ backgroundImage: "url('/images/tenant-hero-toba.webp')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-contain bg-top bg-no-repeat md:bg-center"
          style={{ backgroundImage: "url('/images/tenant-hero-toba.webp')" }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-stone-950/90 via-stone-900/55 to-stone-900/10"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto w-full max-w-[908px] self-stretch px-6 pt-10 md:pt-14">
          <h1 className="text-4xl md:text-5xl font-bold font-serif tracking-tight">{punguan.name}</h1>
          {punguan.tagline && (
            <p className="mt-4 text-lg text-stone-300 max-w-2xl">{punguan.tagline}</p>
          )}
        </div>
      </section>

      <div
        className="bg-[#f8f4ec] bg-cover bg-top"
        style={{ backgroundImage: "url('/images/tenant-content-texture.webp')" }}
      >
        <div className="mx-auto max-w-5xl space-y-12 px-6 py-12 md:py-16">
        {(punguan.about || punguan.description) && (
          <section className="rounded-2xl border border-stone-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-sm md:p-8">
            <h2 className="text-2xl font-bold font-serif text-stone-800 mb-4">Profil</h2>
            <p className="text-stone-700 whitespace-pre-wrap leading-relaxed max-w-3xl">
              {punguan.about || punguan.description}
            </p>
          </section>
        )}

        {published.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold font-serif text-stone-800 mb-4">Dasar Organisasi</h2>
            <Link href={`/${published[0].type.toLowerCase()}`} className="block sm:max-w-md">
              <Card className="border-stone-200 shadow-sm hover:border-red-800 hover:shadow-md transition-all h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg text-stone-900">
                    <ScrollText className="h-5 w-5 text-red-800" />
                    {published.map((s) => s.type).join(' & ')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-stone-500 space-y-1">
                  {published.map((s) => (
                    <p key={s.type}>
                      {STATUTE_LABELS[s.type]} · {s.publishedContent.articles.length} pasal
                      {s.publishedAt && (
                        <> · diterbitkan {s.publishedAt.toLocaleDateString('id-ID', { dateStyle: 'long' })}</>
                      )}
                    </p>
                  ))}
                </CardContent>
              </Card>
            </Link>
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
      </div>
    </>
  );
}
