const express = require('express');
const router = express.Router();
const salesSupportController = require('../controllers/salesSupportController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/stats', salesSupportController.getStats);
router.get('/', salesSupportController.getAll);
router.get('/:id', salesSupportController.getById);
router.post('/', salesSupportController.create);
router.put('/:id', salesSupportController.update);
router.delete('/:id', salesSupportController.delete);

module.exports = router;
