import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { punguans } from '@/db/schema';
import { isPengurusRole, verifyTenantAccess } from '@/lib/dal';
import { ROOT_DOMAIN } from '@/lib/public-site';
import PengaturanForm from './PengaturanForm';

export default async function PengaturanPage({
  params,
}: {
  params: Promise<{ punguanId: string }>;
}) {
  const { punguanId } = await params;
  const role = await verifyTenantAccess(punguanId);

  const [punguan] = await db.select().from(punguans).where(eq(punguans.id, punguanId)).limit(1);
  if (!punguan) notFound();

  const canEdit = isPengurusRole(role);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">
          Pengaturan Landing Page
        </h2>
        <p className="text-stone-500 mt-1">
          Alamat, profil, dan kontak yang tampil di halaman publik punguan.
        </p>
      </div>

      {canEdit ? (
        <PengaturanForm punguan={punguan} rootDomain={ROOT_DOMAIN} />
      ) : (
        <div className="p-12 text-center bg-white border border-stone-200 rounded-xl shadow-sm">
          <p className="text-stone-500">
            Hanya Ketua atau Sekretaris yang dapat mengubah pengaturan landing page.
          </p>
        </div>
      )}
    </div>
  );
}
