import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(import.meta.dirname, "AdminSidebar.tsx"), "utf8");

// Kontrak mobile: navigasi desktop tidak boleh merebut lebar viewport ponsel.
assert.match(source, /hidden md:flex/, "sidebar desktop harus disembunyikan di bawah breakpoint md");
assert.match(source, /md:hidden/, "harus ada kontrol navigasi khusus mobile");
assert.match(source, /fixed inset-y-0 left-0/, "menu mobile harus menjadi drawer overlay, bukan kolom permanen");
assert.match(source, /aria-label="Buka menu navigasi"/, "tombol menu mobile harus memiliki label aksesibel");

console.log("AdminSidebar mobile layout contract OK");
