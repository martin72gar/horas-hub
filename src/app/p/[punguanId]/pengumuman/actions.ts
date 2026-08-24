'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { announcements } from '@/db/schema';
import { getCurrentSession, verifyPengurusAccess } from '@/lib/dal';


export async function createAnnouncement(punguanId: string, formData: FormData) {
  try {
    await verifyPengurusAccess(punguanId);
    const session = await getCurrentSession();
    if (!session?.user?.id) throw new Error('Unauthorized');

    const title = String(formData.get('title') ?? '').trim();
    const content = String(formData.get('content') ?? '').trim();
    if (!title) return { error: 'Judul pengumuman wajib diisi.' };
    if (!content) return { error: 'Isi pengumuman wajib diisi.' };

    await db.insert(announcements).values({
      punguanId,
      title,
      content,
      isPublic: formData.get('isPublic') === 'on',
      createdBy: session.user.id,
    });
  } catch (error: unknown) {
    console.error(error);
    return { error: error instanceof Error ? error.message : 'Gagal menyimpan pengumuman.' };
  }
  revalidatePath(`/p/${punguanId}/pengumuman`);
  return { success: true as const };
}

export async function toggleAnnouncementPublic(punguanId: string, id: string, isPublic: boolean) {
  try {
    await verifyPengurusAccess(punguanId);
    // id datang dari klien — batasi update ke punguan ini lewat WHERE.
    await db
      .update(announcements)
      .set({ isPublic, updatedAt: new Date() })
      .where(and(eq(announcements.id, id), eq(announcements.punguanId, punguanId)));
  } catch (error: unknown) {
    console.error(error);
    return { error: error instanceof Error ? error.message : 'Gagal mengubah status pengumuman.' };
  }
  revalidatePath(`/p/${punguanId}/pengumuman`);
  return { success: true as const };
}

export async function deleteAnnouncement(punguanId: string, id: string) {
  try {
    await verifyPengurusAccess(punguanId);
    await db
      .delete(announcements)
      .where(and(eq(announcements.id, id), eq(announcements.punguanId, punguanId)));
  } catch (error: unknown) {
    console.error(error);
    return { error: error instanceof Error ? error.message : 'Gagal menghapus pengumuman.' };
  }
  revalidatePath(`/p/${punguanId}/pengumuman`);
  return { success: true as const };
}
