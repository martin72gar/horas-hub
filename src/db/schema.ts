import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  date,
  integer,
  pgEnum,
  jsonb,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["KETUA", "SEKRETARIS", "BENDAHARA"]);
export const householdStatusEnum = pgEnum("household_status", ["AKTIF", "PINDAH", "MENINGGAL", "NONAKTIF"]);
export const memberRelationEnum = pgEnum("member_relation", ["KEPALA", "ISTRI", "ANAK", "LAINNYA"]);
export const memberGenderEnum = pgEnum("member_gender", ["L", "P"]);
export const billStatusEnum = pgEnum("bill_status", ["BELUM_BAYAR", "SEBAGIAN", "LUNAS"]);
export const arisanStatusEnum = pgEnum("arisan_status", ["AKTIF", "SELESAI"]);
export const statuteTypeEnum = pgEnum("statute_type", ["AD", "ART"]);
export const tabunganFundStatusEnum = pgEnum("tabungan_fund_status", ["AKTIF", "SELESAI"]);
export const tabunganTxTypeEnum = pgEnum("tabungan_tx_type", ["SETORAN", "PENGEMBALIAN", "PENGELUARAN", "TRANSFER", "PENYESUAIAN"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  isSuperadmin: boolean("is_superadmin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const punguans = pgTable("punguans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  // Landing page publik (slug = subdomain, mis. punguan-toba.horashub.com)
  slug: varchar("slug", { length: 63 }).unique(),
  landingPublished: boolean("landing_published").default(false).notNull(),
  tagline: varchar("tagline", { length: 255 }),
  about: text("about"),
  contactPhone: varchar("contact_phone", { length: 50 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  contactAddress: text("contact_address"),
  // Struktur pengurus lengkap (termasuk yang tidak punya akun login).
  // null = landing page jatuh balik ke daftar akun punguan_users.
  pengurus: jsonb("pengurus").$type<PengurusStruktur | null>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const punguanUsers = pgTable("punguan_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  punguanId: uuid("punguan_id").notNull().references(() => punguans.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const households = pgTable("households", {
  id: uuid("id").primaryKey().defaultRandom(),
  punguanId: uuid("punguan_id").notNull().references(() => punguans.id, { onDelete: "cascade" }),
  headName: varchar("head_name", { length: 255 }).notNull(),
  panggoaran: varchar("panggoaran", { length: 255 }),
  sektor: varchar("sektor", { length: 100 }),
  pomparan: varchar("pomparan", { length: 100 }),
  nomorKeturunan: integer("nomor_keturunan"),
  address: text("address"),
  phone: varchar("phone", { length: 50 }),
  status: householdStatusEnum("status").default("AKTIF").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const members = pgTable("members", {
  id: uuid("id").primaryKey().defaultRandom(),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  punguanId: uuid("punguan_id").notNull().references(() => punguans.id, { onDelete: "cascade" }),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  relation: memberRelationEnum("relation").notNull(),
  pomparan: varchar("pomparan", { length: 100 }),
  nomorKeturunan: integer("nomor_keturunan"),
  birthDate: date("birth_date"),
  gender: memberGenderEnum("gender"),
  phone: varchar("phone", { length: 50 }),
  status: householdStatusEnum("status").default("AKTIF").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const iuranSettings = pgTable("iuran_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  punguanId: uuid("punguan_id").notNull().references(() => punguans.id, { onDelete: "cascade" }),
  monthlyAmount: integer("monthly_amount").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const iuranBills = pgTable("iuran_bills", {
  id: uuid("id").primaryKey().defaultRandom(),
  punguanId: uuid("punguan_id").notNull().references(() => punguans.id, { onDelete: "cascade" }),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  month: integer("month").notNull(),
  year: integer("year").notNull(),
  amount: integer("amount").notNull(),
  status: billStatusEnum("status").default("BELUM_BAYAR").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const iuranPayments = pgTable("iuran_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  billId: uuid("bill_id").notNull().references(() => iuranBills.id, { onDelete: "cascade" }),
  amount: integer("amount").notNull(),
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  recordedBy: uuid("recorded_by").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const arisanGroups = pgTable("arisan_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  punguanId: uuid("punguan_id").notNull().references(() => punguans.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  amountPerPeriod: integer("amount_per_period").notNull(),
  status: arisanStatusEnum("status").default("AKTIF").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const arisanParticipants = pgTable("arisan_participants", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => arisanGroups.id, { onDelete: "cascade" }),
  householdId: uuid("household_id").notNull().references(() => households.id, { onDelete: "cascade" }),
  joinDate: timestamp("join_date").defaultNow().notNull(),
  status: householdStatusEnum("status").default("AKTIF").notNull(),
});

export const arisanCycles = pgTable("arisan_cycles", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id").notNull().references(() => arisanGroups.id, { onDelete: "cascade" }),
  periodName: varchar("period_name", { length: 255 }).notNull(),
  cycleDate: date("cycle_date").notNull(),
  winnerHouseholdId: uuid("winner_household_id").notNull().references(() => households.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const announcements = pgTable("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  punguanId: uuid("punguan_id").notNull().references(() => punguans.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const statutes = pgTable("statutes", {
  id: uuid("id").primaryKey().defaultRandom(),
  punguanId: uuid("punguan_id").notNull().references(() => punguans.id, { onDelete: "cascade" }),
  type: statuteTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  preamble: text("preamble"),
  // Judul seksi pembuka. null = pakai DEFAULT_PREAMBLE_TITLE.
  preambleTitle: varchar("preamble_title", { length: 120 }),
  preamblePublished: boolean("preamble_published").default(true).notNull(),
  // Snapshot yang dilihat publik. null = belum pernah diterbitkan.
  publishedContent: jsonb("published_content").$type<PublishedStatute | null>(),
  publishedAt: timestamp("published_at"),
  publishedBy: uuid("published_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [unique("statutes_punguan_type_unique").on(t.punguanId, t.type)]);

export const statuteArticles = pgTable("statute_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  statuteId: uuid("statute_id").notNull().references(() => statutes.id, { onDelete: "cascade" }),
  babNumber: integer("bab_number").notNull(),
  babTitle: varchar("bab_title", { length: 255 }).notNull(),
  pasalNumber: integer("pasal_number").notNull(),
  pasalTitle: varchar("pasal_title", { length: 255 }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Dana bertujuan, mis. "Dana Bona Taon 2027". Berbeda dengan iuran: setoran
// bersifat sukarela, nominalnya bebas, dan ada bulan yang kosong.
export const tabunganFunds = pgTable("tabungan_funds", {
  id: uuid("id").primaryKey().defaultRandom(),
  punguanId: uuid("punguan_id").notNull().references(() => punguans.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  targetEvent: varchar("target_event", { length: 255 }),
  targetYear: integer("target_year"),
  targetAmount: integer("target_amount"),
  // Rekening tempat dana disimpan (opsional, untuk rekap TRANSFER).
  bankName: varchar("bank_name", { length: 100 }),
  bankAccount: varchar("bank_account", { length: 100 }),
  status: tabunganFundStatusEnum("status").default("AKTIF").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Buku besar satu dana: uang masuk (SETORAN) dan uang keluar (PENGEMBALIAN ke
// anggota yang keluar, PENGELUARAN biaya). TRANSFER hanya memindahkan kas tunai
// ke rekening, jadi tidak mengubah dana terkumpul. PENYESUAIAN untuk koreksi.
export const tabunganTransactions = pgTable("tabungan_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  fundId: uuid("fund_id").notNull().references(() => tabunganFunds.id, { onDelete: "cascade" }),
  punguanId: uuid("punguan_id").notNull().references(() => punguans.id, { onDelete: "cascade" }),
  // Keluarga penyetor / penerima pengembalian. null untuk TRANSFER & PENGELUARAN umum.
  householdId: uuid("household_id").references(() => households.id, { onDelete: "set null" }),
  type: tabunganTxTypeEnum("type").notNull(),
  // Rupiah. Positif untuk semua tipe; hanya PENYESUAIAN yang boleh negatif.
  amount: integer("amount").notNull(),
  transactionDate: date("transaction_date").notNull(),
  // Periode untuk matriks rekap bulanan (mis. setoran Agustus 2026).
  periodMonth: integer("period_month"),
  periodYear: integer("period_year"),
  description: text("description"),
  recordedBy: uuid("recorded_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pertemuan bulanan beserta tuan rumahnya, yang bergilir antar keluarga.
export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  punguanId: uuid("punguan_id").notNull().references(() => punguans.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }),
  meetingDate: date("meeting_date"),
  periodMonth: integer("period_month"),
  periodYear: integer("period_year"),
  hostHouseholdId: uuid("host_household_id").references(() => households.id, { onDelete: "set null" }),
  // Dana yang setorannya dikumpulkan pada pertemuan ini (opsional).
  fundId: uuid("fund_id").references(() => tabunganFunds.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type PengurusEntry = {
  jabatan: string;
  /** Wilayah komisaris, mis. "Cilincing-Kb Baru". */
  wilayah?: string | null;
  orang: string[];
};

export type PengurusStruktur = {
  /** Nama resmi kepengurusan, kalau beda dengan nama punguan. */
  judul?: string | null;
  periode: string;
  entries: PengurusEntry[];
};

export type PublishedArticle = {
  babNumber: number;
  babTitle: string;
  pasalNumber: number;
  pasalTitle: string | null;
  content: string;
};

export type PublishedStatute = {
  title: string;
  preamble: string | null;
  // Opsional: snapshot lama terbit sebelum judul pembuka bisa diubah.
  preambleTitle?: string | null;
  articles: PublishedArticle[];
};

export const usersRelations = relations(users, ({ many }) => ({
  punguanUsers: many(punguanUsers),
}));

export const punguansRelations = relations(punguans, ({ many }) => ({
  punguanUsers: many(punguanUsers),
  households: many(households),
  iuranSettings: many(iuranSettings),
  iuranBills: many(iuranBills),
  arisanGroups: many(arisanGroups),
  announcements: many(announcements),
  statutes: many(statutes),
  tabunganFunds: many(tabunganFunds),
  meetings: many(meetings),
}));

export const statutesRelations = relations(statutes, ({ one, many }) => ({
  punguan: one(punguans, { fields: [statutes.punguanId], references: [punguans.id] }),
  articles: many(statuteArticles),
}));

export const statuteArticlesRelations = relations(statuteArticles, ({ one }) => ({
  statute: one(statutes, { fields: [statuteArticles.statuteId], references: [statutes.id] }),
}));

export const householdsRelations = relations(households, ({ one, many }) => ({
  punguan: one(punguans, { fields: [households.punguanId], references: [punguans.id] }),
  members: many(members),
  iuranBills: many(iuranBills),
  arisanParticipants: many(arisanParticipants),
  tabunganTransactions: many(tabunganTransactions),
}));

export const iuranBillsRelations = relations(iuranBills, ({ one, many }) => ({
  household: one(households, { fields: [iuranBills.householdId], references: [households.id] }),
  payments: many(iuranPayments),
}));

export const tabunganFundsRelations = relations(tabunganFunds, ({ one, many }) => ({
  punguan: one(punguans, { fields: [tabunganFunds.punguanId], references: [punguans.id] }),
  transactions: many(tabunganTransactions),
  meetings: many(meetings),
}));

export const tabunganTransactionsRelations = relations(tabunganTransactions, ({ one }) => ({
  fund: one(tabunganFunds, { fields: [tabunganTransactions.fundId], references: [tabunganFunds.id] }),
  household: one(households, { fields: [tabunganTransactions.householdId], references: [households.id] }),
  recorder: one(users, { fields: [tabunganTransactions.recordedBy], references: [users.id] }),
}));

export const meetingsRelations = relations(meetings, ({ one }) => ({
  punguan: one(punguans, { fields: [meetings.punguanId], references: [punguans.id] }),
  host: one(households, { fields: [meetings.hostHouseholdId], references: [households.id] }),
  fund: one(tabunganFunds, { fields: [meetings.fundId], references: [tabunganFunds.id] }),
}));
