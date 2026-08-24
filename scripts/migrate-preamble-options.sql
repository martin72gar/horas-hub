-- Judul seksi pembuka yang bisa diganti (Pendahuluan/Pembukaan/Penjelasan) dan
-- saklar terbit terpisah, supaya teks pembuka bisa disimpan tanpa tampil publik.
ALTER TABLE statutes ADD COLUMN IF NOT EXISTS preamble_title varchar(120);
ALTER TABLE statutes ADD COLUMN IF NOT EXISTS preamble_published boolean NOT NULL DEFAULT true;
