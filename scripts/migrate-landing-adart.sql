-- Landing page publik per tenant + AD/ART.
-- Aditif dan idempotent: tidak ada DROP/TRUNCATE, aman dijalankan ulang.

ALTER TABLE "punguans" ADD COLUMN IF NOT EXISTS "slug" varchar(63);
ALTER TABLE "punguans" ADD COLUMN IF NOT EXISTS "landing_published" boolean DEFAULT false NOT NULL;
ALTER TABLE "punguans" ADD COLUMN IF NOT EXISTS "tagline" varchar(255);
ALTER TABLE "punguans" ADD COLUMN IF NOT EXISTS "about" text;
ALTER TABLE "punguans" ADD COLUMN IF NOT EXISTS "contact_phone" varchar(50);
ALTER TABLE "punguans" ADD COLUMN IF NOT EXISTS "contact_email" varchar(255);
ALTER TABLE "punguans" ADD COLUMN IF NOT EXISTS "contact_address" text;

-- slug masih NULL untuk semua baris lama; Postgres mengizinkan banyak NULL
-- di kolom unique, jadi constraint ini tidak perlu menghapus data apa pun.
DO $$ BEGIN
  ALTER TABLE "punguans" ADD CONSTRAINT "punguans_slug_unique" UNIQUE("slug");
EXCEPTION WHEN duplicate_table OR duplicate_object THEN NULL;
END $$;

ALTER TABLE "announcements" ADD COLUMN IF NOT EXISTS "is_public" boolean DEFAULT false NOT NULL;

DO $$ BEGIN
  CREATE TYPE "public"."statute_type" AS ENUM('AD', 'ART');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "statutes" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "punguan_id" uuid NOT NULL,
  "type" "statute_type" NOT NULL,
  "title" varchar(255) NOT NULL,
  "preamble" text,
  "published_content" jsonb,
  "published_at" timestamp,
  "published_by" uuid,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "statutes_punguan_type_unique" UNIQUE("punguan_id","type")
);

CREATE TABLE IF NOT EXISTS "statute_articles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "statute_id" uuid NOT NULL,
  "bab_number" integer NOT NULL,
  "bab_title" varchar(255) NOT NULL,
  "pasal_number" integer NOT NULL,
  "pasal_title" varchar(255),
  "content" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

DO $$ BEGIN
  ALTER TABLE "statutes" ADD CONSTRAINT "statutes_punguan_id_punguans_id_fk"
    FOREIGN KEY ("punguan_id") REFERENCES "public"."punguans"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "statutes" ADD CONSTRAINT "statutes_published_by_users_id_fk"
    FOREIGN KEY ("published_by") REFERENCES "public"."users"("id");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "statute_articles" ADD CONSTRAINT "statute_articles_statute_id_statutes_id_fk"
    FOREIGN KEY ("statute_id") REFERENCES "public"."statutes"("id") ON DELETE cascade;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
