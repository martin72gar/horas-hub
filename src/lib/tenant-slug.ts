// Dipakai middleware (edge) dan server action — jangan tambahkan import DB di sini.

export const RESERVED_SUBDOMAINS = new Set(['www', 'app', 'admin', 'api', 'p', 'login', 'static']);

const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])$/;

/** null = valid, selain itu pesan error untuk ditampilkan ke pengurus. */
export function validateSlug(slug: string): string | null {
  if (!SLUG_PATTERN.test(slug)) {
    return 'Alamat hanya boleh huruf kecil, angka, dan tanda hubung (3-63 karakter), serta tidak diawali/diakhiri tanda hubung.';
  }
  if (RESERVED_SUBDOMAINS.has(slug)) {
    return `Alamat "${slug}" sudah dipesan sistem. Silakan pilih yang lain.`;
  }
  return null;
}

/**
 * Mengambil slug tenant dari header Host.
 * "punguan-toba.horashub.com" -> "punguan-toba"; "horashub.com" -> null.
 */
export function getTenantSlug(host: string | null, rootDomain: string) {
  if (!host) return null;
  if (host === rootDomain || !host.endsWith(`.${rootDomain}`)) return null;

  const sub = host.slice(0, -(rootDomain.length + 1)).toLowerCase();
  if (!sub || sub.includes('.') || RESERVED_SUBDOMAINS.has(sub)) return null;
  return sub;
}
