"use server"

import { db } from "@/db";
import { households, members } from "@/db/schema";
import { verifyTenantAccess } from "@/lib/dal";
import { eq, and, not } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function updateKK(punguanId: string, kkId: string, formData: FormData, anggota: any[]) {
  try {
    const role = await verifyTenantAccess(punguanId);
    if (role !== 'SUPERADMIN' && role !== 'SEKRETARIS') {
      throw new Error("Hanya Sekretaris yang berhak mengubah data KK.");
    }

    const headName = formData.get("headName") as string;
    const panggoaran = formData.get("panggoaran") as string;
    const phone = formData.get("phone") as string;
    const address = formData.get("address") as string;

    if (!headName) return { error: "Nama Kepala Keluarga wajib diisi." };

    // Transaction to update KK and Members
    await db.transaction(async (tx) => {
      // Update KK
      await tx.update(households)
        .set({ headName, panggoaran, phone, address, updatedAt: new Date() })
        .where(and(eq(households.id, kkId), eq(households.punguanId, punguanId)));

      // Update KEPALA relation name
      await tx.update(members)
        .set({ fullName: headName })
        .where(and(eq(members.householdId, kkId), eq(members.relation, 'KEPALA')));

      // Delete non-KEPALA members
      await tx.delete(members)
        .where(and(eq(members.householdId, kkId), not(eq(members.relation, 'KEPALA'))));

      // Re-insert valid non-KEPALA members
      const validAnggota = anggota.filter(a => a.fullName && a.fullName.trim() !== "");
      if (validAnggota.length > 0) {
        await tx.insert(members).values(
          validAnggota.map(a => ({
            householdId: kkId,
            punguanId,
            fullName: a.fullName,
            relation: a.relation,
            gender: a.gender,
          }))
        );
      }
    });

  } catch (error: any) {
    console.error(error);
    return { error: error.message || "Gagal mengubah data KK." };
  }

  revalidatePath(`/p/${punguanId}/kk`);
  revalidatePath(`/p/${punguanId}/kk/${kkId}`);
  redirect(`/p/${punguanId}/kk/${kkId}`);
}
