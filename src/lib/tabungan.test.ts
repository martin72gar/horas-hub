// Cek kecil tanpa framework: `npx tsx src/lib/tabungan.test.ts`
import assert from 'node:assert/strict';
import { hitungRingkasan } from './tabungan';

// Dana kosong
assert.equal(hitungRingkasan([]).danaTerkumpul, 0);

// Rumus dasar: setoran − pengembalian − pengeluaran
const dasar = hitungRingkasan([
  { type: 'SETORAN', total: 1_000_000 },
  { type: 'PENGEMBALIAN', total: 150_000 },
  { type: 'PENGELUARAN', total: 50_000 },
]);
assert.equal(dasar.danaTerkumpul, 800_000);

// TRANSFER tidak mengurangi dana terkumpul, hanya memindah tunai -> rekening
const dgTransfer = hitungRingkasan([
  { type: 'SETORAN', total: 1_000_000 },
  { type: 'TRANSFER', total: 600_000 },
]);
assert.equal(dgTransfer.danaTerkumpul, 1_000_000);
assert.equal(dgTransfer.rekening, 600_000);
assert.equal(dgTransfer.tunai, 400_000);

// PENYESUAIAN boleh minus untuk koreksi
assert.equal(
  hitungRingkasan([
    { type: 'SETORAN', total: 500_000 },
    { type: 'PENYESUAIAN', total: -25_000 },
  ]).danaTerkumpul,
  475_000
);

console.log('tabungan.test.ts OK');
