const express = require('express');
const router = express.Router();
const returController = require('../controllers/returController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// Retur TikTok
router.get('/tiktok', returController.getTiktokAll);
router.get('/tiktok/:id', returController.getTiktokById);
router.post('/tiktok', returController.createTiktok);
router.put('/tiktok/:id', returController.updateTiktok);
router.delete('/tiktok/:id', returController.deleteTiktok);

// Retur Shopee
router.get('/shopee', returController.getShopeeAll);
router.get('/shopee/:id', returController.getShopeeById);
router.post('/shopee', returController.createShopee);
router.put('/shopee/:id', returController.updateShopee);
router.delete('/shopee/:id', returController.deleteShopee);

module.exports = router;
