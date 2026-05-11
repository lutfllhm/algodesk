const db = require('../config/database');
const { createNotificationsForAllUsers } = require('../utils/notifications');

exports.getAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date_from = '', date_to = '' } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (no_pesanan LIKE ? OR produk LIKE ? OR serial_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (date_from) { whereClause += ' AND DATE(b.created_at) >= ?'; params.push(date_from); }
    if (date_to)   { whereClause += ' AND DATE(b.created_at) <= ?'; params.push(date_to); }

    const [rows] = await db.query(
      `SELECT b.*, u.full_name as created_by_name FROM blp b LEFT JOIN users u ON b.created_by = u.id ${whereClause} ORDER BY b.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM blp b ${whereClause}`, params);

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
    console.error('Get BLP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM blp WHERE id = ?', [req.params.id]);
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
      no, marketplace, no_pesanan, alasan_retur, produk, serial_number,
      kondisi_barang, kelengkapan, diagnosa, validasi, status, tgl_servis,
      tgl_selesai_servis, hasil_akhir, tgl_kembali_stok, keterangan
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO blp (no, marketplace, no_pesanan, alasan_retur, produk, serial_number,
       kondisi_barang, kelengkapan, diagnosa, validasi, status, tgl_servis, tgl_selesai_servis,
       hasil_akhir, tgl_kembali_stok, keterangan, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [no, marketplace, no_pesanan, alasan_retur, produk, serial_number,
       kondisi_barang, kelengkapan, diagnosa, validasi, status || 'Service', tgl_servis,
       tgl_selesai_servis, hasil_akhir || 'Proses Service', tgl_kembali_stok, keterangan, req.user.id]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Service (BLP): data baru',
      message: `${req.user.username} menambahkan data Service/BLP (ID: ${result.insertId})`,
      module: 'blp',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create BLP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const {
      no, marketplace, no_pesanan, alasan_retur, produk, serial_number,
      kondisi_barang, kelengkapan, diagnosa, validasi, status, tgl_servis,
      tgl_selesai_servis, hasil_akhir, tgl_kembali_stok, keterangan
    } = req.body;

    const [result] = await db.query(
      `UPDATE blp SET no=?, marketplace=?, no_pesanan=?, alasan_retur=?, produk=?,
       serial_number=?, kondisi_barang=?, kelengkapan=?, diagnosa=?, validasi=?, status=?,
       tgl_servis=?, tgl_selesai_servis=?, hasil_akhir=?, tgl_kembali_stok=?, keterangan=?
       WHERE id = ?`,
      [no, marketplace, no_pesanan, alasan_retur, produk, serial_number,
       kondisi_barang, kelengkapan, diagnosa, validasi, status, tgl_servis,
       tgl_selesai_servis, hasil_akhir, tgl_kembali_stok, keterangan, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Service (BLP): data diubah',
      message: `${req.user.username} mengedit data Service/BLP (ID: ${req.params.id})`,
      module: 'blp',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (error) {
    console.error('Update BLP error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM blp WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Data not found' });
    }
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
