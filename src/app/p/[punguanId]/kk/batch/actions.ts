"use server"

import { transactionDb } from "@/db";
import { households, members } from "@/db/schema";
import { verifyTenantAccess } from "@/lib/dal";
import { revalidatePath } from "next/cache";

export async function createBatchKK(punguanId: string, rows: any[]) {
  try {
    const role = await verifyTenantAccess(punguanId);
    if (role !== 'SUPERADMIN' && role !== 'SEKRETARIS') {
      throw new Error("Hanya Sekretaris yang berhak menambah data KK.");
    }

    if (!rows || rows.length === 0) {
      return { error: "Data batch kosong." };
    }

    await transactionDb.transaction(async (tx) => {
      for (const row of rows) {
        const headName = row.headName?.trim();
        if (!headName) continue;

        let nomorKeturunanVal: number | null = null;
        if (row.nomorKeturunan) {
          const cleaned = String(row.nomorKeturunan).replace(/[^\d]/g, '');
          if (cleaned) {
            const parsed = parseInt(cleaned, 10);
            if (!isNaN(parsed)) {
              nomorKeturunanVal = parsed;
            }
          }
        }

        // Insert KK
        const [kk] = await tx.insert(households).values({
          punguanId,
          headName,
          panggoaran: row.panggoaran?.trim() || null,
          sektor: row.sektor?.trim() || null,
          pomparan: row.pomparan?.trim() || null,
          nomorKeturunan: nomorKeturunanVal,
          phone: row.phone?.trim() || null,
          address: row.address?.trim() || null,
        }).returning();

        // Insert KEPALA member
        await tx.insert(members).values({
          householdId: kk.id,
          punguanId,
          fullName: headName,
          relation: "KEPALA",
          gender: "L", // default assumption for KEPALA
        });

        // Insert ISTRI if provided
        if (row.wifeName && row.wifeName.trim() !== "") {
          await tx.insert(members).values({
            householdId: kk.id,
            punguanId,
            fullName: row.wifeName.trim(),
            relation: "ISTRI",
            gender: "P",
          });
        }
      }
    });

  } catch (error: any) {
    console.error(error);
    return { error: error.message || "Gagal menyimpan batch data." };
  }

  revalidatePath(`/p/${punguanId}/kk`);
  return { success: true };
}
