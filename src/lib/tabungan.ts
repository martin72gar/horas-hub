/**
 * Nilai turunan modul tabungan. Sengaja dihitung, tidak pernah disimpan.
 *
 *   dana_terkumpul = Σ SETORAN − Σ PENGEMBALIAN − Σ PENGELUARAN + Σ PENYESUAIAN
 *
 * TRANSFER tidak mengubah dana terkumpul: uangnya hanya pindah dari kas tunai
 * ke rekening, jadi dipakai untuk memecah saldo jadi tunai vs rekening.
 */

export type TabunganTxType =
  | "SETORAN"
  | "PENGEMBALIAN"
  | "PENGELUARAN"
  | "TRANSFER"
  | "PENYESUAIAN";

export type TotalPerTipe = { type: TabunganTxType; total: number };

export function hitungRingkasan(rows: TotalPerTipe[]) {
  const t = (type: TabunganTxType) => rows.find((r) => r.type === type)?.total ?? 0;

  const setoran = t("SETORAN");
  const pengembalian = t("PENGEMBALIAN");
  const pengeluaran = t("PENGELUARAN");
  const penyesuaian = t("PENYESUAIAN");
  const danaTerkumpul = setoran - pengembalian - pengeluaran + penyesuaian;
  // ponytail: model kas paling sederhana — semua setoran masuk sebagai tunai,
  // TRANSFER memindahkannya ke rekening, pengeluaran/pengembalian dibayar tunai.
  // Kalau nanti ada pembayaran langsung dari rekening, tandai asal kas di transaksi.
  const rekening = t("TRANSFER");

  return {
    setoran,
    pengembalian,
    pengeluaran,
    penyesuaian,
    transfer: rekening,
    danaTerkumpul,
    rekening,
    tunai: danaTerkumpul - rekening,
  };
}

export const NAMA_BULAN = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

export type HouseholdOption = { id: string; headName: string; status: string };
