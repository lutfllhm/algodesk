const express = require('express');
const router = express.Router();
const pergantianController = require('../controllers/pergantianController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', pergantianController.getAll);
router.get('/:id', pergantianController.getById);
router.post('/', pergantianController.create);
router.put('/:id', pergantianController.update);
router.delete('/:id', pergantianController.delete);

module.exports = router;
