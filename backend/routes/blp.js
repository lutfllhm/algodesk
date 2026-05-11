const express = require('express');
const router = express.Router();
const blpController = require('../controllers/blpController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', blpController.getAll);
router.get('/:id', blpController.getById);
router.post('/', blpController.create);
router.put('/:id', blpController.update);
router.delete('/:id', blpController.delete);

module.exports = router;
