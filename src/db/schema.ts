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
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["KETUA", "SEKRETARIS", "BENDAHARA"]);
export const householdStatusEnum = pgEnum("household_status", ["AKTIF", "PINDAH", "MENINGGAL"]);
export const memberRelationEnum = pgEnum("member_relation", ["KEPALA", "ISTRI", "ANAK", "LAINNYA"]);
export const memberGenderEnum = pgEnum("member_gender", ["L", "P"]);
export const billStatusEnum = pgEnum("bill_status", ["BELUM_BAYAR", "SEBAGIAN", "LUNAS"]);
export const arisanStatusEnum = pgEnum("arisan_status", ["AKTIF", "SELESAI"]);

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
  createdBy: uuid("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

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
