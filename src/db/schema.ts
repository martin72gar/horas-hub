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
}));

export const iuranBillsRelations = relations(iuranBills, ({ one, many }) => ({
  household: one(households, { fields: [iuranBills.householdId], references: [households.id] }),
  payments: many(iuranPayments),
}));
