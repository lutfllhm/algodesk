const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/auth');
const notificationController = require('../controllers/notificationController');

router.get('/', verifyToken, notificationController.getList);
router.get('/unread-count', verifyToken, notificationController.getUnreadCount);
router.post('/:id/read', verifyToken, notificationController.markRead);
router.post('/read-all', verifyToken, notificationController.markAllRead);

module.exports = router;

