import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';
import * as dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in environment variables");
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql, { schema });

async function main() {
  console.log("Seeding database...");
  
  // 1. Create Superadmin
  const passwordHash = await bcrypt.hash("horas123", 10);
  const [superadmin] = await db.insert(schema.users).values({
    email: "admin@horashub.com",
    name: "Superadmin HorasHub",
    passwordHash,
    isSuperadmin: true,
  }).returning();

  console.log("Superadmin created.");

  // 2. Create Punguans
  const [punguan1] = await db.insert(schema.punguans).values({
    name: "Patogar Jakut",
    description: "Punguan Parsahutaon Patogar Jakarta Utara",
  }).returning();

  const [punguan2] = await db.insert(schema.punguans).values({
    name: "Tampubolon Semper-Cilincing",
    description: "Punguan Marga Tampubolon Sektor Semper dan Cilincing",
  }).returning();

  console.log("Punguans created.");

  // 3. Create Pengurus for Patogar Jakut
  const [ketua1] = await db.insert(schema.users).values({
    email: "ketua.patogar@horashub.com",
    name: "Bapak Ketua Patogar",
    passwordHash,
  }).returning();
  
  const [sekretaris1] = await db.insert(schema.users).values({
    email: "sekretaris.patogar@horashub.com",
    name: "Bapak Sekretaris Patogar",
    passwordHash,
  }).returning();

  const [bendahara1] = await db.insert(schema.users).values({
    email: "bendahara.patogar@horashub.com",
    name: "Ibu Bendahara Patogar",
    passwordHash,
  }).returning();

  await db.insert(schema.punguanUsers).values([
    { userId: ketua1.id, punguanId: punguan1.id, role: "KETUA" },
    { userId: sekretaris1.id, punguanId: punguan1.id, role: "SEKRETARIS" },
    { userId: bendahara1.id, punguanId: punguan1.id, role: "BENDAHARA" },
  ]);

  // 4. Create Households and Members for Patogar Jakut
  const [kk1] = await db.insert(schema.households).values({
    punguanId: punguan1.id,
    headName: "Aman Sirait",
    address: "Jl. Yos Sudarso No. 10",
    phone: "081234567890",
  }).returning();

  await db.insert(schema.members).values([
    { householdId: kk1.id, punguanId: punguan1.id, fullName: "Aman Sirait", relation: "KEPALA", gender: "L" },
    { householdId: kk1.id, punguanId: punguan1.id, fullName: "Tiurma br. Panjaitan", relation: "ISTRI", gender: "P" },
    { householdId: kk1.id, punguanId: punguan1.id, fullName: "Budi Sirait", relation: "ANAK", gender: "L" },
  ]);

  // 5. Iuran Settings & Bills
  await db.insert(schema.iuranSettings).values({
    punguanId: punguan1.id,
    monthlyAmount: 50000,
  });

  const [bill1] = await db.insert(schema.iuranBills).values({
    punguanId: punguan1.id,
    householdId: kk1.id,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    amount: 50000,
    status: "LUNAS",
  }).returning();

  await db.insert(schema.iuranPayments).values({
    billId: bill1.id,
    amount: 50000,
    recordedBy: bendahara1.id,
  });

  console.log("Seeding complete!");
}

main().catch((err) => {
  console.error("Seeding failed", err);
  process.exit(1);
});
