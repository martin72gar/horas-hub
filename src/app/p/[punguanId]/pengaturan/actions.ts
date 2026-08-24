'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db } from '@/db';
import { punguans } from '@/db/schema';
import { verifyPengurusAccess } from '@/lib/dal';
import { validateSlug } from '@/lib/tenant-slug';

function trimOrNull(value: FormDataEntryValue | null) {
  const s = typeof value === 'string' ? value.trim() : '';
  return s === '' ? null : s;
}

export async function updateLandingSettings(punguanId: string, formData: FormData) {
  try {
    await verifyPengurusAccess(punguanId);

    const slug = trimOrNull(formData.get('slug'))?.toLowerCase() ?? null;
    const landingPublished = formData.get('landingPublished') === 'on';

    if (slug) {
      const slugError = validateSlug(slug);
      if (slugError) return { error: slugError };
    } else if (landingPublished) {
      return { error: 'Isi alamat landing page dulu sebelum menerbitkannya.' };
    }

    await db
      .update(punguans)
      .set({
        slug,
        landingPublished,
        tagline: trimOrNull(formData.get('tagline')),
        about: trimOrNull(formData.get('about')),
        contactPhone: trimOrNull(formData.get('contactPhone')),
        contactEmail: trimOrNull(formData.get('contactEmail')),
        contactAddress: trimOrNull(formData.get('contactAddress')),
        updatedAt: new Date(),
      })
      .where(eq(punguans.id, punguanId));
  } catch (error: unknown) {
    console.error(error);
    const message = error instanceof Error ? error.message : '';
    // Unique constraint pada punguans.slug
    if (/unique|duplicate key/i.test(message)) {
      return { error: 'Alamat tersebut sudah dipakai punguan lain.' };
    }
    return { error: message || 'Gagal menyimpan pengaturan.' };
  }

  revalidatePath(`/p/${punguanId}/pengaturan`);
  return { success: true };
}
