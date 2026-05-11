const db = require('../config/database');
const { createNotificationsForAllUsers } = require('../utils/notifications');

const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];
const MARKETPLACE_OPTIONS = ['Shopee', 'TiktokShop', 'Tokopedia', 'Lazada', 'Lainnya'];

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date_from = '', date_to = '', status = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (ss.nomor_wa LIKE ? OR ss.no_pesanan LIKE ? OR ss.produk LIKE ? OR ss.keluhan LIKE ? OR ss.masalah LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (status) {
      whereClause += ' AND ss.status = ?';
      params.push(status);
    }
    if (date_from) { whereClause += ' AND DATE(ss.tanggal) >= ?'; params.push(date_from); }
    if (date_to)   { whereClause += ' AND DATE(ss.tanggal) <= ?'; params.push(date_to); }

    const [rows] = await db.query(
      `SELECT ss.*, u.full_name as created_by_name
       FROM sales_support ss
       LEFT JOIN users u ON ss.created_by = u.id
       ${whereClause}
       ORDER BY ss.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(
      `SELECT COUNT(*) as total FROM sales_support ss ${whereClause}`,
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
    console.error('Get sales support error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM sales_support WHERE id = ?', [req.params.id]);
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
    const { tanggal, nomor_wa, marketplace, no_pesanan, produk, keluhan, masalah, metode_solusi, status } = req.body;

    const [result] = await db.query(
      `INSERT INTO sales_support
        (tanggal, nomor_wa, marketplace, no_pesanan, produk, keluhan, masalah, metode_solusi, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tanggal || null,
        nomor_wa || null,
        marketplace || null,
        no_pesanan || null,
        produk || null,
        keluhan || null,
        masalah || null,
        metode_solusi || null,
        status || 'Done',
        req.user.id
      ]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Sales Support: tiket baru',
      message: `${req.user.username} menambahkan tiket Sales Support (ID: ${result.insertId})`,
      module: 'sales_support',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create sales support error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { tanggal, nomor_wa, marketplace, no_pesanan, produk, keluhan, masalah, metode_solusi, status } = req.body;

    const [result] = await db.query(
      `UPDATE sales_support
       SET tanggal=?, nomor_wa=?, marketplace=?, no_pesanan=?, produk=?, keluhan=?, masalah=?, metode_solusi=?, status=?
       WHERE id = ?`,
      [
        tanggal || null,
        nomor_wa || null,
        marketplace || null,
        no_pesanan || null,
        produk || null,
        keluhan || null,
        masalah || null,
        metode_solusi || null,
        status || 'Done',
        req.params.id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Sales Support: data diubah',
      message: `${req.user.username} mengedit tiket Sales Support (ID: ${req.params.id})`,
      module: 'sales_support',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Update sales support error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM sales_support WHERE id = ?', [req.params.id]);
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
        SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) as done_count,
        SUM(CASE WHEN status = 'No Respond' THEN 1 ELSE 0 END) as no_respond,
        SUM(CASE WHEN status = 'Retur' THEN 1 ELSE 0 END) as retur
      FROM sales_support
    `);

    const [byMarketplace] = await db.query(`
      SELECT COALESCE(marketplace, 'Lainnya') as label, COUNT(*) as total
      FROM sales_support
      GROUP BY marketplace
      ORDER BY total DESC
    `);

    const [monthly] = await db.query(`
      SELECT DATE_FORMAT(tanggal, '%Y-%m') as month, COUNT(*) as total
      FROM sales_support
      WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month
      ORDER BY month
    `);

    res.json({
      success: true,
      data: {
        summary: stats[0],
        by_marketplace: byMarketplace,
        monthly
      }
    });
  } catch (error) {
    console.error('Sales support stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
