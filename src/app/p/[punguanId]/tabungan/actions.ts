"use server"

import { db } from "@/db";
import { tabunganFunds } from "@/db/schema";
import { verifyBendaharaAccess } from "@/lib/dal";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

function bacaForm(formData: FormData) {
  const name = (formData.get("name") as string)?.trim();
  const targetYearStr = formData.get("targetYear") as string;
  const targetAmountStr = formData.get("targetAmount") as string;

  return {
    name,
    description: (formData.get("description") as string)?.trim() || null,
    targetEvent: (formData.get("targetEvent") as string)?.trim() || null,
    targetYear: targetYearStr ? parseInt(targetYearStr, 10) : null,
    targetAmount: targetAmountStr ? parseInt(targetAmountStr, 10) : null,
    bankName: (formData.get("bankName") as string)?.trim() || null,
    bankAccount: (formData.get("bankAccount") as string)?.trim() || null,
    status: (formData.get("status") as "AKTIF" | "SELESAI") || "AKTIF",
  };
}

export async function createFund(punguanId: string, formData: FormData) {
  try {
    await verifyBendaharaAccess(punguanId);

    const values = bacaForm(formData);
    if (!values.name) return { error: "Nama dana wajib diisi." };
    if (values.targetAmount !== null && values.targetAmount <= 0) {
      return { error: "Target dana harus lebih besar dari nol." };
    }

    await db.insert(tabunganFunds).values({ punguanId, ...values });
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Gagal menyimpan dana." };
  }

  revalidatePath(`/p/${punguanId}/tabungan`);
}

export async function updateFund(punguanId: string, fundId: string, formData: FormData) {
  try {
    await verifyBendaharaAccess(punguanId);

    const values = bacaForm(formData);
    if (!values.name) return { error: "Nama dana wajib diisi." };
    if (values.targetAmount !== null && values.targetAmount <= 0) {
      return { error: "Target dana harus lebih besar dari nol." };
    }

    await db.update(tabunganFunds)
      .set({ ...values, updatedAt: new Date() })
      .where(and(eq(tabunganFunds.id, fundId), eq(tabunganFunds.punguanId, punguanId)));
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Gagal menyimpan dana." };
  }

  revalidatePath(`/p/${punguanId}/tabungan`);
  revalidatePath(`/p/${punguanId}/tabungan/${fundId}`);
}
