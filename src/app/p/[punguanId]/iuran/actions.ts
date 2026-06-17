"use server"

import { db, transactionDb } from "@/db";
import { iuranBills, households, iuranPayments } from "@/db/schema";
import { verifyTenantAccess } from "@/lib/dal";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function generateBills(punguanId: string, month: number, year: number, amount: number) {
  const role = await verifyTenantAccess(punguanId);
  if (role !== 'SUPERADMIN' && role !== 'BENDAHARA') {
    throw new Error("Hanya Bendahara yang berhak men-generate tagihan.");
  }

  const hhs = await db.select({ id: households.id }).from(households).where(and(eq(households.punguanId, punguanId), eq(households.status, 'AKTIF')));

  if (hhs.length === 0) return;

  for (const hh of hhs) {
    const existing = await db.select().from(iuranBills).where(
      and(
        eq(iuranBills.householdId, hh.id),
        eq(iuranBills.month, month),
        eq(iuranBills.year, year)
      )
    ).limit(1);

    if (existing.length === 0) {
      await db.insert(iuranBills).values({
        punguanId,
        householdId: hh.id,
        month,
        year,
        amount,
        status: "BELUM_BAYAR"
      });
    }
  }

  revalidatePath(`/p/${punguanId}/iuran`);
}

export async function markAsPaid(punguanId: string, billId: string, amount: number) {
  const role = await verifyTenantAccess(punguanId);
  if (role !== 'SUPERADMIN' && role !== 'BENDAHARA') {
    throw new Error("Hanya Bendahara yang berhak mencatat pembayaran.");
  }

  await transactionDb.transaction(async (tx) => {
    await tx.insert(iuranPayments).values({
      billId,
      amount,
    });

    await tx.update(iuranBills).set({ status: 'LUNAS' }).where(eq(iuranBills.id, billId));
  });

  revalidatePath(`/p/${punguanId}/iuran`);
}
