const db = require('../config/database');
const { createNotificationsForAllUsers } = require('../utils/notifications');
const { normalizeOptionalDate } = require('../utils/dateNormalize');

const TABLE = 'retur_pengembalian';

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

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', proses = '' } = req.query;
    const offset = (page - 1) * limit;

    let where = 'WHERE 1=1';
    const params = [];

    if (search) {
      where += ' AND (no_order LIKE ? OR no_retur LIKE ? OR nama_akun LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (proses) {
      where += ' AND proses = ?';
      params.push(proses);
    }

    const [rows] = await db.query(
      `SELECT r.*, u.full_name as created_by_name FROM ${TABLE} r LEFT JOIN users u ON r.created_by = u.id ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM ${TABLE} r ${where}`, params);

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
  } catch (err) {
    console.error('Get Retur Pengembalian error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM ${TABLE} WHERE id = ?`, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { tgl_order, nama_akun, no_order, no_retur, produk, kendala, proses, keterangan, gudang } = req.body;
    const tgl = normalizeOptionalDate(tgl_order);
    const pros = normalizeProses(proses);
    const gud = normalizeGudang(gudang);
    const [result] = await db.query(
      `INSERT INTO ${TABLE} (tgl_order, nama_akun, no_order, no_retur, produk, kendala, proses, keterangan, gudang, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tgl, nama_akun, no_order, no_retur, produk, kendala, pros, keterangan, gud, req.user.id]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Retur Pengembalian: data baru',
      message: `${req.user.username} menambahkan data Retur Pengembalian (ID: ${result.insertId})`,
      module: 'retur_pengembalian',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (err) {
    console.error('Create Retur Pengembalian error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { tgl_order, nama_akun, no_order, no_retur, produk, kendala, proses, keterangan, gudang } = req.body;
    const tgl = normalizeOptionalDate(tgl_order);
    const pros = normalizeProses(proses);
    const gud = normalizeGudang(gudang);
    const [result] = await db.query(
      `UPDATE ${TABLE} SET tgl_order=?, nama_akun=?, no_order=?, no_retur=?, produk=?, kendala=?, proses=?, keterangan=?, gudang=? WHERE id = ?`,
      [tgl, nama_akun, no_order, no_retur, produk, kendala, pros, keterangan, gud, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Data not found' });

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Retur Pengembalian: data diubah',
      message: `${req.user.username} mengedit data Retur Pengembalian (ID: ${req.params.id})`,
      module: 'retur_pengembalian',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (err) {
    console.error('Update Retur Pengembalian error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const [result] = await db.query(`DELETE FROM ${TABLE} WHERE id = ?`, [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Data not found' });
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
