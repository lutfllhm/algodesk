const express = require('express');
const router = express.Router();
const settingController = require('../controllers/settingController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', settingController.getAll);
router.put('/', requireRole('superadmin', 'admin'), settingController.update);
router.get('/backup', requireRole('superadmin', 'admin'), settingController.backupDatabase);
router.get('/activity-log', requireRole('superadmin', 'admin'), settingController.getActivityLog);

module.exports = router;
