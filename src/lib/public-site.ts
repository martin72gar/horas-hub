import 'server-only';
import { cache } from 'react';
import { and, desc, eq } from 'drizzle-orm';
import { db } from '@/db';
import {
  announcements,
  punguans,
  punguanUsers,
  statutes,
  users,
  type PublishedStatute,
} from '@/db/schema';

export const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? 'localhost:3000';

export function tenantUrl(slug: string) {
  const protocol = ROOT_DOMAIN.startsWith('localhost') ? 'http' : 'https';
  return `${protocol}://${slug}.${ROOT_DOMAIN}`;
}

/**
 * Satu-satunya pintu masuk data publik. Filter `landingPublished` ada di query
 * ini, bukan di komponen, supaya semua halaman publik ikut terlindungi.
 * Mengembalikan null kalau slug tidak ada ATAU landing page belum diterbitkan.
 */
export const getPublishedPunguan = cache(async (slug: string) => {
  const [punguan] = await db
    .select()
    .from(punguans)
    .where(and(eq(punguans.slug, slug), eq(punguans.landingPublished, true)))
    .limit(1);
  return punguan ?? null;
});

export async function getPublicAnnouncements(punguanId: string, limit = 5) {
  return db
    .select({
      id: announcements.id,
      title: announcements.title,
      content: announcements.content,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .where(and(eq(announcements.punguanId, punguanId), eq(announcements.isPublic, true)))
    .orderBy(desc(announcements.createdAt))
    .limit(limit);
}

/** Nama + jabatan saja. Email/telepon pengurus sengaja tidak diekspos. */
export async function getPengurus(punguanId: string) {
  return db
    .select({ name: users.name, role: punguanUsers.role })
    .from(punguanUsers)
    .innerJoin(users, eq(punguanUsers.userId, users.id))
    .where(eq(punguanUsers.punguanId, punguanId));
}

/** Snapshot terbit saja — draft tidak pernah bocor ke publik. */
export async function getPublishedStatutes(punguanId: string) {
  const rows = await db
    .select({
      type: statutes.type,
      publishedContent: statutes.publishedContent,
      publishedAt: statutes.publishedAt,
    })
    .from(statutes)
    .where(eq(statutes.punguanId, punguanId));

  return rows.filter(
    (r): r is typeof r & { publishedContent: PublishedStatute } => r.publishedContent != null
  );
}
