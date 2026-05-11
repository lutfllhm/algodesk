const db = require('../config/database');
const { createNotificationsForAllUsers } = require('../utils/notifications');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = '', date_from = '', date_to = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (no_pesanan LIKE ? OR tipe LIKE ? OR nomor_seri LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) { whereClause += ' AND status = ?'; params.push(status); }
    if (date_from) { whereClause += ' AND DATE(r.tgl_masuk) >= ?'; params.push(date_from); }
    if (date_to)   { whereClause += ' AND DATE(r.tgl_masuk) <= ?'; params.push(date_to); }

    const [rows] = await db.query(
      `SELECT r.*, u.full_name as created_by_name FROM rusak r LEFT JOIN users u ON r.created_by = u.id ${whereClause} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM rusak r ${whereClause}`,
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
    console.error('Get rusak error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM rusak WHERE id = ?', [req.params.id]);
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
      tgl_masuk, no_pesanan, tipe, nomor_seri,
      kendala_diagnosa, kelengkapan, validasi, status, tgl_kembali
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO rusak (tgl_masuk, no_pesanan, tipe, nomor_seri,
       kendala_diagnosa, kelengkapan, validasi, status, tgl_kembali, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tgl_masuk, no_pesanan, tipe, nomor_seri,
       kendala_diagnosa, kelengkapan, validasi, status || 'Proses Servis', tgl_kembali, req.user.id]
    );

    await db.query(
      'INSERT INTO activity_log (user_id, action, module, description) VALUES (?, ?, ?, ?)',
      [req.user.id, 'create', 'rusak', `Created rusak record ID: ${result.insertId}`]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Rusak: data baru',
      message: `${req.user.username} menambahkan data Rusak (ID: ${result.insertId})`,
      module: 'rusak',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create rusak error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      tgl_masuk, no_pesanan, tipe, nomor_seri,
      kendala_diagnosa, kelengkapan, validasi, status, tgl_kembali
    } = req.body;

    const [result] = await db.query(
      `UPDATE rusak SET tgl_masuk=?, no_pesanan=?, tipe=?, nomor_seri=?,
       kendala_diagnosa=?, kelengkapan=?, validasi=?, status=?, tgl_kembali=?
       WHERE id = ?`,
      [tgl_masuk, no_pesanan, tipe, nomor_seri,
       kendala_diagnosa, kelengkapan, validasi, status, tgl_kembali, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Rusak: data diubah',
      message: `${req.user.username} mengedit data Rusak (ID: ${req.params.id})`,
      module: 'rusak',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Update rusak error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM rusak WHERE id = ?', [req.params.id]);
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
      FROM rusak
    `);
    res.json({ success: true, data: stats[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
