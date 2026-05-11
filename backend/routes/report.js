const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/dashboard', reportController.getDashboardStats);
router.get('/preview/:module', reportController.getReportPreview);
router.get('/export/excel/:module', reportController.exportExcel);
router.get('/export/pdf/:module', reportController.exportPDF);

module.exports = router;
