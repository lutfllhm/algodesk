const express = require('express');
const router = express.Router();
const tiketController = require('../controllers/tiketController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// Tiket TikTok
router.get('/tiktok', tiketController.getTiktokAll);
router.get('/tiktok/:id', tiketController.getTiktokById);
router.post('/tiktok', tiketController.createTiktok);
router.put('/tiktok/:id', tiketController.updateTiktok);
router.delete('/tiktok/:id', tiketController.deleteTiktok);

// Tiket Shopee
router.get('/shopee', tiketController.getShopeeAll);
router.get('/shopee/:id', tiketController.getShopeeById);
router.post('/shopee', tiketController.createShopee);
router.put('/shopee/:id', tiketController.updateShopee);
router.delete('/shopee/:id', tiketController.deleteShopee);

module.exports = router;
