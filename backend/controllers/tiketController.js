const db = require('../config/database');
const { createNotificationsForAllUsers } = require('../utils/notifications');

// TIKET TIKTOK
exports.getTiktokAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date_from = '', date_to = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (no_tiket LIKE ? OR no_order LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (date_from) { whereClause += ' AND DATE(t.created_at) >= ?'; params.push(date_from); }
    if (date_to)   { whereClause += ' AND DATE(t.created_at) <= ?'; params.push(date_to); }

    const [rows] = await db.query(
      `SELECT t.*, u.full_name as created_by_name FROM tiket_tiktok t LEFT JOIN users u ON t.created_by = u.id ${whereClause} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM tiket_tiktok t ${whereClause}`, params);

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
    console.error('Get tiket tiktok error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTiktokById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tiket_tiktok WHERE id = ?', [req.params.id]);
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
    const { no_tiket, no_order, kendala, proses, gudang, keterangan } = req.body;

    const [result] = await db.query(
      `INSERT INTO tiket_tiktok (no_tiket, no_order, kendala, proses, gudang, keterangan, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [no_tiket, no_order, kendala, proses || 'No Going', gudang || 'Jakarta', keterangan, req.user.id]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Tiket TikTok: data baru',
      message: `${req.user.username} menambahkan data Tiket TikTok (ID: ${result.insertId})`,
      module: 'tiket_tiktok',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create tiket tiktok error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateTiktok = async (req, res) => {
  try {
    const { no_tiket, no_order, kendala, proses, gudang, keterangan } = req.body;

    const [result] = await db.query(
      `UPDATE tiket_tiktok SET no_tiket=?, no_order=?, kendala=?, proses=?, gudang=?, keterangan=?
       WHERE id = ?`,
      [no_tiket, no_order, kendala, proses, gudang, keterangan, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Tiket TikTok: data diubah',
      message: `${req.user.username} mengedit data Tiket TikTok (ID: ${req.params.id})`,
      module: 'tiket_tiktok',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Update tiket tiktok error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteTiktok = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM tiket_tiktok WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// TIKET SHOPEE
exports.getShopeeAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date_from = '', date_to = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (no_tiket LIKE ? OR no_order LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (date_from) { whereClause += ' AND DATE(t.created_at) >= ?'; params.push(date_from); }
    if (date_to)   { whereClause += ' AND DATE(t.created_at) <= ?'; params.push(date_to); }

    const [rows] = await db.query(
      `SELECT t.*, u.full_name as created_by_name FROM tiket_shopee t LEFT JOIN users u ON t.created_by = u.id ${whereClause} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM tiket_shopee t ${whereClause}`, params);

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
    console.error('Get tiket shopee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getShopeeById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM tiket_shopee WHERE id = ?', [req.params.id]);
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
    const { no_tiket, no_order, kendala, proses, gudang, keterangan } = req.body;

    const [result] = await db.query(
      `INSERT INTO tiket_shopee (no_tiket, no_order, kendala, proses, gudang, keterangan, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [no_tiket, no_order, kendala, proses || 'No Going', gudang || 'Jakarta', keterangan, req.user.id]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Tiket Shopee: data baru',
      message: `${req.user.username} menambahkan data Tiket Shopee (ID: ${result.insertId})`,
      module: 'tiket_shopee',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create tiket shopee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateShopee = async (req, res) => {
  try {
    const { no_tiket, no_order, kendala, proses, gudang, keterangan } = req.body;

    const [result] = await db.query(
      `UPDATE tiket_shopee SET no_tiket=?, no_order=?, kendala=?, proses=?, gudang=?, keterangan=?
       WHERE id = ?`,
      [no_tiket, no_order, kendala, proses, gudang, keterangan, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Tiket Shopee: data diubah',
      message: `${req.user.username} mengedit data Tiket Shopee (ID: ${req.params.id})`,
      module: 'tiket_shopee',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Update tiket shopee error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteShopee = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM tiket_shopee WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
