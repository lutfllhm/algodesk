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

  // Servis & Rusak — Dari Retur (legacy installs may miss new columns)
  await tryQuery(`ALTER TABLE rusak ADD COLUMN tipe VARCHAR(150)`);
  await tryQuery(`ALTER TABLE rusak ADD COLUMN nomor_seri VARCHAR(150)`);
  await tryQuery(`ALTER TABLE rusak ADD COLUMN kendala_diagnosa TEXT`);
  await tryQuery(`ALTER TABLE rusak ADD COLUMN tgl_kembali DATE`);
  await tryQuery(
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
      status ENUM('Open','In Progress','Resolved','Closed') DEFAULT 'Open',
      created_by INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

module.exports = { ensureTables };

