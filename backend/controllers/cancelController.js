const db = require('../config/database');
const { createNotificationsForAllUsers } = require('../utils/notifications');
const { normalizeOptionalDate } = require('../utils/dateNormalize');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date_from = '', date_to = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (no_order LIKE ? OR produk LIKE ? OR dpk LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (date_from) { whereClause += ' AND DATE(oc.tgl) >= ?'; params.push(date_from); }
    if (date_to)   { whereClause += ' AND DATE(oc.tgl) <= ?'; params.push(date_to); }

    const [rows] = await db.query(
      `SELECT oc.*, u.full_name as created_by_name FROM orderan_cancel oc LEFT JOIN users u ON oc.created_by = u.id ${whereClause} ORDER BY oc.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM orderan_cancel oc ${whereClause}`, params);

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
    console.error('Get cancel error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orderan_cancel WHERE id = ?', [req.params.id]);
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
    const { no, tgl, dpk, marketplace, no_order, produk, qty, keterangan } = req.body;
    const tglNorm = normalizeOptionalDate(tgl);

    const [result] = await db.query(
      `INSERT INTO orderan_cancel (no, tgl, dpk, marketplace, no_order, produk, qty, keterangan, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [no, tglNorm, dpk, marketplace, no_order, produk, qty || 1, keterangan, req.user.id]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Orderan Cancel: data baru',
      message: `${req.user.username} menambahkan data Orderan Cancel (ID: ${result.insertId})`,
      module: 'orderan_cancel',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create cancel error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { no, tgl, dpk, marketplace, no_order, produk, qty, keterangan } = req.body;
    const tglNorm = normalizeOptionalDate(tgl);

    const [result] = await db.query(
      `UPDATE orderan_cancel SET no=?, tgl=?, dpk=?, marketplace=?, no_order=?, produk=?, qty=?, keterangan=?
       WHERE id = ?`,
      [no, tglNorm, dpk, marketplace, no_order, produk, qty, keterangan, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Orderan Cancel: data diubah',
      message: `${req.user.username} mengedit data Orderan Cancel (ID: ${req.params.id})`,
      module: 'orderan_cancel',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Update cancel error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM orderan_cancel WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
