const db = require('../config/database');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const { createNotificationsForAllUsers } = require('../utils/notifications');

exports.getAll = async (req, res) => {
  try {
    const [settings] = await db.query('SELECT * FROM settings ORDER BY setting_group, setting_key');
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.setting_key] = s.setting_value;
    });
    res.json({ success: true, data: settingsObj });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.update = async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await db.query(
        'UPDATE settings SET setting_value = ? WHERE setting_key = ?',
        [value, key]
      );
    }

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'Pengaturan: diperbarui',
      message: `${req.user.username} memperbarui pengaturan aplikasi`,
      module: 'settings',
      eventType: 'update'
    });

    res.json({ success: true, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.backupDatabase = async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const filename = `backup_${Date.now()}.sql`;
    const filepath = path.join(backupDir, filename);

    const command = `mysqldump -h ${process.env.DB_HOST} -u ${process.env.DB_USER} ${process.env.DB_PASSWORD ? `-p${process.env.DB_PASSWORD}` : ''} ${process.env.DB_NAME} > "${filepath}"`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error('Backup error:', error);
        return res.status(500).json({ success: false, message: 'Backup failed: ' + error.message });
      }

      res.download(filepath, filename, (err) => {
        if (err) {
          console.error('Download error:', err);
        }
        // Clean up file after download
        setTimeout(() => {
          if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
          }
        }, 5000);
      });
    });
  } catch (error) {
    console.error('Backup database error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getActivityLog = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const [logs] = await db.query(
      `SELECT al.*, u.username, u.full_name FROM activity_log al 
       LEFT JOIN users u ON al.user_id = u.id 
       ORDER BY al.created_at DESC LIMIT ? OFFSET ?`,
      [parseInt(limit), parseInt(offset)]
    );

    const [countResult] = await db.query('SELECT COUNT(*) as total FROM activity_log');

    res.json({
      success: true,
      data: logs,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(countResult[0].total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
