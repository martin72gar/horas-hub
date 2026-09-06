import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = readFileSync(resolve(import.meta.dirname, "RekapSetoranTable.tsx"), "utf8");

assert.match(source, /Maximize2/, "rekap harus menyediakan tombol layar penuh");
assert.match(source, /fixed inset-0 z-50/, "rekap layar penuh harus menutupi viewport");
assert.match(source, /aria-label="Tutup tampilan layar penuh"/, "kontrol tutup harus aksesibel");
assert.match(source, /overflow-auto/, "tabel layar penuh harus dapat discroll pada layar sempit");

console.log("RekapSetoranTable fullscreen contract OK");
