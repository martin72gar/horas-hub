'use server';

import { and, asc, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { statuteArticles, statutes, type PublishedStatute } from '@/db/schema';
import { getCurrentSession, verifyPengurusAccess } from '@/lib/dal';
import { STATUTE_LABELS, type StatuteType } from '@/lib/statute';


/**
 * statuteId datang dari klien — selalu buktikan dokumennya milik punguan ini
 * sebelum menulis apa pun. verifyTenantAccess saja tidak cukup.
 */
async function assertStatuteOwned(punguanId: string, statuteId: string) {
  const [row] = await db
    .select({ id: statutes.id })
    .from(statutes)
    .where(and(eq(statutes.id, statuteId), eq(statutes.punguanId, punguanId)))
    .limit(1);
  if (!row) throw new Error('Dokumen tidak ditemukan pada punguan ini.');
}

async function assertArticleOwned(punguanId: string, articleId: string) {
  const [row] = await db
    .select({ id: statuteArticles.id })
    .from(statuteArticles)
    .innerJoin(statutes, eq(statuteArticles.statuteId, statutes.id))
    .where(and(eq(statuteArticles.id, articleId), eq(statutes.punguanId, punguanId)))
    .limit(1);
  if (!row) throw new Error('Pasal tidak ditemukan pada punguan ini.');
}

/** Membuat dokumen kosong saat pengurus pertama kali menyusun AD atau ART. */
export async function createStatute(punguanId: string, type: StatuteType, punguanName: string) {
  try {
    await verifyPengurusAccess(punguanId);
    if (type !== 'AD' && type !== 'ART') throw new Error('Jenis dokumen tidak dikenal.');

    const existing = await db
      .select({ id: statutes.id })
      .from(statutes)
      .where(and(eq(statutes.punguanId, punguanId), eq(statutes.type, type)))
      .limit(1);
    if (existing.length > 0) return { success: true as const };

    await db.insert(statutes).values({
      punguanId,
      type,
      title: `${STATUTE_LABELS[type]} ${punguanName}`,
    });
  } catch (error: unknown) {
    console.error(error);
    return { error: error instanceof Error ? error.message : 'Gagal membuat dokumen.' };
  }
  revalidatePath(`/p/${punguanId}/ad-art`);
  return { success: true as const };
}

export async function updateStatuteMeta(punguanId: string, statuteId: string, formData: FormData) {
  try {
    await verifyPengurusAccess(punguanId);
    await assertStatuteOwned(punguanId, statuteId);

    const title = String(formData.get('title') ?? '').trim();
    if (!title) return { error: 'Judul dokumen wajib diisi.' };
    const preamble = String(formData.get('preamble') ?? '').trim();

    await db
      .update(statutes)
      .set({ title, preamble: preamble || null, updatedAt: new Date() })
      .where(eq(statutes.id, statuteId));
  } catch (error: unknown) {
    console.error(error);
    return { error: error instanceof Error ? error.message : 'Gagal menyimpan dokumen.' };
  }
  revalidatePath(`/p/${punguanId}/ad-art`);
  return { success: true as const };
}

export async function upsertArticle(
  punguanId: string,
  statuteId: string,
  articleId: string | null,
  formData: FormData
) {
  try {
    await verifyPengurusAccess(punguanId);
    await assertStatuteOwned(punguanId, statuteId);
    if (articleId) await assertArticleOwned(punguanId, articleId);

    const babNumber = Number(formData.get('babNumber'));
    const pasalNumber = Number(formData.get('pasalNumber'));
    const babTitle = String(formData.get('babTitle') ?? '').trim();
    const pasalTitle = String(formData.get('pasalTitle') ?? '').trim();
    const content = String(formData.get('content') ?? '').trim();

    if (!Number.isInteger(babNumber) || babNumber < 1) return { error: 'Nomor BAB harus angka mulai dari 1.' };
    if (!Number.isInteger(pasalNumber) || pasalNumber < 1) return { error: 'Nomor Pasal harus angka mulai dari 1.' };
    if (!babTitle) return { error: 'Judul BAB wajib diisi.' };
    if (!content) return { error: 'Isi pasal wajib diisi.' };

    const values = {
      babNumber,
      babTitle,
      pasalNumber,
      pasalTitle: pasalTitle || null,
      content,
      updatedAt: new Date(),
    };

    if (articleId) {
      await db.update(statuteArticles).set(values).where(eq(statuteArticles.id, articleId));
    } else {
      await db.insert(statuteArticles).values({ statuteId, ...values });
    }
  } catch (error: unknown) {
    console.error(error);
    return { error: error instanceof Error ? error.message : 'Gagal menyimpan pasal.' };
  }
  revalidatePath(`/p/${punguanId}/ad-art`);
  return { success: true as const };
}

export async function deleteArticle(punguanId: string, articleId: string) {
  try {
    await verifyPengurusAccess(punguanId);
    await assertArticleOwned(punguanId, articleId);
    await db.delete(statuteArticles).where(eq(statuteArticles.id, articleId));
  } catch (error: unknown) {
    console.error(error);
    return { error: error instanceof Error ? error.message : 'Gagal menghapus pasal.' };
  }
  revalidatePath(`/p/${punguanId}/ad-art`);
  return { success: true as const };
}

/** Membekukan draft jadi snapshot yang dibaca halaman publik. */
export async function publishStatute(punguanId: string, statuteId: string) {
  try {
    await verifyPengurusAccess(punguanId);
    await assertStatuteOwned(punguanId, statuteId);

    const [doc] = await db.select().from(statutes).where(eq(statutes.id, statuteId)).limit(1);
    if (!doc) throw new Error('Dokumen tidak ditemukan.');

    const articles = await db
      .select({
        babNumber: statuteArticles.babNumber,
        babTitle: statuteArticles.babTitle,
        pasalNumber: statuteArticles.pasalNumber,
        pasalTitle: statuteArticles.pasalTitle,
        content: statuteArticles.content,
      })
      .from(statuteArticles)
      .where(eq(statuteArticles.statuteId, statuteId))
      .orderBy(asc(statuteArticles.babNumber), asc(statuteArticles.pasalNumber));

    if (articles.length === 0) {
      return { error: 'Tambahkan minimal satu pasal sebelum menerbitkan.' };
    }

    const snapshot: PublishedStatute = {
      title: doc.title,
      preamble: doc.preamble,
      articles,
    };

    const session = await getCurrentSession();
    // Satu timestamp untuk keduanya: kalau updatedAt lebih baru walau 1ms,
    // badge langsung salah menandai "ada perubahan belum diterbitkan".
    const now = new Date();
    await db
      .update(statutes)
      .set({
        publishedContent: snapshot,
        publishedAt: now,
        publishedBy: session?.user?.id ?? null,
        updatedAt: now,
      })
      .where(eq(statutes.id, statuteId));
  } catch (error: unknown) {
    console.error(error);
    return { error: error instanceof Error ? error.message : 'Gagal menerbitkan dokumen.' };
  }
  revalidatePath(`/p/${punguanId}/ad-art`);
  return { success: true as const };
}

/** Menarik dokumen dari halaman publik tanpa menghapus draft. */
export async function unpublishStatute(punguanId: string, statuteId: string) {
  try {
    await verifyPengurusAccess(punguanId);
    await assertStatuteOwned(punguanId, statuteId);
    await db
      .update(statutes)
      .set({ publishedContent: null, publishedAt: null, publishedBy: null, updatedAt: new Date() })
      .where(eq(statutes.id, statuteId));
  } catch (error: unknown) {
    console.error(error);
    return { error: error instanceof Error ? error.message : 'Gagal menarik dokumen.' };
  }
  revalidatePath(`/p/${punguanId}/ad-art`);
  return { success: true as const };
}
