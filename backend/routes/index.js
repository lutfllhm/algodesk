const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const rusakRoutes = require('./rusak');
const blpRoutes = require('./blp');
const pergantianRoutes = require('./pergantian');
const cancelRoutes = require('./cancel');
const tiketRoutes = require('./tiket');
const returRoutes = require('./retur');
const codGagalRoutes = require('./codGagal');
const codGagalNewRoutes = require('./codGagalNew');
const returPengembalianRoutes = require('./returPengembalian');
const userRoutes = require('./users');
const reportRoutes = require('./report');
const settingRoutes = require('./settings');
const importRoutes = require('./import');
const dariCustomerRoutes = require('./dariCustomer');
const notificationRoutes = require('./notifications');

router.use('/auth', authRoutes);
router.use('/rusak', rusakRoutes);
router.use('/dari-customer', dariCustomerRoutes);
router.use('/blp', blpRoutes);
router.use('/service', blpRoutes); // alias untuk BLP → Service
router.use('/pergantian', pergantianRoutes);
router.use('/cancel', cancelRoutes);
router.use('/tiket', tiketRoutes);
router.use('/retur', returRoutes);
router.use('/cod-gagal', codGagalRoutes);
router.use('/cod-gagal-new', codGagalNewRoutes);
router.use('/retur-pengembalian', returPengembalianRoutes);
router.use('/users', userRoutes);
router.use('/report', reportRoutes);
router.use('/settings', settingRoutes);
router.use('/import', importRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
