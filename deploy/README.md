# Deploy HorasHub ke VPS — punguan.web.id

Target akhir: `https://punguan.web.id` (aplikasi pengurus) dan `https://<slug>.punguan.web.id`
(landing page publik per punguan), auto-deploy tiap push ke `main`.

Arsitektur: **Nginx** (TLS + reverse proxy) → **container Docker** di `127.0.0.1:3001`
→ **Neon Postgres** (tetap remote, tidak ada Postgres di VPS).

CI/CD: GitHub Actions **build image** → push ke **GHCR** (`ghcr.io/martin72gar/horas-hub:<sha>`) →
SSH ke VPS → `scripts/deploy.sh` hanya `docker compose pull` + `up -d`. **Tidak ada build di VPS**,
jadi RAM server tidak dipakai untuk compile dan rollback tinggal tunjuk tag image lama.

Spesifikasi VPS minimum: 1 vCPU / 1 GB RAM, Ubuntu 24.04. VPS ini juga menjalankan aplikasi lain
(`/srv/rasor` di port 3000, `/var/www/nirmala` di 5000), jadi HorasHub memakai **3001** — diatur lewat
`APP_PORT` di `deploy/docker-compose.yml` dan harus sama dengan `proxy_pass` di `deploy/nginx-punguan.conf`. Swap tidak lagi wajib karena `next build` jalan di GitHub Actions.

---

## 1. Arahkan domain ke IP VPS

Aplikasi butuh **wildcard**: setiap punguan dapat subdomain sendiri. Sertifikat wildcard hanya bisa
diterbitkan lewat tantangan **DNS-01**, jadi DNS sebaiknya di provider yang punya API — paling mudah
Cloudflare (gratis).

1. Daftar di Cloudflare → **Add a site** → `punguan.web.id` → pilih plan **Free**.
2. Cloudflare memberi 2 nameserver (mis. `dana.ns.cloudflare.com`). Masuk ke panel registrar `.web.id`
   (Rumahweb/Domainesia/Niagahoster/…) → **Ubah Nameserver** → isi kedua NS Cloudflare. Propagasi 5 menit–2 jam.
3. Di Cloudflare → **DNS** → tambahkan (ganti `203.0.113.10` dengan IP VPS):

   | Type | Name | Content | Proxy |
   |---|---|---|---|
   | A | `@`   | `203.0.113.10` | **DNS only** (abu-abu) |
   | A | `*`   | `203.0.113.10` | **DNS only** |
   | A | `www` | `203.0.113.10` | **DNS only** |

   Biarkan **DNS only** dulu supaya sertifikat mudah diverifikasi dan debugging jelas. Setelah live boleh
   dinyalakan proxy (oranye) dengan SSL mode **Full (strict)**.
4. Cek dari laptop:

   ```bash
   dig +short punguan.web.id; dig +short apa-saja.punguan.web.id
   ```

   Keduanya harus mengembalikan IP VPS.

> Kalau registrar tidak mengizinkan pindah NS: pakai provider DNS lain yang didukung plugin certbot
> (Route53, DigitalOcean, dsb.), atau proxy penuh lewat Cloudflare + **Origin CA certificate**
> (sertifikat wildcard 15 tahun, tanpa renewal) sebagai pengganti langkah 6.

---

## 2. Setup dasar VPS

SSH sebagai root: `ssh root@203.0.113.10`

### 2.1 User aplikasi

```bash
adduser --disabled-password --gecos "" deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

### 2.2 Firewall

```bash
ufw allow OpenSSH && ufw allow 'Nginx Full' && ufw --force enable
```

### 2.3 Swap (opsional, tidak lagi wajib — build tidak jalan di sini)

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

### 2.4 Docker, Nginx, Certbot

```bash
curl -fsSL https://get.docker.com | sh
usermod -aG docker deploy          # deploy bisa jalankan docker tanpa sudo
apt-get install -y nginx git certbot python3-certbot-nginx python3-certbot-dns-cloudflare
docker --version && docker compose version
```

Node **tidak perlu** dipasang di VPS — build terjadi di GitHub Actions, runtime ada di dalam image.

---

## 3. Ambil kode ke VPS

Yang dibutuhkan VPS dari repo hanya `deploy/docker-compose.yml` dan `scripts/deploy.sh` — kode aplikasi
sudah ada di dalam image. Repo tetap di-clone supaya konfigurasi ikut ter-versi bersama commit
(rollback mengembalikan compose file dan script sekaligus).

Repo privat → pakai **deploy key** (read-only, khusus repo ini).

```bash
su - deploy
ssh-keygen -t ed25519 -C "vps-punguan" -f ~/.ssh/id_ed25519 -N ""
cat ~/.ssh/id_ed25519.pub
```

Salin isinya ke GitHub → repo → **Settings › Deploy keys › Add deploy key** (biarkan *Allow write access* mati).

```bash
sudo mkdir -p /var/www && sudo chown deploy:deploy /var/www
git clone git@github.com:<user>/<repo>.git /var/www/horas-hub
cd /var/www/horas-hub
```

---

## 4. Environment variables

File ini dipakai **hanya saat runtime**, dibaca lewat `env_file` di `deploy/docker-compose.yml`.
Nilai `NEXT_PUBLIC_*` yang ditanam ke bundel klien diatur terpisah sebagai Actions *variable* (langkah 8.2).

```bash
sudo mkdir -p /etc/horashub
sudo nano /etc/horashub/app.env
```

```ini
NODE_ENV=production
PORT=3000                 # port DI DALAM container — jangan diubah; yang dipetakan ke host adalah APP_PORT
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
AUTH_SECRET=ganti-dengan-hasil-openssl-rand-base64-32
AUTH_URL=https://punguan.web.id
AUTH_TRUST_HOST=true
NEXT_PUBLIC_ROOT_DOMAIN=punguan.web.id
```

```bash
openssl rand -base64 32          # untuk AUTH_SECRET
sudo chown root:deploy /etc/horashub/app.env && sudo chmod 640 /etc/horashub/app.env
```

Catatan penting:
- `AUTH_TRUST_HOST=true` wajib karena Next-Auth berada di belakang reverse proxy.
- `NEXT_PUBLIC_ROOT_DOMAIN` **tidak boleh** memakai skema/port. Kalau nilai ini diubah, ubah **juga**
  Actions variable-nya lalu jalankan **Run workflow** — build ulang, bukan sekadar restart container.
- Setelah mengubah file ini: `docker compose -f deploy/docker-compose.yml up -d` (restart saja tidak
  memuat ulang `env_file`).

---

## 5. Login GHCR + start pertama

GHCR untuk repo privat butuh autentikasi. Buat **classic PAT** di GitHub
(**Settings › Developer settings › Tokens (classic)**) dengan scope **`read:packages`** saja, lalu:

```bash
su - deploy
echo 'ghp_xxxTOKEN' | docker login ghcr.io -u martin72gar --password-stdin
```

Kredensial tersimpan di `~/.docker/config.json`, jadi CI **dan** rollback manual sama-sama bisa pull.

Push dulu ke `main` sekali supaya image pertama terbit, lalu:

```bash
cd /var/www/horas-hub
./scripts/deploy.sh $(git rev-parse HEAD)
curl -I http://127.0.0.1:3001/login     # harus 200
```

Gagal? `docker compose -f deploy/docker-compose.yml logs -f app`.

Container di-restart otomatis oleh Docker (`restart: unless-stopped`), termasuk setelah VPS reboot —
tidak perlu unit systemd lagi.

---

## 6. Nginx + sertifikat wildcard

### 6.1 Token Cloudflare untuk DNS-01

Cloudflare → **My Profile › API Tokens › Create Token** → template **Edit zone DNS** → Zone Resources:
`Include › Specific zone › punguan.web.id` → salin tokennya.

```bash
sudo mkdir -p /root/.secrets
sudo sh -c 'echo "dns_cloudflare_api_token = TOKEN_ANDA" > /root/.secrets/cloudflare.ini'
sudo chmod 600 /root/.secrets/cloudflare.ini
```

### 6.2 Terbitkan sertifikat

```bash
sudo certbot certonly --dns-cloudflare --dns-cloudflare-credentials /root/.secrets/cloudflare.ini --dns-cloudflare-propagation-seconds 30 -d punguan.web.id -d '*.punguan.web.id' -m email@anda.com --agree-tos --no-eff-email
```

### 6.3 Aktifkan konfigurasi Nginx

```bash
sudo cp /var/www/horas-hub/deploy/nginx-punguan.conf /etc/nginx/sites-available/punguan.web.id
sudo ln -sf /etc/nginx/sites-available/punguan.web.id /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

Renewal otomatis lewat timer bawaan certbot. Uji sekali dengan `sudo certbot renew --dry-run`, lalu
pastikan Nginx ikut reload setelah renew:

```bash
sudo sh -c 'printf "#!/bin/sh\nsystemctl reload nginx\n" > /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh'
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

---

## 7. Skema database & akun pertama

Dijalankan **manual dari laptop**, sengaja tidak dimasukkan ke CI supaya tidak ada perubahan skema
yang tak sengaja ter-push. Neon itu remote, jadi VPS tidak perlu ikut campur (dan memang tidak punya Node).

```bash
# di laptop, di dalam repo, dengan DATABASE_URL produksi
DATABASE_URL='postgresql://...neon.tech/neondb?sslmode=require' npx drizzle-kit push
DATABASE_URL='...' npm run db:seed     # akun superadmin awal — cek src/db/seed.ts, ganti passwordnya
```

---

## 8. GitHub Actions

Tidak perlu aturan sudoers: user `deploy` sudah anggota grup `docker` (langkah 2.4).

### 8.1 Kunci SSH khusus CI

Dijalankan di **laptop**, bukan di VPS:

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/horashub_ci -N ""
ssh-copy-id -i ~/.ssh/horashub_ci.pub deploy@203.0.113.10
ssh-keyscan -H 203.0.113.10          # outputnya untuk VPS_KNOWN_HOSTS
cat ~/.ssh/horashub_ci               # private key, untuk VPS_SSH_KEY
```

### 8.2 Secrets & variables

GitHub → repo → **Settings › Secrets and variables › Actions**:

| Jenis | Nama | Isi |
|---|---|---|
| Secret | `VPS_HOST` | `203.0.113.10` |
| Secret | `VPS_USER` | `deploy` |
| Secret | `VPS_SSH_KEY` | isi lengkap `~/.ssh/horashub_ci` (termasuk baris BEGIN/END) |
| Secret | `VPS_KNOWN_HOSTS` | output `ssh-keyscan` |
| Variable | `NEXT_PUBLIC_ROOT_DOMAIN` | `punguan.web.id` — **wajib**, di-inline ke bundel klien saat build |
| Variable | `VPS_PORT` | opsional, hanya bila port SSH bukan 22 |

`NEXT_PUBLIC_ROOT_DOMAIN` harus ada di **dua** tempat: sebagai Actions *variable* (dipakai saat build)
dan di `/etc/horashub/app.env` (dipakai kode server saat runtime). Nilainya harus sama.

Push ke GHCR memakai `GITHUB_TOKEN` bawaan Actions — tidak ada secret registry yang perlu dibuat.

### 8.3 Jalankan

`.github/workflows/deploy.yml` dan `scripts/deploy.sh` sudah ada di repo. Commit + push ke `main`,
lalu pantau tab **Actions**. Bisa juga dijalankan manual lewat **Run workflow**.

Alur lengkap: Actions `docker build` (+ cache GHA) → push `ghcr.io/martin72gar/horas-hub:<sha>` dan
`:latest` → SSH ke VPS → `deploy.sh`: `git reset --hard <sha>` → `docker compose pull` →
`up -d` → health check ke `/login` (gagal ⇒ job merah + log container dicetak).

---

## 9. Verifikasi live

```bash
curl -I http://127.0.0.1:3001/login                   # 200 (langsung ke container)
curl -I https://punguan.web.id/login                  # 200 (lewat Nginx)
curl -I https://www.punguan.web.id                    # 301 ke apex
curl -sI https://coba-saja.punguan.web.id | head -1   # 404 = wildcard + rewrite tenant jalan
```

Lalu di browser: login sebagai pengurus, buat punguan + slug di **Pengaturan**, dan buka
`https://<slug>.punguan.web.id` — landing page publik harus tampil tanpa diminta login.

---

## 10. Operasional

```bash
cd /var/www/horas-hub
docker compose -f deploy/docker-compose.yml logs -f app    # log aplikasi
docker compose -f deploy/docker-compose.yml restart app     # restart manual
docker ps                                                   # semua app di VPS ini
sudo tail -f /var/log/nginx/error.log                       # log nginx
```

**Rollback** ke commit sebelumnya (beberapa detik, image lama masih ada di cache lokal):

```bash
cd /var/www/horas-hub && ./scripts/deploy.sh <sha-lama>
```

Kalau image lama sudah ter-prune dari VPS, `deploy.sh` otomatis pull ulang dari GHCR.
Butuh cepat tanpa menyentuh git:

```bash
IMAGE_TAG=<sha-lama> docker compose -f deploy/docker-compose.yml up -d
```

**Masalah yang sering muncul**

| Gejala | Penyebab |
|---|---|
| Subdomain menampilkan halaman login, bukan landing page | `NEXT_PUBLIC_ROOT_DOMAIN` salah, atau belum build ulang setelah diubah |
| `Configuration` error saat login | `AUTH_SECRET` kosong atau `AUTH_TRUST_HOST` belum `true` |
| Redirect loop setelah proxy Cloudflare dinyalakan | SSL mode Cloudflare masih *Flexible* — ubah ke **Full (strict)** |
| Deploy gagal di step `pull` | `docker login ghcr.io` di VPS kedaluwarsa/belum ada (langkah 5) |
| `port is already allocated` saat `up -d` | port 3001 direbut app lain — cek `sudo ss -tulpn \| grep LISTEN`, ganti `APP_PORT` + `proxy_pass` |
| Nginx 502 padahal container jalan | `proxy_pass` dan `APP_PORT` beda angka |
| Sertifikat gagal terbit | Token Cloudflare salah zona, atau NS domain belum menunjuk ke Cloudflare |
