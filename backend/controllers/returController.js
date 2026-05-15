const db = require('../config/database');
const { createNotificationsForAllUsers } = require('../utils/notifications');
const { normalizeOptionalDate } = require('../utils/dateNormalize');

const PROSES_VALUES = new Set(['Banding', 'Selesai', 'Tidak Banding']);
const GUDANG_VALUES = new Set(['Surabaya', 'Jakarta']);

function normalizeProses(value) {
  const v = value != null ? String(value).trim() : '';
  return PROSES_VALUES.has(v) ? v : 'Tidak Banding';
}

function normalizeGudang(value) {
  const v = value != null ? String(value).trim() : '';
  return GUDANG_VALUES.has(v) ? v : 'Jakarta';
}

// RETUR TIKTOK
exports.getTiktokAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', proses = '', date_from = '', date_to = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (no_order LIKE ? OR no_retur LIKE ? OR nama_akun LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (proses) { whereClause += ' AND proses = ?'; params.push(proses); }
    if (date_from) { whereClause += ' AND DATE(r.tgl_order) >= ?'; params.push(date_from); }
    if (date_to)   { whereClause += ' AND DATE(r.tgl_order) <= ?'; params.push(date_to); }

    const [rows] = await db.query(
      `SELECT r.*, u.full_name as created_by_name FROM retur_tiktok r LEFT JOIN users u ON r.created_by = u.id ${whereClause} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM retur_tiktok r ${whereClause}`, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get retur tiktok error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTiktokById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM retur_tiktok WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createTiktok = async (req, res) => {
  try {
    const { tgl_order, nama_akun, no_order, no_retur, produk, kendala, proses, keterangan, gudang } = req.body;
    const tgl = normalizeOptionalDate(tgl_order);
    const pros = normalizeProses(proses);
    const gud = normalizeGudang(gudang);

    const [result] = await db.query(
      `INSERT INTO retur_tiktok (tgl_order, nama_akun, no_order, no_retur, produk, kendala, proses, keterangan, gudang, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tgl, nama_akun, no_order, no_retur, produk, kendala, pros, keterangan, gud, req.user.id]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Retur TikTok: data baru',
      message: `${req.user.username} menambahkan data Retur TikTok (ID: ${result.insertId})`,
      module: 'retur_tiktok',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create retur tiktok error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateTiktok = async (req, res) => {
  try {
    const { tgl_order, nama_akun, no_order, no_retur, produk, kendala, proses, keterangan, gudang } = req.body;
    const tgl = normalizeOptionalDate(tgl_order);
    const pros = normalizeProses(proses);
    const gud = normalizeGudang(gudang);

    const [result] = await db.query(
      `UPDATE retur_tiktok SET tgl_order=?, nama_akun=?, no_order=?, no_retur=?, produk=?, kendala=?, proses=?, keterangan=?, gudang=?
       WHERE id = ?`,
      [tgl, nama_akun, no_order, no_retur, produk, kendala, pros, keterangan, gud, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Retur TikTok: data diubah',
      message: `${req.user.username} mengedit data Retur TikTok (ID: ${req.params.id})`,
      module: 'retur_tiktok',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Update retur tiktok error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteTiktok = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM retur_tiktok WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// RETUR SHOPEE
exports.getShopeeAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', proses = '', date_from = '', date_to = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (no_order LIKE ? OR no_retur LIKE ? OR nama_akun LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (proses) { whereClause += ' AND proses = ?'; params.push(proses); }
    if (date_from) { whereClause += ' AND DATE(r.tgl_order) >= ?'; params.push(date_from); }
    if (date_to)   { whereClause += ' AND DATE(r.tgl_order) <= ?'; params.push(date_to); }

    const [rows] = await db.query(
      `SELECT r.*, u.full_name as created_by_name FROM retur_shopee r LEFT JOIN users u ON r.created_by = u.id ${whereClause} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM retur_shopee r ${whereClause}`, params);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    console.error('Get retur shopee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getShopeeById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM retur_shopee WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.createShopee = async (req, res) => {
  try {
    const { tgl_order, nama_akun, no_order, no_retur, produk, kendala, proses, keterangan, gudang } = req.body;
    const tgl = normalizeOptionalDate(tgl_order);
    const pros = normalizeProses(proses);
    const gud = normalizeGudang(gudang);

    const [result] = await db.query(
      `INSERT INTO retur_shopee (tgl_order, nama_akun, no_order, no_retur, produk, kendala, proses, keterangan, gudang, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tgl, nama_akun, no_order, no_retur, produk, kendala, pros, keterangan, gud, req.user.id]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Retur Shopee: data baru',
      message: `${req.user.username} menambahkan data Retur Shopee (ID: ${result.insertId})`,
      module: 'retur_shopee',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create retur shopee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateShopee = async (req, res) => {
  try {
    const { tgl_order, nama_akun, no_order, no_retur, produk, kendala, proses, keterangan, gudang } = req.body;
    const tgl = normalizeOptionalDate(tgl_order);
    const pros = normalizeProses(proses);
    const gud = normalizeGudang(gudang);

    const [result] = await db.query(
      `UPDATE retur_shopee SET tgl_order=?, nama_akun=?, no_order=?, no_retur=?, produk=?, kendala=?, proses=?, keterangan=?, gudang=?
       WHERE id = ?`,
      [tgl, nama_akun, no_order, no_retur, produk, kendala, pros, keterangan, gud, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Retur Shopee: data diubah',
      message: `${req.user.username} mengedit data Retur Shopee (ID: ${req.params.id})`,
      module: 'retur_shopee',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Update retur shopee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteShopee = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM retur_shopee WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
