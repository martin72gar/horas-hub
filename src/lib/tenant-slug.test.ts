// Cek kecil tanpa framework: `tsx src/lib/tenant-slug.test.ts`
import assert from 'node:assert/strict';
import { getTenantSlug, validateSlug } from './tenant-slug';

const ROOT = 'horashub.com';

// Subdomain tenant terdeteksi
assert.equal(getTenantSlug('punguan-toba.horashub.com', ROOT), 'punguan-toba');
assert.equal(getTenantSlug('PUNGUAN-TOBA.horashub.com', ROOT), 'punguan-toba');
assert.equal(getTenantSlug('patogar.localhost:3001', 'localhost:3001'), 'patogar');

// Domain utama & subdomain terpesan bukan tenant
assert.equal(getTenantSlug('horashub.com', ROOT), null);
assert.equal(getTenantSlug('www.horashub.com', ROOT), null);
assert.equal(getTenantSlug('app.horashub.com', ROOT), null);
assert.equal(getTenantSlug(null, ROOT), null);

// Domain asing tidak boleh lolos jadi tenant
assert.equal(getTenantSlug('horashub.com.evil.test', ROOT), null);
assert.equal(getTenantSlug('evil-horashub.com', ROOT), null);
// Subdomain bertingkat ditolak, supaya tidak ada dua URL untuk satu tenant
assert.equal(getTenantSlug('a.b.horashub.com', ROOT), null);

// Validasi slug
assert.equal(validateSlug('punguan-toba'), null);
assert.equal(validateSlug('abc'), null);
assert.notEqual(validateSlug('Punguan Toba'), null); // spasi & huruf besar
assert.notEqual(validateSlug('-toba'), null);        // diawali tanda hubung
assert.notEqual(validateSlug('toba-'), null);        // diakhiri tanda hubung
assert.notEqual(validateSlug('ab'), null);           // terlalu pendek
assert.notEqual(validateSlug('www'), null);          // terpesan
assert.notEqual(validateSlug('a'.repeat(64)), null); // terlalu panjang

console.log('tenant-slug: semua cek lolos');
