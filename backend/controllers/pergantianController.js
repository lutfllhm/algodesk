const db = require('../config/database');
const { createNotificationsForAllUsers } = require('../utils/notifications');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date_from = '', date_to = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (no_order LIKE ? OR nama_barang_awal LIKE ? OR nama_barang_diganti LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (date_from) { whereClause += ' AND DATE(p.tgl) >= ?'; params.push(date_from); }
    if (date_to)   { whereClause += ' AND DATE(p.tgl) <= ?'; params.push(date_to); }

    const [rows] = await db.query(
      `SELECT p.*, u.full_name as created_by_name FROM pergantian_barang p LEFT JOIN users u ON p.created_by = u.id ${whereClause} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM pergantian_barang p ${whereClause}`, params);

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
    console.error('Get pergantian error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM pergantian_barang WHERE id = ?', [req.params.id]);
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
    const { tgl, marketplace, no_order, nama_barang_awal, qty, nama_barang_diganti, keterangan } = req.body;

    const [result] = await db.query(
      `INSERT INTO pergantian_barang (tgl, marketplace, no_order, nama_barang_awal, qty, nama_barang_diganti, keterangan, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [tgl, marketplace, no_order, nama_barang_awal, qty || 1, nama_barang_diganti, keterangan, req.user.id]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Pergantian Barang: data baru',
      message: `${req.user.username} menambahkan data Pergantian Barang (ID: ${result.insertId})`,
      module: 'pergantian_barang',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create pergantian error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { tgl, marketplace, no_order, nama_barang_awal, qty, nama_barang_diganti, keterangan } = req.body;

    const [result] = await db.query(
      `UPDATE pergantian_barang SET tgl=?, marketplace=?, no_order=?, nama_barang_awal=?, qty=?, nama_barang_diganti=?, keterangan=?
       WHERE id = ?`,
      [tgl, marketplace, no_order, nama_barang_awal, qty, nama_barang_diganti, keterangan, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Pergantian Barang: data diubah',
      message: `${req.user.username} mengedit data Pergantian Barang (ID: ${req.params.id})`,
      module: 'pergantian_barang',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Update pergantian error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM pergantian_barang WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
