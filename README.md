# HorasHub 🔴⚪⚫ 

**HorasHub** adalah platform *open-source* berbasis web yang dirancang khusus untuk mempermudah tata kelola, manajemen anggota, dan transparansi administrasi **Punguan Batak** (perkumpulan marga, sektor, atau kedaerahan). 

Proyek ini bertujuan mendigitalisasi proses manual seperti pencatatan data anggota (*Punguan*), Iuran bulanan, hingga Arisan perkumpulan agar menjadi lebih rapi, terintegrasi, dan mudah diakses oleh pengurus (*Ketua, Sekretaris, Bendahara*).

---

## 🌟 Fitur Utama

1. **Manajemen Keanggotaan**
   * Pencatatan data keluarga (*KK*) lengkap dengan *Panggoaran* (panggilan kehormatan adat, misal: *Ama ni X* atau *Ompu ni Y*).
   * Pengelompokan berdasarkan **Sektor** wilayah dan silsilah keturunan (**Pomparan** & nomor keturunan).
   * Status keanggotaan terintegrasi (Aktif, Pindah, Meninggal).

2. **Manajemen Keuangan (Iuran Punguan)**
   * Pengaturan besaran iuran bulanan per Punguan.
   * Pembuatan tagihan (*Bills*) berkala per keluarga secara otomatis.
   * Pencatatan pembayaran (*Payments*) real-time yang dicatat langsung oleh Bendahara.

3. **Sistem Arisan Punguan**
   * Pembuatan kelompok arisan di dalam Punguan.
   * Pencatatan peserta arisan per KK.
   * Sistem penentuan yang menerima Arisan.

4. **Papan Pengumuman (*Announcements*)**
   * Fitur bagi pengurus untuk menyiarkan info kegiatan, berita duka/suka, atau rapat kerja.

5. **Multi-Role Access Control (RBAC)**
   * Hak akses login yang disesuaikan dengan posisi kepengurusan: **Ketua**, **Sekretaris**, dan **Bendahara**.

---

## 🛠️ Tech Stack

HorasHub dibangun dengan teknologi web modern untuk menjamin performa terbaik dan mempermudah kontributor untuk mulai mengembangkan kode:

* **Framework**: [Next.js 16](https://nextjs.org/) (App Router) & [React 19](https://react.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) & [@base-ui/react](https://base-ui.com/)
* **Database & ORM**: [Neon Serverless Postgres](https://neon.tech/) & [Drizzle ORM](https://orm.drizzle.team/)
* **Authentication**: [Next-Auth v5 (Beta)](https://authjs.dev/)
* **Language**: [TypeScript](https://www.typescriptlang.org/)

---

## 🤝 Mari Berkontribusi! (Beta Hita Marpartisipasi)

Proyek ini dibangun dari kita, untuk kita. Kami sangat mengundang rekan-rekan developer Batak (dan siapa saja yang tertarik) untuk berkontribusi memberikan saran, melaporkan *bug*, atau menulis kode guna memajukan tata kelola Punguan orang tua kita di perantauan maupun di kampung halaman.

### Cara Berkontribusi:
1. **Beri Masukan / Saran (Feedback)**
   * Buka [Issues](https://github.com/martinsiregar/horas-hub/issues) untuk melaporkan kendala atau mendiskusikan usulan fitur baru (seperti fitur pengurusan adat *Saur Matua*, undangan pernikahan adat, dsb).
2. **Kirim Pull Request (PR)**
   * *Fork* repositori ini.
   * Buat branch baru untuk fitur Anda (`git checkout -b fitur/nama-fitur`).
   * Commit perubahan Anda dengan deskripsi yang jelas.
   * *Push* ke branch Anda dan ajukan *Pull Request*.
3. **Diskusi**
   * Punya ide arsitektur atau integrasi lainnya? Silakan diskusikan di tab **Discussions**.

---

## ⚙️ Cara Menjalankan Proyek Secara Lokal

### 1. Clone Repositori
```bash
git clone https://github.com/martinsiregar/horas-hub.git
cd horas-hub
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Konfigurasi Environment Variables
Salin file `.env.example` menjadi `.env.local`:
```bash
cp .env.example .env.local
```
Silakan lengkapi variabel berikut di dalam `.env.local`:
* `DATABASE_URL` (Gunakan URL database PostgreSQL Anda, misal dari Neon)
* `AUTH_SECRET` (Gunakan token acak untuk enkripsi sesi Next-Auth, bisa dibuat lewat `openssl rand -base64 33`)

### 4. Sinkronisasi Skema Database & Seeding
Untuk membuat tabel di database Anda dan mengisi data simulasi awal:
```bash
# Sinkronisasi skema tabel database
npm run db:push

# Menjalankan script seed data awal
npm run db:seed
```

### 5. Jalankan Development Server
```bash
npm run dev
```
Buka [http://localhost:3000](http://localhost:3000) untuk melihat hasilnya secara lokal.

---
*Horas! Selamat berkoding dan berkontribusi untuk komunitas Batak yang lebih modern! 🚀*

