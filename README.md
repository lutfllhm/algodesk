# AlgoodeDesk - Management System

Aplikasi manajemen servis, tiket, dan retur untuk Algoo.

## Tech Stack
- **Frontend**: React.js
- **Backend**: Express.js / Node.js
- **Database**: MySQL (phpMyAdmin)

## Struktur Folder
```
algoodeskapp/
├── backend/          # Express.js API
│   ├── config/       # Database config & SQL schema
│   ├── controllers/  # Business logic
│   ├── middleware/   # Auth middleware
│   └── routes/       # API routes
└── frontend/         # React.js app
    └── src/
        ├── components/  # Reusable components
        ├── pages/       # Page components
        └── utils/       # Utilities
```

## Instalasi

### 1. Setup Database
1. Buka phpMyAdmin
2. Import file `backend/config/database.sql`
3. Database `algoodeskdb` akan otomatis dibuat

### 2. Setup Backend
```bash
cd algoodeskapp/backend
npm install
# Edit .env sesuai konfigurasi MySQL Anda
npm run dev
```

### 3. Setup Frontend
```bash
cd algoodeskapp/frontend
npm install
npm start
```

## Akun Default
| Username    | Password | Role       |
|-------------|----------|------------|
| superadmin  | jasad666 | superadmin |
| admin       | password | admin      |

## Fitur
1. **Dashboard** - Statistik dan grafik ringkasan
2. **Rusak / Retur** - Manajemen barang rusak dari retur
3. **BLP** - Barang Langsung Proses
4. **Pergantian Barang** - Data pergantian produk
5. **Orderan Cancel** - Catatan orderan cancel
6. **Tiket TikTok** - Tiket komplain TikTok Algoo
7. **Tiket Shopee** - Tiket komplain Shopee Algoo
8. **Retur TikTok** - Retur & banding TikTok
9. **Retur Shopee** - Retur & banding Shopee
10. **Laporan** - Export Excel & PDF
11. **Manajemen User** - CRUD user & role
12. **Backup Database** - Download backup SQL
13. **Pengaturan** - Konfigurasi aplikasi

## API Endpoints
- `POST /api/auth/login` - Login
- `GET /api/rusak` - List rusak
- `GET /api/blp` - List BLP
- `GET /api/pergantian` - List pergantian
- `GET /api/cancel` - List cancel
- `GET /api/tiket/tiktok` - Tiket TikTok
- `GET /api/tiket/shopee` - Tiket Shopee
- `GET /api/retur/tiktok` - Retur TikTok
- `GET /api/retur/shopee` - Retur Shopee
- `GET /api/report/dashboard` - Dashboard stats
- `GET /api/report/export/excel/:module` - Export Excel
- `GET /api/report/export/pdf/:module` - Export PDF
- `GET /api/users` - List users
- `GET /api/settings` - Settings
- `GET /api/settings/backup` - Backup DB
