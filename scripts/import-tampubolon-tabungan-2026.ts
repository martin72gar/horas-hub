import { and, eq } from "drizzle-orm";
import { transactionDb } from "../src/db";
import { households, members, punguans, tabunganFunds, tabunganTransactions, meetings } from "../src/db/schema";

const PUNGUAN_NAME = "Tampubolon Semper-Cilincing";
const FUND_NAME = "Dana Bona Taon 2027";
const IMPORT_MARKER = "[IMPORT-PDF-TABUNGAN-2026]";

export const IMPORT_TOTALS = {
  setoranCount: 33,
  setoranAmount: 2_050_000,
  refundAmount: 100_000,
  netAmount: 1_950_000,
} as const;

type Setoran = { number: number; month: number; amount: number };

const SETORAN: Setoran[] = [
  { number: 1, month: 4, amount: 50_000 }, { number: 4, month: 4, amount: 50_000 },
  { number: 5, month: 4, amount: 50_000 }, { number: 6, month: 4, amount: 50_000 },
  { number: 7, month: 4, amount: 100_000 }, { number: 10, month: 4, amount: 50_000 },
  { number: 11, month: 4, amount: 100_000 }, { number: 12, month: 4, amount: 50_000 },
  { number: 13, month: 4, amount: 50_000 }, { number: 16, month: 4, amount: 50_000 },
  { number: 19, month: 4, amount: 50_000 }, { number: 20, month: 4, amount: 50_000 },
  { number: 21, month: 4, amount: 100_000 }, { number: 26, month: 4, amount: 50_000 },
  { number: 1, month: 5, amount: 50_000 }, { number: 2, month: 5, amount: 100_000 },
  { number: 4, month: 5, amount: 50_000 }, { number: 5, month: 5, amount: 50_000 },
  { number: 9, month: 5, amount: 50_000 }, { number: 10, month: 5, amount: 50_000 },
  { number: 15, month: 5, amount: 50_000 }, { number: 19, month: 5, amount: 50_000 },
  { number: 21, month: 5, amount: 50_000 }, { number: 22, month: 5, amount: 100_000 },
  { number: 1, month: 6, amount: 50_000 }, { number: 5, month: 6, amount: 50_000 },
  { number: 9, month: 6, amount: 50_000 }, { number: 19, month: 6, amount: 50_000 },
  { number: 2, month: 8, amount: 100_000 }, { number: 7, month: 8, amount: 100_000 },
  { number: 11, month: 8, amount: 50_000 }, { number: 21, month: 8, amount: 50_000 },
  { number: 22, month: 8, amount: 100_000 },
];

const HOUSEHOLD_KEYS: Record<number, { head: string; wife: string }> = {
  1: { head: "P. Tampubolon", wife: "Manurung" }, 2: { head: "S. Tampubolon", wife: "Nainggolan" },
  4: { head: "D. Tampubolon", wife: "Hutagalung" }, 5: { head: "P. Tampubolon", wife: "Simanjuntak" },
  6: { head: "J. Tampubolon", wife: "Simbolon" }, 7: { head: "R. Tampubolon", wife: "Siregar" },
  8: { head: "M. Tampubolon", wife: "Rajagukguk" }, 9: { head: "B. Tampubolon", wife: "Sianturi" },
  10: { head: "A. Tampubolon", wife: "Sinaga" }, 11: { head: "J. Tampubolon", wife: "Situmeang" },
  12: { head: "JV. Tampubolon", wife: "Simanjuntak" }, 13: { head: "B. Tampubolon", wife: "Matondang" },
  15: { head: "J. Tampubolon", wife: "Manullang" }, 16: { head: "J. Tampubolon", wife: "Simanjuntak" },
  17: { head: "V. Tampubolon", wife: "Parangin-angin" }, 19: { head: "D. Tampubolon", wife: "Nainggolan" },
  20: { head: "S. Pangaribuan", wife: "Tampubolon" }, 21: { head: "L. Hutauruk", wife: "Tampubolon" },
  22: { head: "Sihite", wife: "Tampubolon" }, 26: { head: "M. Hutagaol", wife: "Tampubolon" },
};

const MEETINGS = [
  { month: 4, host: 7 }, { month: 5, host: 16 }, { month: 6, host: 19 },
  { month: 7, host: 17 }, { month: 8, host: 20 },
];

function normalized(value: string) {
  return value.toLowerCase().replace(/^boru\s+|^br\.?\s*/i, "").replace(/[^a-z0-9]/g, "");
}

function householdKey(head: string, wife: string) {
  return `${normalized(head)}:${normalized(wife)}`;
}

function dateForMonth(month: number) {
  return `2026-${String(month).padStart(2, "0")}-01`;
}

async function run(apply: boolean) {
  const [punguan] = await transactionDb
    .select({ id: punguans.id })
    .from(punguans)
    .where(eq(punguans.name, PUNGUAN_NAME))
    .limit(1);
  if (!punguan) throw new Error(`Punguan tidak ditemukan: ${PUNGUAN_NAME}`);

  const householdRows = await transactionDb
    .select({ id: households.id, headName: households.headName, status: households.status })
    .from(households)
    .where(eq(households.punguanId, punguan.id));
  const wifeRows = await transactionDb
    .select({ householdId: members.householdId, fullName: members.fullName })
    .from(members)
    .where(and(eq(members.punguanId, punguan.id), eq(members.relation, "ISTRI")));

  const wifeByHousehold = new Map(wifeRows.map((row) => [row.householdId, row.fullName]));
  const idByPdfNumber = new Map<number, string>();
  for (const [numberText, identity] of Object.entries(HOUSEHOLD_KEYS)) {
    const match = householdRows.filter((household) =>
      householdKey(household.headName, wifeByHousehold.get(household.id) ?? "") === householdKey(identity.head, identity.wife)
    );
    if (match.length !== 1) {
      throw new Error(`Pencocokan keluarga No. ${numberText} harus tepat satu; ditemukan ${match.length}.`);
    }
    idByPdfNumber.set(Number(numberText), match[0].id);
  }

  const totalSetoran = SETORAN.reduce((sum, row) => sum + row.amount, 0);
  if (SETORAN.length !== IMPORT_TOTALS.setoranCount || totalSetoran !== IMPORT_TOTALS.setoranAmount) {
    throw new Error("Kontrak total setoran PDF tidak sesuai.");
  }

  const existingFund = await transactionDb
    .select({ id: tabunganFunds.id })
    .from(tabunganFunds)
    .where(and(eq(tabunganFunds.punguanId, punguan.id), eq(tabunganFunds.name, FUND_NAME)))
    .limit(1);
  if (existingFund.length > 0) {
    throw new Error(`Dana '${FUND_NAME}' sudah ada; impor dihentikan agar tidak terjadi duplikasi.`);
  }

  const summary = {
    punguan: PUNGUAN_NAME,
    householdsMatched: idByPdfNumber.size,
    createFund: FUND_NAME,
    setoran: { count: SETORAN.length, amount: totalSetoran },
    refunds: { count: 2, amount: IMPORT_TOTALS.refundAmount },
    meetings: MEETINGS.length,
    markNonaktif: [8, 13, 16],
    pendingReconciliation: "Setoran Agustus 'Eda Yuna' Rp50.000 tidak diimpor karena belum diketahui pemiliknya.",
  };
  console.log(JSON.stringify({ mode: apply ? "APPLY" : "DRY_RUN", ...summary }, null, 2));
  if (!apply) return;

  await transactionDb.transaction(async (tx) => {
    const [fund] = await tx.insert(tabunganFunds).values({
      punguanId: punguan.id,
      name: FUND_NAME,
      description: "Impor PDF Data Tabungan 2026. Setoran Mei boru Simanjuntak Rp50.000 sementara diatribusikan ke No. 5 sesuai PDF. Setoran Agustus 'Eda Yuna' Rp50.000 belum termasuk karena menunggu rekonsiliasi.",
      targetEvent: "Bona Taon",
      targetYear: 2027,
      status: "AKTIF",
    }).returning({ id: tabunganFunds.id });

    await tx.insert(tabunganTransactions).values(SETORAN.map((row) => ({
      fundId: fund.id,
      punguanId: punguan.id,
      householdId: idByPdfNumber.get(row.number)!,
      type: "SETORAN" as const,
      amount: row.amount,
      transactionDate: dateForMonth(row.month),
      periodMonth: row.month,
      periodYear: 2026,
      description: `${IMPORT_MARKER} Setoran periode ${row.month}/2026 dari PDF.`,
      recordedBy: null,
    })));

    for (const number of [13, 16]) {
      await tx.insert(tabunganTransactions).values({
        fundId: fund.id,
        punguanId: punguan.id,
        householdId: idByPdfNumber.get(number)!,
        type: "PENGEMBALIAN",
        amount: 50_000,
        transactionDate: "2026-05-31",
        periodMonth: 5,
        periodYear: 2026,
        description: `${IMPORT_MARKER} Pengembalian tabungan karena keluar Mei 2026; tanggal diestimasi akhir bulan.`,
        recordedBy: null,
      });
    }

    await tx.insert(meetings).values(MEETINGS.map((meeting) => ({
      punguanId: punguan.id,
      fundId: fund.id,
      title: `Pertemuan ${meeting.month}/2026`,
      meetingDate: null,
      periodMonth: meeting.month,
      periodYear: 2026,
      hostHouseholdId: idByPdfNumber.get(meeting.host)!,
      notes: `${IMPORT_MARKER} Tuan rumah diimpor dari PDF; tanggal pertemuan tidak tersedia.`,
    })));

    for (const number of [8, 13, 16]) {
      await tx.update(households).set({ status: "NONAKTIF", notes: "Keluar Mei 2026 (diimpor dari Data Tabungan 2026)." })
        .where(eq(households.id, idByPdfNumber.get(number)!));
    }
  });

  console.log(JSON.stringify({ applied: true, expectedNetAmount: IMPORT_TOTALS.netAmount }, null, 2));
}

if (process.argv[1]?.endsWith("import-tampubolon-tabungan-2026.ts")) {
  run(process.argv.includes("--apply")).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
