"use server"

import { db } from "@/db";
import { tabunganTransactions } from "@/db/schema";
import { getCurrentSession, verifyBendaharaAccess } from "@/lib/dal";
import { revalidatePath } from "next/cache";

/** Tanggal hari ini dalam format kolom `date` Postgres. */
function hariIni() {
  return new Date().toISOString().slice(0, 10);
}

export async function recordSetoran(punguanId: string, fundId: string, formData: FormData) {
  try {
    await verifyBendaharaAccess(punguanId);

    const householdId = formData.get("householdId") as string;
    const amount = parseInt(formData.get("amount") as string, 10);
    const periodMonth = parseInt(formData.get("periodMonth") as string, 10);
    const periodYear = parseInt(formData.get("periodYear") as string, 10);

    if (!householdId) return { error: "Pilih keluarga penyetor terlebih dahulu." };
    if (!Number.isFinite(amount) || amount <= 0) return { error: "Nominal setoran harus lebih besar dari nol." };
    if (!Number.isFinite(periodMonth) || periodMonth < 1 || periodMonth > 12) return { error: "Bulan periode tidak valid." };
    if (!Number.isFinite(periodYear) || periodYear < 2000 || periodYear > 2100) return { error: "Tahun periode tidak valid." };

    const session = await getCurrentSession();

    await db.insert(tabunganTransactions).values({
      fundId,
      punguanId,
      householdId,
      type: "SETORAN",
      amount,
      transactionDate: (formData.get("transactionDate") as string) || hariIni(),
      periodMonth,
      periodYear,
      description: (formData.get("description") as string)?.trim() || null,
      recordedBy: session?.user?.id ?? null,
    });
  } catch (error: any) {
    console.error(error);
    return { error: error.message || "Gagal mencatat setoran." };
  }

  revalidatePath(`/p/${punguanId}/tabungan/${fundId}`);
  revalidatePath(`/p/${punguanId}/tabungan`);
}
