const express = require('express');
const router = express.Router();
const dariCustomerController = require('../controllers/dariCustomerController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', dariCustomerController.getAll);
router.get('/stats', dariCustomerController.getStats);
router.get('/:id', dariCustomerController.getById);
router.post('/', dariCustomerController.create);
router.put('/:id', dariCustomerController.update);
router.delete('/:id', dariCustomerController.delete);

module.exports = router;
