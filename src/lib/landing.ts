import type { PengurusEntry } from '@/db/schema';

/**
 * Kelompokkan jabatan supaya daftar panjang tidak jadi satu blok 1-18.
 * Cocokkan lewat awalan/kata kunci jabatan — tidak ada kolom kategori di data.
 */
export function groupPengurus(entries: PengurusEntry[]) {
  const harian: PengurusEntry[] = [];
  const komisaris: PengurusEntry[] = [];
  const penasehat: PengurusEntry[] = [];
  for (const e of entries) {
    const j = e.jabatan.toLowerCase();
    if (j.startsWith('komisaris')) komisaris.push(e);
    else if (/penase[hb]at|penasihat|pengawas/.test(j)) penasehat.push(e);
    else harian.push(e);
  }
  return { harian, komisaris, penasehat };
}

/**
 * Inisial untuk avatar: huruf depan kata pertama + huruf depan marga.
 * ponytail: marga diambil sebagai kata terpanjang — cukup akurat untuk nama
 * Batak ("Drs. T. Siregar, MM" → DS) tanpa daftar gelar.
 */
export function inisial(nama: string) {
  const kata = nama
    .split('/')[0]
    .replace(/\(.*/, '')
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
  if (kata.length === 0) return '?';
  if (kata.length === 1) return kata[0].slice(0, 2).toUpperCase();
  const marga = kata.reduce((a, b) => (b.length >= a.length ? b : a));
  return (kata[0][0] + marga[0]).toUpperCase();
}

/** Nomor lokal (08xx) jadi format internasional wa.me. */
export function waLink(phone: string) {
  const d = phone.replace(/\D/g, '');
  if (!d) return null;
  return `https://wa.me/${d.startsWith('0') ? `62${d.slice(1)}` : d}`;
}

/** ponytail: link pencarian Maps, bukan iframe — tidak butuh API key. */
export function mapsLink(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
}
