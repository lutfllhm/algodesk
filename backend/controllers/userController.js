const bcrypt = require('bcryptjs');
const db = require('../config/database');
const { createNotificationsForAllUsers } = require('../utils/notifications');

exports.getAll = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, full_name, email, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getById = async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, username, full_name, email, role, is_active, last_login, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: users[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.create = async (req, res) => {
  try {
    const { username, password, full_name, email, role } = req.body;

    if (!username || !password || !full_name) {
      return res.status(400).json({ success: false, message: 'Username, password, and full name are required' });
    }

    // Check if username exists
    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (username, password, full_name, email, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, full_name, email, role || 'staff']
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'User: dibuat',
      message: `${req.user.username} menambahkan user baru (${username})`,
      module: 'users',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'User created successfully', id: result.insertId });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const { full_name, email, role, is_active } = req.body;

    const [result] = await db.query(
      'UPDATE users SET full_name=?, email=?, role=?, is_active=? WHERE id = ?',
      [full_name, email, role, is_active, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'User: diubah',
      message: `${req.user.username} mengedit data user (ID: ${req.params.id})`,
      module: 'users',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'User updated successfully' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'UPDATE users SET password=? WHERE id = ?',
      [hashedPassword, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.delete = async (req, res) => {
  try {
    // Prevent deleting own account
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    const [result] = await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
