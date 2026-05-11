const express = require('express');
const router = express.Router();
const cancelController = require('../controllers/cancelController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', cancelController.getAll);
router.get('/:id', cancelController.getById);
router.post('/', cancelController.create);
router.put('/:id', cancelController.update);
router.delete('/:id', cancelController.delete);

module.exports = router;
