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
    const sektor = formData.get("sektor") as string;
    const pomparan = formData.get("pomparan") as string;
    const nomorKeturunanStr = formData.get("nomorKeturunan") as string;
    const nomorKeturunan = nomorKeturunanStr ? parseInt(nomorKeturunanStr, 10) : null;

    if (!headName) return { error: "Nama Kepala Keluarga wajib diisi." };

    // Transaction to update KK and Members
    await db.transaction(async (tx) => {
      // Update KK
      await tx.update(households)
        .set({ headName, panggoaran, phone, address, sektor: sektor || null, pomparan: pomparan || null, nomorKeturunan, updatedAt: new Date() })
        .where(and(eq(households.id, kkId), eq(households.punguanId, punguanId)));

      // Update KEPALA relation name
      await tx.update(members)
        .set({ fullName: headName, pomparan: pomparan || null, nomorKeturunan })
        .where(and(eq(members.householdId, kkId), eq(members.relation, 'KEPALA')));

      // Delete non-KEPALA members
      await tx.delete(members)
        .where(and(eq(members.householdId, kkId), not(eq(members.relation, 'KEPALA'))));

      // Re-insert valid non-KEPALA members
      const validAnggota = anggota.filter(a => a.fullName && a.fullName.trim() !== "");
      if (validAnggota.length > 0) {
        await tx.insert(members).values(
          validAnggota.map(a => {
            let mPomparan = a.pomparan?.trim() || null;
            let mNomor = a.nomorKeturunan ? parseInt(a.nomorKeturunan, 10) : null;
            
            if (a.relation === "ANAK" && !mPomparan && !mNomor) {
              mPomparan = pomparan || null;
              mNomor = nomorKeturunan ? nomorKeturunan + 1 : null;
            }

            return {
              householdId: kkId,
              punguanId,
              fullName: a.fullName,
              relation: a.relation,
              gender: a.gender,
              pomparan: mPomparan,
              nomorKeturunan: mNomor,
            };
          })
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
