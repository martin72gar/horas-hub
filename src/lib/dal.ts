import 'server-only';
import { db } from '@/db';
import { households, members, punguans, punguanUsers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';
import type { Session } from 'next-auth';
import { cache } from 'react';

type AuthSession = Session | null;

export const getCurrentSession = cache(async () => auth());

/**
 * Memverifikasi apakah pengguna yang login memiliki akses ke Punguan ini.
 * Akan melempar error jika tidak punya akses.
 * Mengembalikan role pengguna (KETUA, SEKRETARIS, BENDAHARA) jika bukan superadmin.
 */
export async function verifyTenantAccess(punguanId: string) {
  const session = await getCurrentSession();
  return verifyTenantAccessForSession(punguanId, session);
}

export async function verifyTenantAccessForSession(punguanId: string, session: AuthSession) {
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  if ((session.user as any).isSuperadmin) {
    return 'SUPERADMIN';
  }

  const access = await db.select()
    .from(punguanUsers)
    .where(
      and(
        eq(punguanUsers.userId, session.user.id),
        eq(punguanUsers.punguanId, punguanId)
      )
    )
    .limit(1);

  if (access.length === 0) {
    throw new Error('Forbidden: Anda tidak memiliki akses ke Punguan ini.');
  }

  return access[0].role;
}

/**
 * Mendapatkan daftar Punguan yang bisa diakses oleh user saat ini
 */
export async function getUserPunguans() {
  const session = await getCurrentSession();
  if (!session?.user?.id) return [];

  if ((session.user as any).isSuperadmin) {
    return db.select().from(punguans);
  }

  const userAccesses = await db.select({
    punguan: punguans
  })
  .from(punguanUsers)
  .innerJoin(punguans, eq(punguanUsers.punguanId, punguans.id))
  .where(eq(punguanUsers.userId, session.user.id));

  return userAccesses.map(a => a.punguan);
}

/**
 * Ketua, Sekretaris, dan Superadmin boleh mengelola konten punguan
 * (landing page, AD/ART, pengumuman). Bendahara tidak.
 */
export function isPengurusRole(role: string) {
  return role === 'SUPERADMIN' || role === 'KETUA' || role === 'SEKRETARIS';
}

export async function verifyPengurusAccess(punguanId: string) {
  const role = await verifyTenantAccess(punguanId);
  if (!isPengurusRole(role)) {
    throw new Error('Hanya Ketua atau Sekretaris yang berhak melakukan tindakan ini.');
  }
  return role;
}

// --- Contoh Data Access Helper yang aman (Tenant-Scoped) ---

export async function getHouseholds(punguanId: string) {
  await verifyTenantAccess(punguanId);
  return db.select().from(households).where(eq(households.punguanId, punguanId));
}
