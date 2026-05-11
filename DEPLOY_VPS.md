## Deploy AlgoodeDesk ke Hostinger VPS KVM 2 (Docker)

Dokumen ini menjelaskan langkah lengkap deploy ke **Hostinger VPS KVM 2** dengan stack:

| Service       | Kontainer Docker | Penjelasan singkat                                      |
|---------------|------------------|---------------------------------------------------------|
| `web`         | nginx + build React | Halaman aplikasi yang dibuka pengguna (`:8090` di VPS) |
| `backend`     | Node.js Express   | API di `/api`; di dalam Docker tetap mendengarkan `5000` |
| `mysql`       | MySQL 8           | Basis data; untuk stack ini dipublikasikan ke host `3307` |
| `phpmyadmin`  | phpMyAdmin        | Web UI untuk kelola DB; host `8082`                     |

Orkestrasi: file `docker-compose.yml` di root repo.

**Dua file nginx (jangan tertukar):**

| Lokasi repo | Dipakai di mana | Fungsi |
|-------------|-----------------|--------|
| `frontend/nginx.conf` | Di **dalam** container `web` (image Docker yang kita build) | Beri file React SPA, reverse proxy **`/api`** dan **`/uploads`** ke service `backend` di jaringan Docker. Harus ada agar aplikasi bisa login & panggil API lewat jalur sama-origin `/api`. |
| `deploy/nginx-algoodesk.iwareid.com.conf` | Di **VPS sebagai Nginx utama** (`/etc/nginx/sites-available/` …) | Menerjemahkan subdomain publik **`algoodesk.iwareid.com`** (port **80/443**) ke **`http://127.0.0.1:8090`** tempat container `web` dipublish. Ini **opsional**, dipakai bila Anda ingin akses tanpa `:8090` + HTTPS pakai Let's Encrypt di host. |

---

### Port di VPS ini (penting dibaca)

**Di satu VPS bisa jalan beberapa aplikasi Docker sekaligus.** Setiap aplikasi biasanya “mempublish” port ke VPS. Kalau dua stack memakai **nomor port host yang sama** (misalnya keduanya mau `:5000`), container baru akan gagal start dengan pesan seperti *address already in use*.

Oleh karena itu, compose di repo ini memakai **port host yang sengaja dijauhkan** dari stack umum (misal aplikasi lain sering pakai **80**, **8080**, **5000**, **8081**, **mysql 3306**):

| Nama service (`docker-compose`) | Port **di luar** VPS (yang kamu buka di browser / client) | Port **di dalam** container (jarang perlu diketahui) |
|--------------------------------|-----------------------------------------------------------|-------------------------------------------------------|
| `web`                         | **8090** → ke nginx port 80                               | nginx `80`                                            |
| `backend`                     | **5001** → ke aplikasi backend                            | backend `5000`                                        |
| `phpmyadmin`                  | **8082**                                                  | apache `80`                                           |
| `mysql`                       | **3307** → ke server MySQL stack ini                       | mysql `3306`                                          |

**Yang penting dipahami:**

- **Frontend** sudah dibuild dengan memanggil API lewat jalur sama-origin: `/api`. Nginx di container `web` meneruskan `/api` ke service `backend:5000` **di dalam jaringan Docker**. Jadi untuk pemakaian normal, cukup buka **`http://IP_VPS:8090/`** dan **tidak perlu** memanggil `:5001` dari browser untuk halaman web.
- **Port `5001`** berguna untuk: cek API langsung, debugging, atau tool lain dari luar container (opsional): `http://IP_VPS:5001/api/health`.
- **Port `3307`** ada agar Anda bisa akses MySQL dari **mesin Anda** pakai GUI (DBeaver, dll.) jika dibutuhkan. Untuk produksi yang ketat, **jangan expose MySQL ke internet** atau batasi lewat firewall + IP whitelist.

Kalau salah satu port host di atas **masih bentrok** dengan layanan lain di VPS-mu, ubah bilangan **kiri** pada baris `ports` di `docker-compose.yml` (format `HOST:CONTAINER` — ubah yang `HOST` saja).

---

### 0) Persiapan di Hostinger (hPanel)

1. Login ke **hPanel Hostinger**.
2. Masuk ke menu **VPS → Kelola** pada VPS KVM 2 kamu.
3. Catat:
   - **IP Address VPS**
   - **User & Port SSH** (biasanya `root` dan port `22`, kecuali diubah).
4. Untuk akses aplikasi pakai subdomain **algoodesk.iwareid.com** ( zona DNS untuk domain **iwareid.com**, misalnya di Hostinger hPanel → **Domains → DNS / Nameservers → DNS records** ):
   - Buat rekaman **tipe A**:
     - **Name / Host:** `algoodesk`  
     - **Points to:** `IP VPS`  
     - **TTL:** default (3600 atau Auto)
   - Setelah tersebar DNS (kadang beberapa menit–jam), cek: `ping algoodesk.iwareid.com` harus menunjuk ke IP VPS.

---

### Subdomain prod (disarankan): `algoodesk.iwareid.com` + Nginx di VPS

Gunakan blok ini ketika Anda ingin pengguna membuka **`https://algoodesk.iwareid.com`** tanpa `:8090`. Asumsi stack Docker sudah aktif (**bagian 5**) dan **`web`** mempublish **8090** seperti di compose.

#### A) Pasang nginx di VPS (Ubuntu)

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

#### B) Aktifkan config dari repo ini

Salin dari folder project (mis. `/opt/algoodesk`) ke lokasi nginx:

```bash
cd /opt/algoodesk
sudo cp deploy/nginx-algoodesk.iwareid.com.conf /etc/nginx/sites-available/algoodesk.iwareid.com
sudo ln -sf /etc/nginx/sites-available/algoodesk.iwareid.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Cek cepat dari VPS:

```bash
curl -sI -H 'Host: algoodesk.iwareid.com' http://127.0.0.1/
```

Kalau subdomain DNS sudah benar dan tidak ada blokir firewall, dari browser Anda bisa akses **`http://algoodesk.iwareid.com/`** (belum HTTPS).

#### C) HTTPS dengan Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d algoodesk.iwareid.com
```

Sesudah dapat sertifikat, Certbot biasanya akan menyesuaikan `server` blok port 443; ikuti petunjuk di terminal atau sesuaikan manual mengacu komentar di dalam `deploy/nginx-algoodesk.iwareid.com.conf`.

#### D) Firewall

```bash
ufw allow 'Nginx Full'   # membuka 80 + 443, atau secara manual: allow 80,443/tcp
ufw status
```

#### E) CORS untuk HTTPS

Untuk akses subdomain + HTTPS dari browser, lebih aman set di `.env` (lalu jalankan lagi `docker compose up -d`):

```env
CORS_ORIGIN=https://algoodesk.iwareid.com,http://algoodesk.iwareid.com
```

#### F) Opsional — kunci akses langsung port 8090

Setelah nginx host stabil, Anda bisa menyempitkan publikasi container `web` agar **hanya localhost** bisa hit `8090`:

- Di `docker-compose.yml`, ganti baris `web` menjadi: `"127.0.0.1:8090:80"`

Lalu: `docker compose up -d`. Pengunjung publik tetap pakai subdomain lewat nginx; tidak bisa lagi buka `http://IP_VPS:8090` dari luar (hanya berguna bersama blok **F**, bukan untuk uji pertama).

---

### 1) SSH ke VPS

Di komputer lokal (Windows, pakai PowerShell / CMD):

```bash
ssh root@IP_VPS
```

Kalau port SSH berbeda (misal 65002):

```bash
ssh root@IP_VPS -p 65002
```

---

### 2) Install Docker & Docker Compose di VPS

**Contoh untuk Ubuntu 22.04 template Hostinger:**

```bash
apt update
apt install -y ca-certificates curl gnupg

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

docker --version
docker compose version
```

> Kalau OS kamu bukan Ubuntu, sesuaikan dengan panduan resmi Docker untuk distro tersebut.

---

### 3) Clone / upload project ke VPS

Masih di dalam VPS (SSH):

**Jika pakai Git:**

```bash
cd /opt
git clone <URL_REPO_KAMU> algoodesk
cd algoodesk
```

**Jika upload ZIP dari lokal:**

1. Upload folder/ZIP via **SFTP** (FileZilla / WinSCP) ke VPS, misal ke `/opt/algoodesk`.
2. Di VPS:

   ```bash
   cd /opt/algoodesk
   ```

Pastikan di dalam folder ada file `docker-compose.yml`.

---

### 4) Buat file .env untuk docker-compose

Di root project (sejajar `docker-compose.yml`):

```bash
cd /opt/algoodesk
nano .env
```

Isi minimal seperti ini (ganti password & secret):

```env
MYSQL_ROOT_PASSWORD=isi_password_root_mysql
MYSQL_DATABASE=algoodesk
MYSQL_USER=algoodesk
MYSQL_PASSWORD=isi_password_user_db
JWT_SECRET=isi_secret_jwt_panjang

# Untuk subdomain + HTTPS pakai nginx host:
# CORS_ORIGIN=https://algoodesk.iwareid.com,http://algoodesk.iwareid.com
# Untuk tes cepat (semua origin):
CORS_ORIGIN=*
```

Simpan: `CTRL + O`, Enter, lalu `CTRL + X`.

---

### 5) Build & jalankan container

Masih di folder project (`/opt/algoodesk`):

```bash
docker compose up -d --build
```

Tunggu hingga proses build selesai. Lalu cek status:

```bash
docker compose ps
```

Lihat log backend jika perlu:

```bash
docker compose logs -f --tail=200 backend
```

Kalau semua OK, akan ada service:

- `mysql`
- `phpmyadmin`
- `backend`
- `web` (nginx + frontend build)

**Cara cek cepat:**

- Browser: `http://IP_VPS:8090/`
- Atau dari VPS: `curl -s http://127.0.0.1:8090/api/health` (harus jawaban JSON sukses)

---

### 6) Firewall (UFW)

Buka port yang dipakai **host**:

```bash
ufw allow 8090/tcp  # aplikasi web
ufw allow 8082/tcp  # phpMyAdmin (opsional; lebih aman batasi ke IP kantor)
ufw status
```

**mysql `3307`:** jangan dibuka ke publik kecuali memang dibutuhkan dan sudah ada pembatasan (IP / VPN).

---

### 7) Cara akses setelah deploy

| Tujuan | URL / cara |
|--------|-------------|
| **Aplikasi (web)** | `http://IP_VPS:8090/` |
| **Aplikasi (subdomain nginx host)** | `https://algoodesk.iwareid.com/` (lihat blok **Subdomain prod** di atas — setelah HTTPS) |
| **Cek API lewat nginx (sama seperti browser)** | `http://IP_VPS:8090/api/health` atau `https://algoodesk.iwareid.com/api/health` |
| **API langsung ke container backend (debug)** | `http://IP_VPS:5001/api/health` |
| **phpMyAdmin** | `http://IP_VPS:8082/` |
| **MySQL dari PC (contoh host di DBeaver)** | host = `IP_VPS`, port = **3307**, user/password dari `.env` |

Tanpa subdomain: akses bisa `http://IP_VPS:8090/`. Dengan subdomain + config `deploy/nginx-algoodesk.iwareid.com.conf`, pengunjung memakai **tanpa `:8090`** (`https://algoodesk.iwareid.com/`).

---

### 8) Akun default aplikasi

Sesuai `backend/config/database.sql`:

- `superadmin / jasad666`
- `admin / password`

Segera ubah password setelah login pertama via menu manajemen user.

---

### 9) Update / redeploy versi baru

Jika pakai git:

```bash
cd /opt/algoodesk
git pull
docker compose up -d --build
```

Jika upload manual (ZIP/SFTP):

1. Stop sementara (opsional):

   ```bash
   docker compose down
   ```

2. Upload kode baru, timpa folder lama.
3. Jalankan lagi:

   ```bash
   docker compose up -d --build
   ```

---

### 10) Backup data penting

- **Database MySQL** tersimpan di volume `mysql_data` (persisten meskipun container dihapus).
- **File upload** dari backend tersimpan di volume `backend_uploads`.

Contoh backup database (ganti nama service jika beda; dari folder project yang sama dengan `docker-compose.yml`):

```bash
cd /opt/algoodesk
docker compose exec -T mysql mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > backup_algoodesk.sql
```

Atau tanpa variabel shell, isi manual user/database/password:

```bash
docker compose exec -T mysql mysqldump -ualgoodesk -p'PASSWORD_ANDA' algoodesk > backup_algoodesk.sql
```

---

### 11) HTTPS alternatif (Nginx Proxy Manager / Caddy)

Jika Anda **tidak** memakai file `deploy/nginx-algoodesk.iwareid.com.conf` di host, bisa juga:

1. Jalankan **Nginx Proxy Manager** atau **Caddy**.
2. Hostname: **`algoodesk.iwareid.com`** → upstream **`http://127.0.0.1:8090`** (port host service `web`).
3. Aktifkan **Let's Encrypt**.

Set **CORS** sama seperti blok **Subdomain prod** (`CORS_ORIGIN` berisi `https://algoodesk.iwareid.com`, dll.).

---

### 12) Troubleshooting singkat

| Gejala | Kemungkinan penyebab | Tindakan |
|--------|----------------------|----------|
| `bind: address already in use` saat `up` | Port host di `docker-compose.yml` masih dipakai stack lain | Ganti angka **kiri** di `ports`, lalu `docker compose up -d` lagi |
| Halaman web kosong / 502 | `web` atau `backend` belum healthy | `docker compose logs web` dan `docker compose logs backend` |
| Login / API gagal padahal web kebuka | CORS atau nginx host | Cek `CORS_ORIGIN` memuat `https://algoodesk.iwareid.com` (atau `*` untuk tes); header `X-Forwarded-Proto` di reverse proxy |
| phpMyAdmin tidak login | user DB bukan root dari luar | Pakai `MYSQL_USER` / `MYSQL_PASSWORD` dari `.env`, host `mysql` (dari phpmyadmin internal sudah benar) |

---

Dokumen ini selaras dengan `docker-compose.yml` di repo. Jika kamu mengubah port di compose, **sesuaikan juga** angka di bagian firewall dan “Cara akses” di atas.
