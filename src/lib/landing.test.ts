// Cek kecil tanpa framework: `npx tsx src/lib/landing.test.ts`
import assert from 'node:assert/strict';
import { groupPengurus, inisial, waLink } from './landing';

// Pengelompokan jabatan
const g = groupPengurus([
  { jabatan: 'Ketua Umum', orang: ['a'] },
  { jabatan: 'Bendahara I', orang: ['b'] },
  { jabatan: 'Komisaris IX', wilayah: 'Ancol', orang: ['c'] },
  { jabatan: 'Penasehat', orang: ['d'] },
]);
assert.deepEqual(g.harian.map((e) => e.jabatan), ['Ketua Umum', 'Bendahara I']);
assert.deepEqual(g.komisaris.map((e) => e.jabatan), ['Komisaris IX']);
assert.deepEqual(g.penasehat.map((e) => e.jabatan), ['Penasehat']);

// Inisial: gelar & nama pasangan/panggoaran tidak ikut
assert.equal(inisial('R. Siregar/br. Butarbutar (Op. Nicholas)'), 'RS');
assert.equal(inisial('Drs. T. Siregar, MM/br. Sibarani (Op. Alecia)'), 'DS');
assert.equal(inisial('M. Sitorus/br. Siregar (A. Thessa)'), 'MS');
assert.equal(inisial('Siregar'), 'SI');
assert.equal(inisial(''), '?');

// Nomor WhatsApp
assert.equal(waLink('0812-3456-7890'), 'https://wa.me/6281234567890');
assert.equal(waLink('+62 812 3456 7890'), 'https://wa.me/6281234567890');
assert.equal(waLink('-'), null);

console.log('landing: semua cek lolos');
