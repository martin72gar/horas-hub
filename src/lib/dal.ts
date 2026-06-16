import 'server-only';
import { db } from '@/db';
import { households, members, punguans, punguanUsers, users } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { auth } from '@/auth';

/**
 * Memverifikasi apakah pengguna yang login memiliki akses ke Punguan ini.
 * Akan melempar error jika tidak punya akses.
 * Mengembalikan role pengguna (KETUA, SEKRETARIS, BENDAHARA) jika bukan superadmin.
 */
export async function verifyTenantAccess(punguanId: string) {
  const session = await auth();
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
  const session = await auth();
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

// --- Contoh Data Access Helper yang aman (Tenant-Scoped) ---

export async function getHouseholds(punguanId: string) {
  await verifyTenantAccess(punguanId);
  return db.select().from(households).where(eq(households.punguanId, punguanId));
}
