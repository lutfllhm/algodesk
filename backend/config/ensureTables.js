const db = require('./database');

async function tryQuery(sql) {
  try {
    await db.query(sql);
  } catch (err) {
    // If a table/column already exists or an ALTER can't be applied twice,
    // we intentionally ignore it to keep startup idempotent.
    const ignorableCodes = new Set([
      'ER_TABLE_EXISTS_ERROR',
      'ER_DUP_FIELDNAME',
      'ER_DUP_KEYNAME',
      'ER_CANT_DROP_FIELD_OR_KEY',
      'ER_CANT_CREATE_TABLE',
      'ER_FK_DUP_NAME'
    ]);
    if (ignorableCodes.has(err?.code)) return;
    // MySQL returns errno 1060 for duplicate column if code is missing
    if (err?.errno === 1060) return;
    throw err;
  }
}

// Like tryQuery but never throws — used for migrations that may fail on some DB states
async function safeQuery(sql) {
  try { await db.query(sql); } catch (_) {}
}

async function ensureTables() {
  // Core tables for Servis & Rusak module
  // Keep these minimal & aligned with controllers so the app can run even if
  // the full `config/database.sql` hasn't been imported yet.
  await tryQuery(`
    CREATE TABLE IF NOT EXISTS rusak (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tgl_masuk DATE,
      no_pesanan VARCHAR(100),
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Activity Log (used by controllers for audit trail)
  await tryQuery(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT,
      action VARCHAR(100),
      module VARCHAR(100),
      description TEXT,
      ip_address VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Notifications (persistent per-user inbox)
  await tryQuery(`
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
      CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Servis & Rusak — Dari Customer Reguler
  // Some environments are started without running `config/database.sql` manually.
  // Ensure this table exists so the UI can load the module.
  await tryQuery(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // COD Gagal (Legacy / General)
  await tryQuery(`
    CREATE TABLE IF NOT EXISTS cod_gagal (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Retur Pengembalian
  await tryQuery(`
    CREATE TABLE IF NOT EXISTS retur_pengembalian (
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Servis & Rusak — Dari Retur (legacy installs may miss new columns)
  await tryQuery(`ALTER TABLE rusak ADD COLUMN tipe VARCHAR(150)`);
  await tryQuery(`ALTER TABLE rusak ADD COLUMN nomor_seri VARCHAR(150)`);
  await tryQuery(`ALTER TABLE rusak ADD COLUMN kendala_diagnosa TEXT`);
  await tryQuery(`ALTER TABLE rusak ADD COLUMN tgl_kembali DATE`);
  
  // Migrate old status values to new ENUM before MODIFY
  await safeQuery(`UPDATE rusak SET status = 'Proses Servis' WHERE status = 'Service'`);
  await safeQuery(`UPDATE rusak SET status = 'Gudang Rusak' WHERE status = 'Error'`);
  await safeQuery(`UPDATE rusak SET status = 'Kembali ke Stok/Customer' WHERE status = 'Selesai'`);
  
  // Now safe to MODIFY ENUM
  await safeQuery(
    `ALTER TABLE rusak MODIFY COLUMN status ENUM('Proses Servis','Gudang Rusak','Kembali ke Stok/Customer') DEFAULT 'Proses Servis'`
  );

  // Forgot / Reset password — add token columns to users if not present
  await tryQuery(`ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL`);
  await tryQuery(`ALTER TABLE users ADD COLUMN reset_token_expires DATETIME DEFAULT NULL`);

  // Sales Support table
  await tryQuery(`
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // COD Gagal TikTok
  await tryQuery(`
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
      recipient VARCHAR(255),
      phone VARCHAR(100),
      zipcode VARCHAR(100),
      country VARCHAR(100),
      province VARCHAR(150),
      regency_and_city VARCHAR(150),
      districts VARCHAR(150),
      villages VARCHAR(150),
      detail_address TEXT,
      additional_address TEXT,
      payment_method VARCHAR(255),
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // Migrate/Ensure TikTok COD Gagal new columns
  const codGagalTiktokCols = [
    { name: 'sku_quantity_of_return', type: 'INT' },
    { name: 'sku_unit_original_price', type: 'DECIMAL(15,2)' },
    { name: 'sku_subtotal_before_discount', type: 'DECIMAL(15,2)' },
    { name: 'sku_platform_discount', type: 'DECIMAL(15,2)' },
    { name: 'sku_seller_discount', type: 'DECIMAL(15,2)' },
    { name: 'sku_subtotal_after_discount', type: 'DECIMAL(15,2)' },
    { name: 'shipping_fee_after_discount', type: 'DECIMAL(15,2)' },
    { name: 'original_shipping_fee', type: 'DECIMAL(15,2)' },
    { name: 'shipping_fee_seller_discount', type: 'DECIMAL(15,2)' },
    { name: 'shipping_fee_platform_discount', type: 'DECIMAL(15,2)' },
    { name: 'payment_platform_discount', type: 'DECIMAL(15,2)' },
    { name: 'buyer_service_fee', type: 'DECIMAL(15,2)' },
    { name: 'handling_fee', type: 'DECIMAL(15,2)' },
    { name: 'shipping_insurance', type: 'DECIMAL(15,2)' },
    { name: 'item_insurance', type: 'DECIMAL(15,2)' },
    { name: 'order_amount', type: 'DECIMAL(15,2)' },
    { name: 'order_refund_amount', type: 'DECIMAL(15,2)' },
    { name: 'created_time', type: 'DATETIME' },
    { name: 'paid_time', type: 'DATETIME' },
    { name: 'rts_time', type: 'DATETIME' },
    { name: 'shipped_time', type: 'DATETIME' },
    { name: 'delivered_time', type: 'DATETIME' },
    { name: 'cancelled_time', type: 'DATETIME' },
    { name: 'cancel_by', type: 'VARCHAR(150)' },
    { name: 'cancel_reason', type: 'VARCHAR(255)' },
    { name: 'fulfillment_type', type: 'VARCHAR(150)' },
    { name: 'warehouse_name', type: 'VARCHAR(150)' },
    { name: 'tracking_id', type: 'VARCHAR(150)' }
  ];

  for (const col of codGagalTiktokCols) {
    await tryQuery(`ALTER TABLE cod_gagal_tiktok ADD COLUMN ${col.name} ${col.type}`);
  }

  // Ensure zipcode column can support up to 100 characters in existing setups
  await tryQuery(`ALTER TABLE cod_gagal_tiktok MODIFY COLUMN zipcode VARCHAR(100)`);
  // Ensure recipient and payment_method columns can support up to 255 characters in existing setups
  await tryQuery(`ALTER TABLE cod_gagal_tiktok MODIFY COLUMN recipient VARCHAR(255)`);
  await tryQuery(`ALTER TABLE cod_gagal_tiktok MODIFY COLUMN payment_method VARCHAR(255)`);

  // Ensure nama_penerima and metode_pembayaran can support up to 255 characters in Shopee/TikTok mami setups
  await tryQuery(`ALTER TABLE cod_gagal_shopee_algoo MODIFY COLUMN nama_penerima VARCHAR(255)`);
  await tryQuery(`ALTER TABLE cod_gagal_shopee_mami_kasir MODIFY COLUMN nama_penerima VARCHAR(255)`);
  await tryQuery(`ALTER TABLE cod_gagal_shopee_mami_kasir MODIFY COLUMN metode_pembayaran VARCHAR(255)`);
  await tryQuery(`ALTER TABLE cod_gagal_tiktok_mami_kasir MODIFY COLUMN nama_penerima VARCHAR(255)`);

  // COD Gagal Shopee Algoo
  await tryQuery(`
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
      nama_penerima VARCHAR(255),
      no_telepon VARCHAR(50),
      alamat_pengiriman TEXT,
      kota_kabupaten VARCHAR(150),
      provinsi VARCHAR(150),
      waktu_pesanan_selesai DATETIME,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // COD Gagal Shopee Mami Kasir
  await tryQuery(`
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
      nama_penerima VARCHAR(255),
      no_telepon VARCHAR(50),
      alamat_pengiriman TEXT,
      kota_kabupaten VARCHAR(150),
      provinsi VARCHAR(150),
      waktu_pesanan_selesai DATETIME,
      waktu_pesanan_dibuat DATETIME,
      waktu_pembayaran_dilakukan DATETIME,
      metode_pembayaran VARCHAR(255),
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
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  // COD Gagal TikTok Mami Kasir
  await tryQuery(`
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
      nama_penerima VARCHAR(255),
      no_telepon VARCHAR(50),
      alamat_pengiriman TEXT,
      kota_kabupaten VARCHAR(150),
      provinsi VARCHAR(150),
      waktu_pesanan_selesai DATETIME,
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

module.exports = { ensureTables };

