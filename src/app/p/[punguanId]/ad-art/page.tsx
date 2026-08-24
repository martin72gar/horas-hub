import Link from 'next/link';
import { and, asc, eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { ScrollText } from 'lucide-react';
import { db } from '@/db';
import { punguans, statuteArticles, statutes } from '@/db/schema';
import { isPengurusRole, verifyTenantAccess } from '@/lib/dal';
import { tenantUrl } from '@/lib/public-site';
import { parseStatuteType, STATUTE_LABELS, type StatuteType } from '@/lib/statute';
import StatuteEditor from './StatuteEditor';
import CreateStatuteButton from './CreateStatuteButton';

const TABS: StatuteType[] = ['AD', 'ART'];

export default async function AdArtPage({
  params,
  searchParams,
}: {
  params: Promise<{ punguanId: string }>;
  searchParams: Promise<{ jenis?: string }>;
}) {
  const { punguanId } = await params;
  const { jenis } = await searchParams;
  const role = await verifyTenantAccess(punguanId);
  const canEdit = isPengurusRole(role);

  const type = parseStatuteType(jenis ?? 'AD');
  if (!type) notFound();

  const [punguan] = await db.select().from(punguans).where(eq(punguans.id, punguanId)).limit(1);
  if (!punguan) notFound();

  const [doc] = await db
    .select()
    .from(statutes)
    .where(and(eq(statutes.punguanId, punguanId), eq(statutes.type, type)))
    .limit(1);

  const articles = doc
    ? await db
        .select()
        .from(statuteArticles)
        .where(eq(statuteArticles.statuteId, doc.id))
        .orderBy(asc(statuteArticles.babNumber), asc(statuteArticles.pasalNumber))
    : [];

  // "Ada perubahan belum diterbitkan" = ada yang tersentuh setelah publish terakhir.
  const lastDraftChange = articles.reduce<Date>(
    (latest, a) => (a.updatedAt > latest ? a.updatedAt : latest),
    doc?.updatedAt ?? new Date(0)
  );
  const hasUnpublishedChanges =
    !!doc?.publishedAt && lastDraftChange.getTime() > doc.publishedAt.getTime();

  const publicUrl =
    punguan.slug && punguan.landingPublished
      ? `${tenantUrl(punguan.slug)}/${type.toLowerCase()}`
      : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">AD &amp; ART</h2>
        <p className="text-stone-500 mt-1">
          Susun Anggaran Dasar dan Anggaran Rumah Tangga, lalu terbitkan ke landing page.
        </p>
      </div>

      <div className="flex gap-2 border-b border-stone-200">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/p/${punguanId}/ad-art?jenis=${t.toLowerCase()}`}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              t === type
                ? 'border-red-800 text-red-900'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {STATUTE_LABELS[t]}
          </Link>
        ))}
      </div>

      {!canEdit ? (
        <div className="p-12 text-center bg-white border border-stone-200 rounded-xl shadow-sm">
          <p className="text-stone-500">Hanya Ketua atau Sekretaris yang dapat mengelola AD/ART.</p>
        </div>
      ) : !doc ? (
        <div className="p-12 text-center bg-white border border-stone-200 border-dashed rounded-xl">
          <ScrollText className="w-12 h-12 text-stone-300 mx-auto mb-4" />
          <p className="text-stone-500 mb-6">
            {STATUTE_LABELS[type]} belum disusun untuk punguan ini.
          </p>
          <CreateStatuteButton punguanId={punguanId} type={type} punguanName={punguan.name} />
        </div>
      ) : (
        <StatuteEditor
          punguanId={punguanId}
          statute={{
            id: doc.id,
            type,
            title: doc.title,
            preamble: doc.preamble,
            preambleTitle: doc.preambleTitle,
            preamblePublished: doc.preamblePublished,
            publishedAt: doc.publishedAt,
            isPublished: doc.publishedContent != null,
          }}
          articles={articles.map((a) => ({
            id: a.id,
            babNumber: a.babNumber,
            babTitle: a.babTitle,
            pasalNumber: a.pasalNumber,
            pasalTitle: a.pasalTitle,
            content: a.content,
          }))}
          hasUnpublishedChanges={hasUnpublishedChanges}
          publicUrl={publicUrl}
        />
      )}
    </div>
  );
}
