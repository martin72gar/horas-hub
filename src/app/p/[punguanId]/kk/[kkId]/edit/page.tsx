import { verifyTenantAccess } from "@/lib/dal";
import { db } from "@/db";
import { households, members } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import EditKKForm from "./EditKKForm";

export default async function EditKKPage({ params }: { params: Promise<{ punguanId: string, kkId: string }> }) {
  const resolvedParams = await params;
  const { punguanId, kkId } = resolvedParams;
  await verifyTenantAccess(punguanId);

  const [kk] = await db.select().from(households).where(and(eq(households.id, kkId), eq(households.punguanId, punguanId))).limit(1);

  if (!kk) {
    redirect(`/p/${punguanId}/kk`);
  }

  // Get all members, we will let the form handle KEPALA separately or filter it out.
  const rawMembers = await db.select().from(members).where(eq(members.householdId, kk.id)).orderBy(members.createdAt);
  const existingAnggota = rawMembers.filter(m => m.relation !== 'KEPALA');

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-stone-800 tracking-tight font-serif">Edit Data KK</h2>
        <p className="text-stone-500 mt-1">Perbarui informasi Kepala Keluarga beserta anggota keluarganya.</p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-stone-200">
        <EditKKForm punguanId={punguanId} kk={kk} existingAnggota={existingAnggota} />
      </div>
    </div>
  );
}
