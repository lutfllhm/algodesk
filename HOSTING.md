# Panduan Hosting Lengkap AlgoodeDesk (Dari Nol sampai Online)

Isi panduan ini **satu jalur utama** yang bisa kamu ikuti dari awal. Target akhir:

- Docker menjalankan: **MySQL**, **backend** (Express), **web** (React + nginx), **phpMyAdmin**.
- Opsional tetapi disarankan: subdomain **`https://algoodesk.iwareid.com`** lewat nginx di VPS + HTTPS (Let’s Encrypt).

**Prasyarat di tangan Anda**

| Item | Keterangan |
|------|------------|
| VPS | Misalnya **Hostinger KVM 2** dengan **Ubuntu Server 22.04** (disarankan) |
| Akses | **SSH** sebagai `root` (atau user dengan `sudo`) + **IP publik** VPS |
| Domain | **iwareid.com** terdaftar; akan dipakai subdomain **`algoodesk.iwareid.com`** |
| Repo | URL Git proyek ini (atau ZIP salinan folder project) |

---

## Bagian A — Ringkasan arsitektur & port

**Alur pemakai biasa**

1. Browser → (opsional nginx host) → `http://127.0.0.1:8090` → container **`web`** (nginx di dalam Docker).
2. Container **`web`** melayankan file React dan mengarahkan **`/api`** ke container **`backend`:5000** (nama service Docker `backend`).
3. **`backend`** berbicara dengan **MySQL** lewat nama service **`mysql`** (port 3306 **di dalam jaringan Docker**).

**Dua file nginx (jangan tertukar)**

| File di repo | Fungsi |
|--------------|--------|
| `frontend/nginx.conf` | Nginx **di dalam** image `web`. Wajib untuk SPA + **`/api`** ke backend **internal**. |
| `deploy/nginx-algoodesk.iwareid.com.conf` | Nginx **di VPS (host)**. Memetakan subdomain **publik** ke **`127.0.0.1:8090`** (container `web`). |

**Port pada host VPS** (yang dipakai `docker-compose.yml` saat ini; agar hindari bentrok dengan app lain)

| Service | Host port | Kontainer dalam |
|---------|-----------|-----------------|
| `web` | **8090** | 80 |
| `backend` | **5001** | 5000 |
| `phpmyadmin` | **8082** | 80 |
| `mysql` | **3307** | 3306 |

Untuk akses aplikasi utama biasanya **cukup** `8090` (atau subdomain setelah ada nginx host). Pemanggilan API dari browser **tidak** perlu `:5001` jika Anda buka halaman lewat `web`, karena frontend memakai path relatif **`/api`**.

---

## Bagian B — Langkah dari nol (urut lakukan ini)

### 1) Aktifkan VPS dan catat data

Di panel Hostinger (hPanel):

- Catat **IP publik VPS**, **user SSH** (biasanya `root`), **port SSH** (biasanya `22`).
- Pastikan VPS sudah bisa di-login dari internet.

---

### 2) Atur DNS untuk subdomain produksi

Di pengelola DNS domain **iwareid.com** (Hostinger atau registrar lain):

**Rekaman tipe A**

- **Host / Nama:** `algoodesk`
- **Nilai / Points to:** **IP VPS**
- **TTL:** default / auto

Hasilnya: **`algoodesk.iwareid.com`** mengarah ke VPS.

>Tunggu propagasi beberapa menit hingga beberapa jam. Cek dari PC Anda:  
> `ping algoodesk.iwareid.com` atau `nslookup algoodesk.iwareid.com`

Kalau Anda belum bisa pasang subdomain dulu, **tetap bisa** lanjut ke Docker dan uji pakai **`http://IP_VPS:8090`**.

---

### 3) Masuk VPS lewat SSH

Di Windows (PowerShell):

```bash
ssh root@IP_VPS
```

Jika port SSH bukan 22:

```bash
ssh root@IP_VPS -p NOMOR_PORT
```

---

### 4) Update sistem dan pasang Docker + Docker Compose

Contoh untuk **Ubuntu 22.04**:

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg

install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

systemctl enable docker
systemctl start docker

docker --version
docker compose version
```

---

### 5) Ambil kode project ke VPS

**Opsi git (disarankan):**

```bash
cd /opt
git clone https://github.com/lutfllhm/algodesk.git algoodesk
cd algoodesk
```

Ganti URL jika repository Anda beda.

**Opsi upload ZIP:** unggah ke VPS (SFTP), lalu `cd` ke folder yang berisi `docker-compose.yml`.

Pastikan ada file: **`docker-compose.yml`**, folder **`backend/`**, **`frontend/`**, **`deploy/`**.

---

### 6) Buat file `.env` di root project

```bash
cd /opt/algoodesk
nano .env
```

Contoh isi — **ganti semua password dan secret** dengan nilai acak yang kuat:

```env
MYSQL_ROOT_PASSWORD=GANTI_password_root_mysql_panjang
MYSQL_DATABASE=algoodesk
MYSQL_USER=algoodesk
MYSQL_PASSWORD=GANTI_password_user_database
JWT_SECRET=GANTI_string_random_panjang_untuk_jwt

# Saat sudah pakai HTTPS subdomain, gunakan baris ini (hapus bintang):
# CORS_ORIGIN=https://algoodesk.iwareid.com,http://algoodesk.iwareid.com
CORS_ORIGIN=*
```

Simpan: `Ctrl+O`, Enter, `Ctrl+X`.

---

### 7) Jalankan stack dengan Docker Compose

```bash
cd /opt/algoodesk
docker compose up -d --build
```

Tunggu hingga build selesai. Cek:

```bash
docker compose ps
```

Semua service idealnya **running**; `mysql` biasanya **healthy** sebelum backend start.

---

### 8) Uji pertama (tanpa subdomain)

Dari VPS:

```bash
curl -s http://127.0.0.1:8090/api/health
```

Harus dapat JSON sukses (misalnya ada `success: true`).

Dari komputer Anda (ganti IP):

```text
http://IP_VPS:8090/
```

**Artinya Anda sudah berhasil** menjalankan aplikasi secara dasar di Docker.

---

### 9) Firewall (UFW) — sangat disarankan

```bash
ufw allow 22/tcp          # atau port SSH Anda
ufw allow 8090/tcp        # akses langsung UI (kalau tidak diputus nanti)
ufw allow 8082/tcp        # phpMyAdmin — opsional, lebih baik dibatasi ke IP kantor
```

Jika Anda sudah menggunakan domain + nginx host (langkah berikut), **tambahkan**:

```bash
ufw allow 'Nginx Full'    # membuka HTTP + HTTPS nginx host
```

Aktifkan firewall jika belum:

```bash
ufw enable
ufw status
```

**mysql port 3307** sebaiknya **jangan dibuka publik** kecuali Anda benar‑benar membutuhkannya untuk tool dari luar (dan sudah pembatas IP/VPN).

---

### 10) Subdomain dengan HTTPS (`algoodesk.iwareid.com`)

Lakukan setelah Langkah **7–8 berhasil** dan DNS subdomain (Langkah 2) sudah mengarah benar ke VPS.

**10.a — Pasang nginx di VPS (bukan container)**

```bash
apt install -y nginx
nginx -v
systemctl enable nginx && systemctl start nginx
```

**10.b — Salin konfig dari repo**

```bash
cd /opt/algoodesk
cp deploy/nginx-algoodesk.iwareid.com.conf /etc/nginx/sites-available/algoodesk.iwareid.com
ln -sf /etc/nginx/sites-available/algoodesk.iwareid.com /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

**10.c — Sertifikat SSL (Let's Encrypt)**

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d algoodesk.iwareid.com
```

Ikuti petunjuk di layar Certbot (email, persetujuan syarat penyedia SSL).

**10.d — Aktifkan CORS yang sesuai produksi**

Edit `.env` di project:

```env
CORS_ORIGIN=https://algoodesk.iwareid.com,http://algoodesk.iwareid.com
```

Restart backend:

```bash
cd /opt/algoodesk
docker compose up -d
```

(cukup recreate container yang berubah; `up -d` sudah mencukupi.)

**10.e — Opsional pengaman**

Tutup akses dunia ke port **8090** supaya yang publik **hanya** lewat subdomain (nginx host):

- Edit **`docker-compose.yml`**, pada service **`web`** ganti `ports` menjadi:

```yaml
    ports:
      - "127.0.0.1:8090:80"
```

Lalu:

```bash
docker compose up -d
```

Setelah itu, dari luar **tidak bisa** lagi `http://IP_VPS:8090`; yang valid **`https://algoodesk.iwareid.com`**.

---

## Bagian C — Setelah berhasil login & akun bawaan

Sesuai `backend/config/database.sql`:

| Username     | Password      |
|--------------|---------------|
| `superadmin` | `jasad666`    |
| `admin`      | `password`    |

>**Segera ganti kedua sandi setelah bisa login** (menu manajemen user di aplikasi).

**phpMyAdmin:** `http://IP_VPS:8082/` — gunakan user & password database dari `.env` (`MYSQL_USER` / `MYSQL_PASSWORD`). Di dalam jaringan compose, host database untuk phpMyAdmin adalah service **`mysql`** (sudah diatur di stack).

---

## Bagian D — Pembaruan aplikasi ke versi baru

```bash
cd /opt/algoodesk
git pull
docker compose up -d --build
```

---

## Bagian E — Backup database cepat

Dari folder project:

```bash
cd /opt/algoodesk
docker compose exec -T mysql mysqldump -ualgoodesk -p'PASSWORD_DB_DARI_ENV' algoodesk > backup_algoodesk.sql
```

Ganti **`algoodesk`** / user / password sesuai `.env`.

---

## Bagian F — Troubleshooting singkat

| Masalah | Tindakan |
|---------|----------|
| `address already in use` saat compose | Ada layanan lain memakai **8090/5001/8082/3307** pada host. Ubah sisi **kiri** pemetaan `ports` di `docker-compose.yml` lalu `docker compose up -d`. |
| Situs subdomain 502 Bad Gateway | Cek **`docker compose ps`**, jalankan **`docker compose logs web`** dan **`curl http://127.0.0.1:8090/api/health`**. Pastikan **`web`** jalan dan port **8090** benar. |
| Login/API gagal dari browser | Set **`CORS_ORIGIN`** agar mencakup `https://algoodesk.iwareid.com`; pastikan Anda mengakses lewat subdomain yang sama. |
| MySQL gagal pertama kali | Lihat **`docker compose logs mysql`**. Volume lama bisa bentrok dengan init script; hindari menghapus volume produksi tanpa backup. |

---

## Bagian G — Daftar lengkap untuk menandai **“sudah sukses”**

- [ ] `docker compose ps` menampilkan `mysql`, `backend`, `web`, `phpmyadmin` **Up** (dan mysql **healthy** jika ada).
- [ ] `curl http://127.0.0.1:8090/api/health` dari VPS mengembalikan jawaban OK.
- [ ] Browser: **`http://IP_VPS:8090`** atau **`https://algoodesk.iwareid.com`** menampilkan halaman login.
- [ ] Login berhasil dengan user admin/superadmin; sandi telah diganti untuk produksi.
- [ ] Firewal terbuka untuk SSH + (80/443 jika subdomain) atau 8090 untuk uji.
- [ ] `.env` memakai password kuat dan **`JWT_SECRET`** unik; **`CORS_ORIGIN`** tidak memakai `*` di produksi jika Anda sudah punya domain pasti.

---

**Satu dokumen ini** berisi jalur lengkap dari nol hingga aplikasi bisa diakses. File teknis terkait: `docker-compose.yml`, `frontend/nginx.conf`, dan `deploy/nginx-algoodesk.iwareid.com.conf`.
