const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/codGagalNewController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

// COD Gagal TikTok Algoo
router.get('/tiktok', ctrl.getTiktokAll);
router.get('/tiktok/:id', ctrl.getTiktokById);
router.post('/tiktok', ctrl.createTiktok);
router.put('/tiktok/:id', ctrl.updateTiktok);
router.delete('/tiktok/:id', ctrl.deleteTiktok);

// COD Gagal Shopee Algoo
router.get('/shopee-algoo', ctrl.getShopeeAlgooAll);
router.get('/shopee-algoo/:id', ctrl.getShopeeAlgooById);
router.post('/shopee-algoo', ctrl.createShopeeAlgoo);
router.put('/shopee-algoo/:id', ctrl.updateShopeeAlgoo);
router.delete('/shopee-algoo/:id', ctrl.deleteShopeeAlgoo);

// COD Gagal Shopee Mami Kasir
router.get('/shopee-mami', ctrl.getShopeeMamiAll);
router.get('/shopee-mami/:id', ctrl.getShopeeMamiById);
router.post('/shopee-mami', ctrl.createShopeeMami);
router.put('/shopee-mami/:id', ctrl.updateShopeeMami);
router.delete('/shopee-mami/:id', ctrl.deleteShopeeMami);

// COD Gagal TikTok Mami Kasir
router.get('/tiktok-mami', ctrl.getTiktokMamiAll);
router.get('/tiktok-mami/:id', ctrl.getTiktokMamiById);
router.post('/tiktok-mami', ctrl.createTiktokMami);
router.put('/tiktok-mami/:id', ctrl.updateTiktokMami);
router.delete('/tiktok-mami/:id', ctrl.deleteTiktokMami);

module.exports = router;
