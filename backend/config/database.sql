-- =============================================
-- Algoods — skema database MySQL
-- Nama database: algoodesk (selaras dengan aplikasi / folder proyek algoodesk)
-- =============================================
--
-- Punya data lama di `algoodeskdb`? Backup lalu impor ke `algoodesk`:
--   mysqldump -u USER -p algoodeskdb > backup.sql
--   mysql -u USER -p -e "CREATE DATABASE IF NOT EXISTS algoodesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
--   mysql -u USER -p algoodesk < backup.sql
-- Setelah itu atur DB_NAME=algoodesk di backend/.env
--

CREATE DATABASE IF NOT EXISTS algoodesk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE algoodesk;

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  email VARCHAR(150),
  role ENUM('superadmin', 'admin', 'staff') DEFAULT 'staff',
  avatar VARCHAR(255),
  is_active TINYINT(1) DEFAULT 1,
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- RUSAK (RETUR SERVICE) TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS rusak (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tgl_masuk DATE,
  no_pesanan VARCHAR(100),
  marketplace ENUM('Shopee','TiktokShop','Tokopedia','Lazada','Lainnya'),
  alasan_retur VARCHAR(255),
  produk VARCHAR(150),
  serial_number VARCHAR(150),
  kondisi_barang VARCHAR(100),
  kelengkapan VARCHAR(100),
  diagnosa TEXT,
  validasi VARCHAR(100),
  status ENUM('Service','Error','Selesai') DEFAULT 'Service',
  tgl_servis DATE,
  tgl_selesai_servis DATE,
  hasil_akhir ENUM('Kembali ke Stok','Gudang Rusak','Proses Service') DEFAULT 'Proses Service',
  tgl_kembali_stok DATE,
  keterangan TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- BLP TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS blp (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no INT,
  marketplace ENUM('Shopee','TiktokShop','Tokopedia','Lazada','Lainnya'),
  no_pesanan VARCHAR(100),
  alasan_retur VARCHAR(255),
  produk VARCHAR(150),
  serial_number VARCHAR(150),
  kondisi_barang VARCHAR(150),
  kelengkapan VARCHAR(100),
  diagnosa TEXT,
  validasi VARCHAR(100),
  status ENUM('Service','Error','Selesai') DEFAULT 'Service',
  tgl_servis DATE,
  tgl_selesai_servis DATE,
  hasil_akhir ENUM('Kembali ke Stok','Gudang Rusak','Proses Service') DEFAULT 'Proses Service',
  tgl_kembali_stok DATE,
  keterangan TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- PERGANTIAN BARANG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS pergantian_barang (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tgl DATE,
  marketplace ENUM('Shopee','TiktokShop','Tokopedia','Lazada','Lainnya'),
  no_order VARCHAR(100),
  nama_barang_awal VARCHAR(150),
  qty INT DEFAULT 1,
  nama_barang_diganti VARCHAR(150),
  keterangan TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- ORDERAN CANCEL TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS orderan_cancel (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no INT,
  tgl DATE,
  dpk VARCHAR(100),
  marketplace ENUM('Shopee','TiktokShop','Tokopedia','Lazada','Lainnya'),
  no_order VARCHAR(100),
  produk VARCHAR(150),
  qty INT DEFAULT 1,
  keterangan TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- TIKET TIKTOK TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tiket_tiktok (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no_tiket VARCHAR(100),
  no_order VARCHAR(100),
  kendala TEXT,
  proses ENUM('No Going','Clear') DEFAULT 'No Going',
  gudang ENUM('Surabaya','Jakarta') DEFAULT 'Jakarta',
  keterangan TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- TIKET SHOPEE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS tiket_shopee (
  id INT AUTO_INCREMENT PRIMARY KEY,
  no_tiket VARCHAR(100),
  no_order VARCHAR(100),
  kendala TEXT,
  proses ENUM('No Going','Clear') DEFAULT 'No Going',
  gudang ENUM('Surabaya','Jakarta') DEFAULT 'Jakarta',
  keterangan TEXT,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- RETUR TIKTOK TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS retur_tiktok (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tgl_order DATE,
  nama_akun VARCHAR(150),
  no_order VARCHAR(100),
  no_retur VARCHAR(100),
  produk VARCHAR(150),
  kendala TEXT,
  proses ENUM('Banding','Selesai','Tidak Banding') DEFAULT 'Tidak Banding',
  keterangan TEXT,
  gudang ENUM('Surabaya','Jakarta') DEFAULT 'Jakarta',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- RETUR SHOPEE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS retur_shopee (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tgl_order DATE,
  nama_akun VARCHAR(150),
  no_order VARCHAR(100),
  no_retur VARCHAR(100),
  produk VARCHAR(150),
  kendala TEXT,
  proses ENUM('Banding','Selesai','Tidak Banding') DEFAULT 'Tidak Banding',
  keterangan TEXT,
  gudang ENUM('Surabaya','Jakarta') DEFAULT 'Jakarta',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT,
  setting_group VARCHAR(100) DEFAULT 'general',
  description VARCHAR(255),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =============================================
-- ACTIVITY LOG TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS activity_log (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  action VARCHAR(100),
  module VARCHAR(100),
  description TEXT,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- NOTIFICATIONS TABLE (persistent per-user)
-- =============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT,
  module VARCHAR(100),
  entity_id VARCHAR(64),
  event_type ENUM('create','update','delete','system') DEFAULT 'system',
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notifications_user_created (user_id, created_at),
  INDEX idx_notifications_user_read (user_id, is_read),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =============================================
-- DEFAULT DATA
-- =============================================

-- Insert superadmin
INSERT INTO users (username, password, full_name, email, role, is_active) VALUES
('superadmin', '$2a$10$rIGlpOo/pqEjae6xr9d1w.kWi/npk6pJVKjFl5xFuPZjxxXMrU7xC', 'Super Administrator', 'superadmin@algoodeskapp.com', 'superadmin', 1),
('admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrator', 'admin@algoodeskapp.com', 'admin', 1);
-- superadmin password: jasad666
-- admin password: password

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_group, description) VALUES
('app_name', 'Algoods', 'general', 'Application Name'),
('app_logo', '', 'general', 'Application Logo URL'),
('company_name', 'Algoo', 'general', 'Company Name'),
('company_address', '', 'general', 'Company Address'),
('company_phone', '', 'general', 'Company Phone'),
('company_email', '', 'general', 'Company Email'),
('items_per_page', '10', 'display', 'Items per page in tables'),
('date_format', 'DD/MM/YYYY', 'display', 'Date format');



-- =============================================
-- COD GAGAL TIKTOK TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS cod_gagal_tiktok (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_brg VARCHAR(100),
  dibukukan_accurate VARCHAR(100),
  order_id VARCHAR(150),
  order_status VARCHAR(100),
  order_substatus VARCHAR(150),
  cancelation_return_type VARCHAR(150),
  normal_or_preorder VARCHAR(100),
  sku_id VARCHAR(150),
  seller_sku VARCHAR(150),
  variation VARCHAR(255),
  delivery_option VARCHAR(150),
  shipping_provider_name VARCHAR(150),
  buyer_message TEXT,
  buyer_username VARCHAR(150),
  recipient VARCHAR(150),
  phone VARCHAR(100),
  zipcode VARCHAR(20),
  country VARCHAR(100),
  province VARCHAR(150),
  regency_and_city VARCHAR(150),
  districts VARCHAR(150),
  villages VARCHAR(150),
  detail_address TEXT,
  additional_address TEXT,
  payment_method VARCHAR(100),
  weight_kg DECIMAL(10,2),
  product_category VARCHAR(150),
  package_id VARCHAR(150),
  purchase_channel VARCHAR(150),
  seller_note TEXT,
  checked_status VARCHAR(100),
  checked_marked_by VARCHAR(150),
  tokopedia_invoice_number VARCHAR(150),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- COD GAGAL SHOPEE ALGOO TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS cod_gagal_shopee_algoo (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_brg VARCHAR(100),
  dibukukan_accurate VARCHAR(100),
  no_pesanan VARCHAR(150),
  status_pesanan VARCHAR(100),
  status_pembatalan_pengembalian VARCHAR(150),
  status_pengiriman_gagal VARCHAR(150),
  no_resi VARCHAR(150),
  sku_induk VARCHAR(150),
  nama_produk VARCHAR(255),
  nomor_referensi_sku VARCHAR(150),
  serial_number VARCHAR(150),
  nama_variasi VARCHAR(255),
  harga_awal DECIMAL(15,2),
  harga_setelah_diskon DECIMAL(15,2),
  jumlah INT,
  returned_quantity INT,
  total_harga_produk DECIMAL(15,2),
  total_diskon DECIMAL(15,2),
  diskon_dari_penjual DECIMAL(15,2),
  diskon_dari_shopee DECIMAL(15,2),
  berat_produk VARCHAR(50),
  jumlah_produk_di_pesan INT,
  total_berat VARCHAR(50),
  voucher_ditanggung_penjual DECIMAL(15,2),
  cashback_koin DECIMAL(15,2),
  voucher_ditanggung_shopee VARCHAR(10),
  paket_diskon DECIMAL(15,2),
  paket_diskon_dari_shopee DECIMAL(15,2),
  paket_diskon_dari_penjual DECIMAL(15,2),
  potongan_koin_shopee DECIMAL(15,2),
  diskon_kartu_kredit DECIMAL(15,2),
  ongkir_dibayar_pembeli DECIMAL(15,2),
  estimasi_potongan_biaya_pengiriman DECIMAL(15,2),
  ongkir_pengembalian_barang DECIMAL(15,2),
  total_pembayaran DECIMAL(15,2),
  perkiraan_ongkir DECIMAL(15,2),
  catatan_dari_pembeli TEXT,
  catatan TEXT,
  username_pembeli VARCHAR(150),
  nama_penerima VARCHAR(150),
  no_telepon VARCHAR(50),
  alamat_pengiriman TEXT,
  kota_kabupaten VARCHAR(150),
  provinsi VARCHAR(150),
  waktu_pesanan_selesai DATETIME,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- COD GAGAL SHOPEE MAMI KASIR TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS cod_gagal_shopee_mami_kasir (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_brg VARCHAR(100),
  dibukukan_accurate VARCHAR(100),
  no_pesanan VARCHAR(150),
  status_pesanan VARCHAR(100),
  status_pembatalan_pengembalian VARCHAR(150),
  status_pengiriman_gagal VARCHAR(150),
  no_resi VARCHAR(150),
  opsi_pengiriman VARCHAR(150),
  antar_ke_counter VARCHAR(150),
  pesanan_harus_dikirim_sebelum DATETIME,
  waktu_pengiriman_diatur DATETIME,
  sku_induk VARCHAR(150),
  nama_produk VARCHAR(255),
  nomor_referensi_sku VARCHAR(150),
  nama_variasi VARCHAR(255),
  harga_awal DECIMAL(15,2),
  harga_setelah_diskon DECIMAL(15,2),
  jumlah INT,
  returned_quantity INT,
  total_harga_produk DECIMAL(15,2),
  total_diskon DECIMAL(15,2),
  diskon_dari_penjual DECIMAL(15,2),
  diskon_dari_shopee DECIMAL(15,2),
  berat_produk VARCHAR(50),
  jumlah_produk_di_pesan INT,
  total_berat VARCHAR(50),
  voucher_ditanggung_penjual DECIMAL(15,2),
  cashback_koin DECIMAL(15,2),
  voucher_ditanggung_shopee VARCHAR(10),
  paket_diskon DECIMAL(15,2),
  paket_diskon_dari_shopee DECIMAL(15,2),
  paket_diskon_dari_penjual DECIMAL(15,2),
  potongan_koin_shopee DECIMAL(15,2),
  diskon_kartu_kredit DECIMAL(15,2),
  ongkir_dibayar_pembeli DECIMAL(15,2),
  estimasi_potongan_biaya_pengiriman DECIMAL(15,2),
  ongkir_pengembalian_barang DECIMAL(15,2),
  total_pembayaran DECIMAL(15,2),
  perkiraan_ongkir DECIMAL(15,2),
  catatan_dari_pembeli TEXT,
  catatan TEXT,
  username_pembeli VARCHAR(150),
  nama_penerima VARCHAR(150),
  no_telepon VARCHAR(50),
  alamat_pengiriman TEXT,
  kota_kabupaten VARCHAR(150),
  provinsi VARCHAR(150),
  waktu_pesanan_selesai DATETIME,
  waktu_pesanan_dibuat DATETIME,
  waktu_pembayaran_dilakukan DATETIME,
  metode_pembayaran VARCHAR(100),
  status_klaim VARCHAR(100),
  tanggal_klaim_diajukan DATE,
  tanggal_klaim_disetujui DATE,
  tanggal_klaim_dicairkan DATE,
  tanggal_klaim_ditolak DATE,
  jumlah_kompensasi DECIMAL(15,2),
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- COD GAGAL TIKTOK MAMI KASIR TABLE
-- (kolom sama dengan cod_gagal_shopee_algoo)
-- =============================================
CREATE TABLE IF NOT EXISTS cod_gagal_tiktok_mami_kasir (
  id INT AUTO_INCREMENT PRIMARY KEY,
  status_brg VARCHAR(100),
  dibukukan_accurate VARCHAR(100),
  no_pesanan VARCHAR(150),
  status_pesanan VARCHAR(100),
  status_pembatalan_pengembalian VARCHAR(150),
  status_pengiriman_gagal VARCHAR(150),
  no_resi VARCHAR(150),
  sku_induk VARCHAR(150),
  nama_produk VARCHAR(255),
  nomor_referensi_sku VARCHAR(150),
  serial_number VARCHAR(150),
  nama_variasi VARCHAR(255),
  harga_awal DECIMAL(15,2),
  harga_setelah_diskon DECIMAL(15,2),
  jumlah INT,
  returned_quantity INT,
  total_harga_produk DECIMAL(15,2),
  total_diskon DECIMAL(15,2),
  diskon_dari_penjual DECIMAL(15,2),
  diskon_dari_shopee DECIMAL(15,2),
  berat_produk VARCHAR(50),
  jumlah_produk_di_pesan INT,
  total_berat VARCHAR(50),
  voucher_ditanggung_penjual DECIMAL(15,2),
  cashback_koin DECIMAL(15,2),
  voucher_ditanggung_shopee VARCHAR(10),
  paket_diskon DECIMAL(15,2),
  paket_diskon_dari_shopee DECIMAL(15,2),
  paket_diskon_dari_penjual DECIMAL(15,2),
  potongan_koin_shopee DECIMAL(15,2),
  diskon_kartu_kredit DECIMAL(15,2),
  ongkir_dibayar_pembeli DECIMAL(15,2),
  estimasi_potongan_biaya_pengiriman DECIMAL(15,2),
  ongkir_pengembalian_barang DECIMAL(15,2),
  total_pembayaran DECIMAL(15,2),
  perkiraan_ongkir DECIMAL(15,2),
  catatan_dari_pembeli TEXT,
  catatan TEXT,
  username_pembeli VARCHAR(150),
  nama_penerima VARCHAR(150),
  no_telepon VARCHAR(50),
  alamat_pengiriman TEXT,
  kota_kabupaten VARCHAR(150),
  provinsi VARCHAR(150),
  waktu_pesanan_selesai DATETIME,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- ALTER: Tambah kolom baru ke cod_gagal_tiktok
-- =============================================
ALTER TABLE cod_gagal_tiktok
  ADD COLUMN IF NOT EXISTS sku_quantity_of_return INT,
  ADD COLUMN IF NOT EXISTS sku_unit_original_price DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS sku_subtotal_before_discount DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS sku_platform_discount DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS sku_seller_discount DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS sku_subtotal_after_discount DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS shipping_fee_after_discount DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS original_shipping_fee DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS shipping_fee_seller_discount DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS shipping_fee_platform_discount DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS payment_platform_discount DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS buyer_service_fee DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS handling_fee DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS shipping_insurance DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS item_insurance DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS order_amount DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS order_refund_amount DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS created_time DATETIME,
  ADD COLUMN IF NOT EXISTS paid_time DATETIME,
  ADD COLUMN IF NOT EXISTS rts_time DATETIME,
  ADD COLUMN IF NOT EXISTS shipped_time DATETIME,
  ADD COLUMN IF NOT EXISTS delivered_time DATETIME,
  ADD COLUMN IF NOT EXISTS cancelled_time DATETIME,
  ADD COLUMN IF NOT EXISTS cancel_by VARCHAR(150),
  ADD COLUMN IF NOT EXISTS cancel_reason VARCHAR(255),
  ADD COLUMN IF NOT EXISTS fulfillment_type VARCHAR(150),
  ADD COLUMN IF NOT EXISTS warehouse_name VARCHAR(150),
  ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(150);


-- =============================================
-- MIGRATION: Update tabel rusak (Dari Retur)
-- Kolom baru sesuai struktur: NO, TGL MASUK, NO PESANAN/RESI, TIPE, NOMOR SERI,
-- KENDALA/DIAGNOSA, KELENGKAPAN, VALIDASI, STATUS, TGL KEMBALI
-- =============================================
ALTER TABLE rusak
  ADD COLUMN IF NOT EXISTS tipe VARCHAR(150),
  ADD COLUMN IF NOT EXISTS nomor_seri VARCHAR(150),
  ADD COLUMN IF NOT EXISTS kendala_diagnosa TEXT,
  ADD COLUMN IF NOT EXISTS tgl_kembali DATE;

-- Update kolom status agar sesuai pilihan baru
ALTER TABLE rusak
  MODIFY COLUMN status ENUM('Proses Servis','Gudang Rusak','Kembali ke Stok/Customer') DEFAULT 'Proses Servis';

-- Update kolom kelengkapan agar bisa menampung pilihan dropdown
ALTER TABLE rusak
  MODIFY COLUMN kelengkapan VARCHAR(100);

-- =============================================
-- TABEL BARU: dari_customer (Dari Customer Reguler)
-- Sama dengan rusak tapi no_pesanan diganti nama_customer + alamat_customer
-- =============================================
CREATE TABLE IF NOT EXISTS dari_customer (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tgl_masuk DATE,
  nama_customer VARCHAR(150),
  alamat_customer TEXT,
  tipe VARCHAR(150),
  nomor_seri VARCHAR(150),
  kendala_diagnosa TEXT,
  kelengkapan VARCHAR(100),
  validasi VARCHAR(100),
  status ENUM('Proses Servis','Gudang Rusak','Kembali ke Stok/Customer') DEFAULT 'Proses Servis',
  tgl_kembali DATE,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =============================================
-- MIGRATION: Tambah kolom reset password ke users
-- =============================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME DEFAULT NULL;

-- =============================================
-- SALES SUPPORT TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS sales_support (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tanggal DATE,
  nomor_wa VARCHAR(30),
  marketplace VARCHAR(100),
  no_pesanan VARCHAR(150),
  produk VARCHAR(255),
  keluhan TEXT,
  masalah TEXT,
  metode_solusi TEXT,
  status ENUM('Done','No Respond','Retur') DEFAULT 'Done',
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- MIGRATION: Reset password columns (jika belum ada)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS reset_token_expires DATETIME DEFAULT NULL;
