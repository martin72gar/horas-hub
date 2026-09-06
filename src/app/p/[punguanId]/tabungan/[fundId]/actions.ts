"use server"

import { db } from "@/db";
import { meetings, tabunganTransactions } from "@/db/schema";
import { getCurrentSession, verifyBendaharaAccess } from "@/lib/dal";
import { and, eq } from "drizzle-orm";
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
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Gagal mencatat setoran." };
  }

  revalidatePath(`/p/${punguanId}/tabungan/${fundId}`);
  revalidatePath(`/p/${punguanId}/tabungan`);
}

const TIPE_KELUAR = ["PENGEMBALIAN", "PENGELUARAN", "TRANSFER", "PENYESUAIAN"] as const;
type TipeKeluar = (typeof TIPE_KELUAR)[number];

export async function recordOutflow(punguanId: string, fundId: string, formData: FormData) {
  try {
    await verifyBendaharaAccess(punguanId);

    const type = formData.get("type") as TipeKeluar;
    const householdId = (formData.get("householdId") as string) || null;
    const amount = parseInt(formData.get("amount") as string, 10);
    const transactionDate = (formData.get("transactionDate") as string) || hariIni();

    if (!TIPE_KELUAR.includes(type)) return { error: "Jenis transaksi tidak valid." };
    if (type === "PENGEMBALIAN" && !householdId) {
      return { error: "Pengembalian harus ditujukan ke satu keluarga." };
    }
    if (!Number.isFinite(amount)) return { error: "Nominal tidak valid." };
    // ponytail: PENYESUAIAN satu-satunya tipe yang boleh minus, supaya koreksi
    // ke bawah tidak butuh kolom tanda sendiri dan rumus dana terkumpul tetap
    // satu baris. Tipe lain arahnya sudah ditentukan oleh `type`.
    if (type === "PENYESUAIAN" ? amount === 0 : amount <= 0) {
      return { error: "Nominal harus lebih besar dari nol." };
    }

    const session = await getCurrentSession();
    const tanggal = new Date(transactionDate);

    await db.insert(tabunganTransactions).values({
      fundId,
      punguanId,
      householdId: type === "PENGEMBALIAN" ? householdId : null,
      type,
      amount,
      transactionDate,
      periodMonth: tanggal.getUTCMonth() + 1,
      periodYear: tanggal.getUTCFullYear(),
      description: (formData.get("description") as string)?.trim() || null,
      recordedBy: session?.user?.id ?? null,
    });
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Gagal mencatat transaksi." };
  }

  revalidatePath(`/p/${punguanId}/tabungan/${fundId}`);
  revalidatePath(`/p/${punguanId}/tabungan`);
}

/**
 * Tuan rumah bergilir per bulan. Satu pertemuan per dana per periode: kalau
 * periodenya sudah ada, barisnya diperbarui, bukan ditambah.
 */
export async function setTuanRumah(punguanId: string, fundId: string, formData: FormData) {
  try {
    await verifyBendaharaAccess(punguanId);

    const hostHouseholdId = (formData.get("hostHouseholdId") as string) || null;
    const periodMonth = parseInt(formData.get("periodMonth") as string, 10);
    const periodYear = parseInt(formData.get("periodYear") as string, 10);

    if (!Number.isFinite(periodMonth) || periodMonth < 1 || periodMonth > 12) return { error: "Bulan tidak valid." };
    if (!Number.isFinite(periodYear) || periodYear < 2000 || periodYear > 2100) return { error: "Tahun tidak valid." };

    const values = {
      hostHouseholdId,
      title: (formData.get("title") as string)?.trim() || null,
      meetingDate: (formData.get("meetingDate") as string) || null,
      notes: (formData.get("notes") as string)?.trim() || null,
    };

    const [existing] = await db.select({ id: meetings.id }).from(meetings)
      .where(and(
        eq(meetings.fundId, fundId),
        eq(meetings.periodMonth, periodMonth),
        eq(meetings.periodYear, periodYear),
      ))
      .limit(1);

    if (existing) {
      await db.update(meetings).set(values).where(eq(meetings.id, existing.id));
    } else {
      await db.insert(meetings).values({ punguanId, fundId, periodMonth, periodYear, ...values });
    }
  } catch (error) {
    console.error(error);
    return { error: error instanceof Error ? error.message : "Gagal menyimpan tuan rumah." };
  }

  revalidatePath(`/p/${punguanId}/tabungan/${fundId}/pertemuan`);
  revalidatePath(`/p/${punguanId}/tabungan/${fundId}`);
}
