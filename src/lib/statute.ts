// Helper murni AD/ART — dipakai server DAN client, jangan tambahkan import DB.

export type StatuteType = 'AD' | 'ART';

export const STATUTE_LABELS: Record<StatuteType, string> = {
  AD: 'Anggaran Dasar',
  ART: 'Anggaran Rumah Tangga',
};

/** Judul seksi pembuka bawaan kalau pengurus tidak mengisi sendiri. */
export const DEFAULT_PREAMBLE_TITLE = 'PENDAHULUAN';

export function parseStatuteType(value: string): StatuteType | null {
  const upper = value.toUpperCase();
  return upper === 'AD' || upper === 'ART' ? upper : null;
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'];

export function toRoman(n: number) {
  // ponytail: AD/ART realistis <= 20 BAB; di atas itu tampilkan angka biasa.
  return ROMAN[n] ?? String(n);
}

/**
 * Mengelompokkan pasal per BAB untuk ditampilkan / diekspor.
 * Mengandalkan urutan masukan (sudah diurutkan bab lalu pasal), bukan mengurutkan ulang.
 */
export function groupByBab<T extends { babNumber: number; babTitle: string }>(articles: T[]) {
  const babs: { number: number; title: string; items: T[] }[] = [];
  for (const a of articles) {
    const last = babs[babs.length - 1];
    if (last && last.number === a.babNumber) last.items.push(a);
    else babs.push({ number: a.babNumber, title: a.babTitle, items: [a] });
  }
  return babs;
}
