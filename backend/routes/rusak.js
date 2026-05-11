const express = require('express');
const router = express.Router();
const rusakController = require('../controllers/rusakController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', rusakController.getAll);
router.get('/stats', rusakController.getStats);
router.get('/:id', rusakController.getById);
router.post('/', rusakController.create);
router.put('/:id', rusakController.update);
router.delete('/:id', rusakController.delete);

module.exports = router;
