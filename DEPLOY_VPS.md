## Deploy AlgoodeDesk ke Hostinger VPS KVM 2 (Docker)

Dokumen ini menjelaskan langkah lengkap deploy ke **Hostinger VPS KVM 2** dengan stack:
- `frontend` (React build + nginx)
- `backend` (Express.js)
- `mysql` + `phpMyAdmin`
- orkestrasi via `docker-compose.yml` di repo ini.

---

### 0) Persiapan di Hostinger (hPanel)
1. Login ke **hPanel Hostinger**.
2. Masuk ke menu **VPS → Kelola** pada VPS KVM 2 kamu.
3. Catat:
   - **IP Address VPS**
   - **User & Port SSH** (biasanya `root` dan port `22`, kecuali diubah).
4. Jika pakai domain:
   - Di menu **DNS Zone** domain, buat **A record**:
     - `@` → `IP VPS`
     - (opsional) `app` → `IP VPS` → nanti akses via `app.domainkamu.com`.

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

# Kalau frontend diakses lewat domain tertentu, bisa kunci CORS di backend:
# Contoh: https://app.domainkamu.com,https://domainkamu.com
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

---

### 6) Buka firewall (jika pakai ufw)
Jika VPS menggunakan `ufw` dan belum mengizinkan HTTP:

```bash
ufw allow 80/tcp    # untuk web app
ufw allow 8081/tcp  # phpMyAdmin (opsional, bisa kamu batasi IP)
ufw status
```

> Port MySQL `3306` **sebaiknya tidak dibuka ke publik**, cukup antar-container saja (sudah otomatis oleh Docker).

---

### 7) Akses aplikasi dari luar
- Tanpa domain:
  - Web app: `http://IP_VPS/`
  - API health: `http://IP_VPS/api/health`
  - phpMyAdmin: `http://IP_VPS:8081/`

- Dengan domain (jika A record sudah ke IP VPS):
  - Web app: `http://domainkamu.com/` atau `http://app.domainkamu.com/`

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

Jika kamu upload manual (ZIP/SFTP):
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

Contoh backup database dari dalam container (opsional):

```bash
docker exec -it $(docker ps -qf "name=mysql") \
  mysqldump -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" "$MYSQL_DATABASE" > backup_algoodesk.sql
```

---

### 11) (Opsional) Pasang HTTPS di Hostinger VPS
Cara sederhana (bukan satu-satunya):
1. Jalankan **reverse proxy** (mis. Caddy atau Nginx Proxy Manager) di VPS.
2. Atur reverse proxy:
   - Listen di port 80 & 443.
   - Proxy ke service `web` di `http://127.0.0.1:80` (atau langsung IP internal container jika dipakai).
3. Aktifkan **Let’s Encrypt** di reverse proxy tersebut untuk domain kamu.

Jika hanya butuh akses internal kantor dan tidak butuh HTTPS, kamu bisa tetap di HTTP biasa (`http://IP_VPS/`).

