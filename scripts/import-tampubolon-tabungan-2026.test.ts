import assert from "node:assert/strict";
import { IMPORT_TOTALS } from "./import-tampubolon-tabungan-2026";

assert.equal(IMPORT_TOTALS.setoranCount, 33);
assert.equal(IMPORT_TOTALS.setoranAmount, 2_050_000);
assert.equal(IMPORT_TOTALS.refundAmount, 100_000);
assert.equal(IMPORT_TOTALS.netAmount, 1_950_000);

console.log("Tampubolon 2026 import totals contract OK");
