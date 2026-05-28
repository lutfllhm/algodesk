const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const importController = require('../controllers/importController');
const { verifyToken } = require('../middleware/auth');

// Ensure uploads/temp dir exists
const uploadDir = path.join(__dirname, '../uploads/temp');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, `import-${unique}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = [
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
  ];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(file.mimetype) || ext === '.xlsx' || ext === '.xls') {
    cb(null, true);
  } else {
    cb(new Error('Hanya file Excel (.xlsx / .xls) yang diizinkan'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

router.use(verifyToken);

// POST /api/import/:module  — upload & import
router.post('/:module', upload.single('file'), importController.importExcel);

// GET /api/import/template/:module  — download template
router.get('/template/:module', importController.downloadTemplate);

// DELETE /api/import/truncate/:module  — delete all data in module
router.delete('/truncate/:module', importController.truncateModule);

module.exports = router;
