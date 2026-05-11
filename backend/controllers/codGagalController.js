const db = require('../config/database');
const { createNotificationsForAllUsers } = require('../utils/notifications');

const TABLE = 'cod_gagal';

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
      `SELECT c.*, u.full_name as created_by_name FROM ${TABLE} c LEFT JOIN users u ON c.created_by = u.id ${where} ORDER BY c.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM ${TABLE} c ${where}`, params);

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
    console.error('Get COD Gagal error:', err);
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
    const [result] = await db.query(
      `INSERT INTO ${TABLE} (tgl_order, nama_akun, no_order, no_retur, produk, kendala, proses, keterangan, gudang, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [tgl_order, nama_akun, no_order, no_retur, produk, kendala, proses || 'Tidak Banding', keterangan, gudang || 'Jakarta', req.user.id]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'COD Gagal: data baru',
      message: `${req.user.username} menambahkan data COD Gagal (ID: ${result.insertId})`,
      module: 'cod_gagal',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (err) {
    console.error('Create COD Gagal error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { tgl_order, nama_akun, no_order, no_retur, produk, kendala, proses, keterangan, gudang } = req.body;
    const [result] = await db.query(
      `UPDATE ${TABLE} SET tgl_order=?, nama_akun=?, no_order=?, no_retur=?, produk=?, kendala=?, proses=?, keterangan=?, gudang=? WHERE id = ?`,
      [tgl_order, nama_akun, no_order, no_retur, produk, kendala, proses, keterangan, gudang, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Data not found' });

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'COD Gagal: data diubah',
      message: `${req.user.username} mengedit data COD Gagal (ID: ${req.params.id})`,
      module: 'cod_gagal',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (err) {
    console.error('Update COD Gagal error:', err);
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
