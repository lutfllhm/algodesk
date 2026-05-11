const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', requireRole('superadmin', 'admin'), userController.getAll);
router.get('/:id', requireRole('superadmin', 'admin'), userController.getById);
router.post('/', requireRole('superadmin', 'admin'), userController.create);
router.put('/:id', requireRole('superadmin', 'admin'), userController.update);
router.put('/:id/password', requireRole('superadmin', 'admin'), userController.changePassword);
router.delete('/:id', requireRole('superadmin'), userController.delete);

module.exports = router;
