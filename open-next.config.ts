import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// ponytail: tanpa incremental cache (R2/KV). Tambahkan kalau ISR/revalidate
// benar-benar dipakai; sekarang semua halaman dinamis atau statis biasa.
export default defineCloudflareConfig();
