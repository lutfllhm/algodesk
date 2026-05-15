const db = require('../config/database');
const { createNotificationsForAllUsers } = require('../utils/notifications');
const { normalizeOptionalDate } = require('../utils/dateNormalize');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', date_from = '', date_to = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (nama_customer LIKE ? OR tipe LIKE ? OR nomor_seri LIKE ? OR alamat_customer LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) { whereClause += ' AND status = ?'; params.push(status); }
    if (date_from) { whereClause += ' AND DATE(d.tgl_masuk) >= ?'; params.push(date_from); }
    if (date_to)   { whereClause += ' AND DATE(d.tgl_masuk) <= ?'; params.push(date_to); }

    const [rows] = await db.query(
      `SELECT d.*, u.full_name as created_by_name FROM dari_customer d LEFT JOIN users u ON d.created_by = u.id ${whereClause} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM dari_customer d ${whereClause}`,
      params
    );

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
    console.error('Get dari_customer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM dari_customer WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const {
      tgl_masuk, nama_customer, alamat_customer, tipe, nomor_seri,
      kendala_diagnosa, kelengkapan, validasi, status, tgl_kembali
    } = req.body;

    const tglMasuk = normalizeOptionalDate(tgl_masuk);
    const tglKembaliNorm = normalizeOptionalDate(tgl_kembali);

    const [result] = await db.query(
      `INSERT INTO dari_customer (tgl_masuk, nama_customer, alamat_customer, tipe, nomor_seri,
       kendala_diagnosa, kelengkapan, validasi, status, tgl_kembali, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tglMasuk, nama_customer, alamat_customer, tipe, nomor_seri,
       kendala_diagnosa, kelengkapan, validasi, status || 'Proses Servis', tglKembaliNorm, req.user.id]
    );

    await db.query(
      'INSERT INTO activity_log (user_id, action, module, description) VALUES (?, ?, ?, ?)',
      [req.user.id, 'create', 'dari_customer', `Created dari_customer record ID: ${result.insertId}`]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Dari Customer: data baru',
      message: `${req.user.username} menambahkan data Dari Customer (ID: ${result.insertId})`,
      module: 'dari_customer',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create dari_customer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      tgl_masuk, nama_customer, alamat_customer, tipe, nomor_seri,
      kendala_diagnosa, kelengkapan, validasi, status, tgl_kembali
    } = req.body;

    const tglMasuk = normalizeOptionalDate(tgl_masuk);
    const tglKembaliNorm = normalizeOptionalDate(tgl_kembali);

    const [result] = await db.query(
      `UPDATE dari_customer SET tgl_masuk=?, nama_customer=?, alamat_customer=?, tipe=?, nomor_seri=?,
       kendala_diagnosa=?, kelengkapan=?, validasi=?, status=?, tgl_kembali=?
       WHERE id = ?`,
      [tglMasuk, nama_customer, alamat_customer, tipe, nomor_seri,
       kendala_diagnosa, kelengkapan, validasi, status, tglKembaliNorm, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Dari Customer: data diubah',
      message: `${req.user.username} mengedit data Dari Customer (ID: ${req.params.id})`,
      module: 'dari_customer',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Update dari_customer error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM dari_customer WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Proses Servis' THEN 1 ELSE 0 END) as proses_servis,
        SUM(CASE WHEN status = 'Gudang Rusak' THEN 1 ELSE 0 END) as gudang_rusak,
        SUM(CASE WHEN status = 'Kembali ke Stok/Customer' THEN 1 ELSE 0 END) as kembali
      FROM dari_customer
    `);
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
