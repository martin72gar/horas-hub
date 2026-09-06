import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  ArrowDown,
  Church,
  ExternalLink,
  FileDown,
  HeartHandshake,
  Mail,
  MapPin,
  Megaphone,
  MessageCircle,
  PartyPopper,
  Phone,
  PiggyBank,
  ScrollText,
  Users,
} from 'lucide-react';
import { getPengurus, getPublicAnnouncements, getPublishedPunguan, getPublishedStatutes } from '@/lib/public-site';
import { STATUTE_LABELS } from '@/lib/statute';
import { groupPengurus, inisial, mapsLink, waLink } from '@/lib/landing';
import type { PengurusEntry } from '@/db/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CARD = 'rounded-2xl border border-stone-200/80 bg-white/90 shadow-md shadow-stone-900/5 backdrop-blur-sm';

/**
 * Kegiatan rutin dikenali dari kata kunci di teks profil.
 * ponytail: teks profil bebas diisi pengurus, jadi tidak ada kolom kegiatan —
 * cukup cocokkan kata kunci. Tambah kolom sendiri kalau chip ini perlu diatur.
 */
const KEGIATAN = [
  { kata: ['partangiangan', 'ibadah', 'kebaktian'], label: 'Partangiangan', Icon: Church },
  { kata: ['arisan', 'tabungan'], label: 'Arisan', Icon: PiggyBank },
  { kata: ['duka', 'santunan'], label: 'Santunan duka', Icon: HeartHandshake },
  { kata: ['ulaon', 'pesta', 'adat'], label: 'Ulaon adat', Icon: PartyPopper },
  { kata: ['naposo', 'pemuda', 'remaja'], label: 'Naposo', Icon: Users },
];

function PengurusCard({ entry }: { entry: PengurusEntry }) {
  return (
    <div className={`${CARD} flex gap-4 p-5`}>
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-red-900 font-serif text-sm font-bold text-red-50">
        {inisial(entry.orang[0] ?? '')}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-red-800">{entry.jabatan}</p>
        {entry.wilayah && <p className="mt-0.5 text-xs text-stone-500">{entry.wilayah}</p>}
        <ul className="mt-1.5 space-y-0.5 font-serif text-stone-900">
          {entry.orang.map((nama) => (
            <li key={nama}>{nama}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const punguan = await getPublishedPunguan(slug);
  if (!punguan) notFound();

  const [pengurus, berita, published] = await Promise.all([
    getPengurus(punguan.id),
    getPublicAnnouncements(punguan.id),
    getPublishedStatutes(punguan.id),
  ]);

  const struktur = punguan.pengurus;
  const profil = punguan.about || punguan.description;
  const hasKontak = punguan.contactPhone || punguan.contactEmail || punguan.contactAddress;
  const kegiatan = profil
    ? KEGIATAN.filter((k) => k.kata.some((w) => profil.toLowerCase().includes(w)))
    : [];
  const { harian, komisaris, penasehat } = groupPengurus(struktur?.entries ?? []);
  const wa = punguan.contactPhone ? waLink(punguan.contactPhone) : null;

  return (
    <>
      <section className="relative flex min-h-[420px] items-center overflow-hidden bg-stone-950 text-white md:min-h-[520px]">
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
          className="absolute inset-0 bg-gradient-to-r from-stone-950/95 via-stone-900/70 to-stone-900/20"
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto w-full max-w-[908px] px-6 py-14 md:py-20">
          <h1 className="font-serif text-5xl font-bold tracking-tight drop-shadow-md md:text-6xl">
            {punguan.name}
          </h1>
          {punguan.tagline && (
            <p className="mt-5 max-w-2xl text-lg text-stone-200 drop-shadow md:text-xl">
              {punguan.tagline}
            </p>
          )}
          {profil && (
            <Link
              href="#profil"
              className="mt-8 inline-flex items-center gap-2 rounded-full bg-red-800 px-6 py-3 text-sm font-medium text-white shadow-lg shadow-red-950/30 transition-colors hover:bg-red-700"
            >
              Kenali Lebih Lanjut <ArrowDown className="h-4 w-4" />
            </Link>
          )}
        </div>
      </section>

      <div
        className="bg-[#f8f4ec] bg-cover bg-top"
        style={{ backgroundImage: "url('/images/tenant-content-texture.webp')" }}
      >
        <div className="mx-auto max-w-5xl space-y-12 px-6 py-12 md:py-16">
        {profil && (
          <section id="profil" className={`${CARD} scroll-mt-24 overflow-hidden md:grid md:grid-cols-[minmax(0,17rem)_1fr]`}>
            <div
              className="hidden bg-cover bg-center md:block"
              style={{ backgroundImage: "url('/images/tenant-hero-toba.webp')" }}
              aria-hidden="true"
            />
            <div className="p-6 md:p-8">
              <h2 className="mb-4 font-serif text-2xl font-bold text-stone-800">Profil</h2>
              <p className="whitespace-pre-wrap leading-relaxed text-stone-700">{profil}</p>
              {kegiatan.length > 0 && (
                <ul className="mt-6 flex flex-wrap gap-2">
                  {kegiatan.map(({ label, Icon }) => (
                    <li
                      key={label}
                      className="flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1.5 text-sm text-stone-700"
                    >
                      <Icon className="h-4 w-4 text-red-800" /> {label}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {published.length > 0 && (
          <section>
            <h2 className="mb-4 font-serif text-2xl font-bold text-stone-800">Dasar Organisasi</h2>
            <Link href={`/${published[0].type.toLowerCase()}`} className="block sm:max-w-md">
              <Card className="h-full border-stone-200 shadow-md shadow-stone-900/5 transition-all hover:border-red-800 hover:shadow-lg">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg text-stone-900">
                    <ScrollText className="h-5 w-5 text-red-800" />
                    {published.map((s) => s.type).join(' & ')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-stone-500">
                  {published.map((s) => (
                    <p key={s.type}>
                      {STATUTE_LABELS[s.type]} · {s.publishedContent.articles.length} pasal
                      {s.publishedAt && (
                        <> · diterbitkan {s.publishedAt.toLocaleDateString('id-ID', { dateStyle: 'long' })}</>
                      )}
                    </p>
                  ))}
                  <p className="flex items-center gap-1.5 pt-2 font-medium text-red-800">
                    <FileDown className="h-4 w-4" /> Baca &amp; unduh dokumen
                  </p>
                </CardContent>
              </Card>
            </Link>
          </section>
        )}

        {berita.length > 0 && (
          <section>
            <h2 className="mb-4 flex items-center gap-2 font-serif text-2xl font-bold text-stone-800">
              <Megaphone className="h-5 w-5 text-red-800" /> Pengumuman
            </h2>
            <div className="space-y-4">
              {berita.map((item) => (
                <Card
                  key={item.id}
                  className="overflow-hidden border-stone-200 shadow-md shadow-stone-900/5"
                >
                  <div className="h-1.5 w-full bg-red-800" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg text-stone-900">{item.title}</CardTitle>
                    <p className="text-xs text-stone-500">
                      {formatDistanceToNow(item.createdAt, { addSuffix: true, locale: localeId })}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap leading-relaxed text-stone-700">{item.content}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {(struktur || pengurus.length > 0) && (
          <section id="pengurus" className="scroll-mt-24">
            <h2 className="flex items-center gap-2 font-serif text-2xl font-bold text-stone-800">
              <Users className="h-5 w-5 text-red-800" /> Pengurus
            </h2>
            {struktur ? (
              <div className="space-y-10">
                <p className="mt-1 text-sm text-stone-500">
                  {struktur.judul ? `${struktur.judul} · ` : ''}Periode {struktur.periode}
                </p>

                {harian.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Pengurus Harian
                    </h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {harian.map((e, i) => (
                        <PengurusCard key={`${e.jabatan}-${i}`} entry={e} />
                      ))}
                    </div>
                  </div>
                )}

                {komisaris.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Komisaris Wilayah
                    </h3>
                    <ul className={`${CARD} mt-4 grid divide-y divide-stone-200 sm:grid-cols-2 sm:divide-y-0`}>
                      {komisaris.map((e, i) => (
                        <li key={`${e.jabatan}-${i}`} className="p-4 sm:p-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-red-800">
                            {e.jabatan}
                          </p>
                          {e.wilayah && <p className="text-sm text-stone-500">{e.wilayah}</p>}
                          <ul className="mt-1 space-y-0.5 font-serif text-stone-900">
                            {e.orang.map((nama) => (
                              <li key={nama}>{nama}</li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {penasehat.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                      Penasehat
                    </h3>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      {penasehat.map((e, i) => (
                        <PengurusCard key={`${e.jabatan}-${i}`} entry={e} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-4 flex flex-wrap gap-3">
                {pengurus.map((p) => (
                  <div key={`${p.role}-${p.name}`} className={`${CARD} px-4 py-3`}>
                    <p className="font-medium text-stone-900">{p.name}</p>
                    <Badge className="mt-1 bg-red-900 text-red-50">{p.role}</Badge>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {hasKontak && (
          <section id="kontak" className="scroll-mt-24">
            <h2 className="mb-4 font-serif text-2xl font-bold text-stone-800">Kontak</h2>
            <div className="flex flex-wrap gap-3">
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-700 px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-emerald-950/20 transition-colors hover:bg-emerald-600"
                >
                  <MessageCircle className="h-4 w-4" /> Chat WhatsApp
                </a>
              )}
              {punguan.contactPhone && (
                <a
                  href={`tel:${punguan.contactPhone}`}
                  className={`${CARD} inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-stone-700 transition-colors hover:border-red-800 hover:text-red-800`}
                >
                  <Phone className="h-4 w-4 text-red-800" /> {punguan.contactPhone}
                </a>
              )}
              {punguan.contactEmail && (
                <a
                  href={`mailto:${punguan.contactEmail}`}
                  className={`${CARD} inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm text-stone-700 transition-colors hover:border-red-800 hover:text-red-800`}
                >
                  <Mail className="h-4 w-4 text-red-800" /> {punguan.contactEmail}
                </a>
              )}
            </div>
            {punguan.contactAddress && (
              <div className={`${CARD} mt-4 flex items-start gap-3 p-5 sm:max-w-md`}>
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-800" />
                <div>
                  <p className="whitespace-pre-wrap text-stone-700">{punguan.contactAddress}</p>
                  <a
                    href={mapsLink(punguan.contactAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-red-800 hover:underline"
                  >
                    Buka di Google Maps <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            )}
          </section>
        )}
        </div>
      </div>
    </>
  );
}
