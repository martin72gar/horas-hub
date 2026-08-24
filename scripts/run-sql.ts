// Menjalankan satu file SQL ke DATABASE_URL. Dipakai untuk migrasi aditif
// yang tidak bisa lewat `drizzle-kit push` tanpa prompt truncate.
import { readFileSync } from 'node:fs';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const file = process.argv[2];
if (!file) throw new Error('Usage: tsx scripts/run-sql.ts <file.sql>');

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query(readFileSync(file, 'utf8'));
  await pool.end();
  console.log(`Applied ${file}`);
}

main();
