"use server"

import { transactionDb } from "@/db";
import { households, members } from "@/db/schema";
import { verifyTenantAccess } from "@/lib/dal";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createKK(punguanId: string, formData: FormData, anggota: any[]) {
  try {
    const role = await verifyTenantAccess(punguanId);
    if (role !== 'SUPERADMIN' && role !== 'SEKRETARIS') {
      throw new Error("Hanya Sekretaris yang berhak menambah data KK.");
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

    // Transaction to insert KK and Members
    await transactionDb.transaction(async (tx) => {
      const [kk] = await tx.insert(households).values({
        punguanId,
        headName,
        panggoaran,
        phone,
        address,
        sektor: sektor || null,
        pomparan: pomparan || null,
        nomorKeturunan,
      }).returning();

      // Insert Kepala Keluarga explicitly into members table
      await tx.insert(members).values({
        householdId: kk.id,
        punguanId,
        fullName: headName,
        relation: "KEPALA",
        gender: "L", // Assume L by default for KEPALA in MVP
        pomparan: pomparan || null,
        nomorKeturunan,
      });

      // Insert other valid members
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
              householdId: kk.id,
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
    return { error: error.message || "Gagal menyimpan data KK." };
  }

  revalidatePath(`/p/${punguanId}/kk`);
  redirect(`/p/${punguanId}/kk`);
}
