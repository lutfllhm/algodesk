const db = require('../config/database');
const { createNotificationsForAllUsers } = require('../utils/notifications');
const { normalizeOptionalDateTime } = require('../utils/dateNormalize');

// =============================================
// COD GAGAL TIKTOK
// =============================================
exports.getTiktokAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date_from = '', date_to = '' } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      where += ' AND (order_id LIKE ? OR buyer_username LIKE ? OR seller_sku LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (date_from) { where += ' AND DATE(t.created_at) >= ?'; params.push(date_from); }
    if (date_to)   { where += ' AND DATE(t.created_at) <= ?'; params.push(date_to); }
    const [rows] = await db.query(
      `SELECT t.*, u.full_name as created_by_name FROM cod_gagal_tiktok t LEFT JOIN users u ON t.created_by = u.id ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM cod_gagal_tiktok t ${where}`, params);
    res.json({ success: true, data: rows, pagination: { total: countResult[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countResult[0].total / limit) } });
  } catch (err) {
    console.error('Get COD Gagal TikTok error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTiktokById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cod_gagal_tiktok WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

exports.createTiktok = async (req, res) => {
  try {
    const f = req.body;
    const [result] = await db.query(
      `INSERT INTO cod_gagal_tiktok (status_brg, dibukukan_accurate, order_id, order_status, order_substatus,
        cancelation_return_type, normal_or_preorder, sku_id, seller_sku, variation, delivery_option,
        shipping_provider_name, buyer_message, buyer_username, recipient, phone, zipcode, country,
        province, regency_and_city, districts, villages, detail_address, additional_address,
        payment_method, weight_kg, product_category, package_id, purchase_channel, seller_note,
        checked_status, checked_marked_by, tokopedia_invoice_number,
        sku_quantity_of_return, sku_unit_original_price, sku_subtotal_before_discount,
        sku_platform_discount, sku_seller_discount, sku_subtotal_after_discount,
        shipping_fee_after_discount, original_shipping_fee, shipping_fee_seller_discount,
        shipping_fee_platform_discount, payment_platform_discount, buyer_service_fee,
        handling_fee, shipping_insurance, item_insurance, order_amount, order_refund_amount,
        created_time, paid_time, rts_time, shipped_time, delivered_time, cancelled_time,
        cancel_by, cancel_reason, fulfillment_type, warehouse_name, tracking_id, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [f.status_brg, f.dibukukan_accurate, f.order_id, f.order_status, f.order_substatus,
       f.cancelation_return_type, f.normal_or_preorder, f.sku_id, f.seller_sku, f.variation,
       f.delivery_option, f.shipping_provider_name, f.buyer_message, f.buyer_username, f.recipient,
       f.phone, f.zipcode, f.country, f.province, f.regency_and_city, f.districts, f.villages,
       f.detail_address, f.additional_address, f.payment_method, f.weight_kg, f.product_category,
       f.package_id, f.purchase_channel, f.seller_note, f.checked_status, f.checked_marked_by,
       f.tokopedia_invoice_number,
       f.sku_quantity_of_return, f.sku_unit_original_price, f.sku_subtotal_before_discount,
       f.sku_platform_discount, f.sku_seller_discount, f.sku_subtotal_after_discount,
       f.shipping_fee_after_discount, f.original_shipping_fee, f.shipping_fee_seller_discount,
       f.shipping_fee_platform_discount, f.payment_platform_discount, f.buyer_service_fee,
       f.handling_fee, f.shipping_insurance, f.item_insurance, f.order_amount, f.order_refund_amount,
       normalizeOptionalDateTime(f.created_time), normalizeOptionalDateTime(f.paid_time), normalizeOptionalDateTime(f.rts_time), normalizeOptionalDateTime(f.shipped_time), normalizeOptionalDateTime(f.delivered_time), normalizeOptionalDateTime(f.cancelled_time),
       f.cancel_by, f.cancel_reason, f.fulfillment_type, f.warehouse_name, f.tracking_id, req.user.id]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'COD Gagal TikTok: data baru',
      message: `${req.user.username} menambahkan data COD Gagal TikTok (ID: ${result.insertId})`,
      module: 'cod_gagal_tiktok',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (err) {
    console.error('Create COD Gagal TikTok error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateTiktok = async (req, res) => {
  try {
    const f = req.body;
    const [result] = await db.query(
      `UPDATE cod_gagal_tiktok SET status_brg=?, dibukukan_accurate=?, order_id=?, order_status=?,
        order_substatus=?, cancelation_return_type=?, normal_or_preorder=?, sku_id=?, seller_sku=?,
        variation=?, delivery_option=?, shipping_provider_name=?, buyer_message=?, buyer_username=?,
        recipient=?, phone=?, zipcode=?, country=?, province=?, regency_and_city=?, districts=?,
        villages=?, detail_address=?, additional_address=?, payment_method=?, weight_kg=?,
        product_category=?, package_id=?, purchase_channel=?, seller_note=?, checked_status=?,
        checked_marked_by=?, tokopedia_invoice_number=?,
        sku_quantity_of_return=?, sku_unit_original_price=?, sku_subtotal_before_discount=?,
        sku_platform_discount=?, sku_seller_discount=?, sku_subtotal_after_discount=?,
        shipping_fee_after_discount=?, original_shipping_fee=?, shipping_fee_seller_discount=?,
        shipping_fee_platform_discount=?, payment_platform_discount=?, buyer_service_fee=?,
        handling_fee=?, shipping_insurance=?, item_insurance=?, order_amount=?, order_refund_amount=?,
        created_time=?, paid_time=?, rts_time=?, shipped_time=?, delivered_time=?, cancelled_time=?,
        cancel_by=?, cancel_reason=?, fulfillment_type=?, warehouse_name=?, tracking_id=? WHERE id=?`,
      [f.status_brg, f.dibukukan_accurate, f.order_id, f.order_status, f.order_substatus,
       f.cancelation_return_type, f.normal_or_preorder, f.sku_id, f.seller_sku, f.variation,
       f.delivery_option, f.shipping_provider_name, f.buyer_message, f.buyer_username, f.recipient,
       f.phone, f.zipcode, f.country, f.province, f.regency_and_city, f.districts, f.villages,
       f.detail_address, f.additional_address, f.payment_method, f.weight_kg, f.product_category,
       f.package_id, f.purchase_channel, f.seller_note, f.checked_status, f.checked_marked_by,
       f.tokopedia_invoice_number,
       f.sku_quantity_of_return, f.sku_unit_original_price, f.sku_subtotal_before_discount,
       f.sku_platform_discount, f.sku_seller_discount, f.sku_subtotal_after_discount,
       f.shipping_fee_after_discount, f.original_shipping_fee, f.shipping_fee_seller_discount,
       f.shipping_fee_platform_discount, f.payment_platform_discount, f.buyer_service_fee,
       f.handling_fee, f.shipping_insurance, f.item_insurance, f.order_amount, f.order_refund_amount,
       normalizeOptionalDateTime(f.created_time), normalizeOptionalDateTime(f.paid_time), normalizeOptionalDateTime(f.rts_time), normalizeOptionalDateTime(f.shipped_time), normalizeOptionalDateTime(f.delivered_time), normalizeOptionalDateTime(f.cancelled_time),
       f.cancel_by, f.cancel_reason, f.fulfillment_type, f.warehouse_name, f.tracking_id, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Data not found' });

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'COD Gagal TikTok: data diubah',
      message: `${req.user.username} mengedit data COD Gagal TikTok (ID: ${req.params.id})`,
      module: 'cod_gagal_tiktok',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (err) {
    console.error('Update COD Gagal TikTok error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteTiktok = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM cod_gagal_tiktok WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Data not found' });
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

// =============================================
// COD GAGAL SHOPEE ALGOO
// =============================================
exports.getShopeeAlgooAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date_from = '', date_to = '' } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      where += ' AND (no_pesanan LIKE ? OR username_pembeli LIKE ? OR nama_produk LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (date_from) { where += ' AND DATE(t.created_at) >= ?'; params.push(date_from); }
    if (date_to)   { where += ' AND DATE(t.created_at) <= ?'; params.push(date_to); }
    const [rows] = await db.query(
      `SELECT t.*, u.full_name as created_by_name FROM cod_gagal_shopee_algoo t LEFT JOIN users u ON t.created_by = u.id ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM cod_gagal_shopee_algoo t ${where}`, params);
    res.json({ success: true, data: rows, pagination: { total: countResult[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countResult[0].total / limit) } });
  } catch (err) {
    console.error('Get COD Gagal Shopee Algoo error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getShopeeAlgooById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cod_gagal_shopee_algoo WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

exports.createShopeeAlgoo = async (req, res) => {
  try {
    const f = req.body;
    const [result] = await db.query(
      `INSERT INTO cod_gagal_shopee_algoo (status_brg, dibukukan_accurate, no_pesanan, status_pesanan,
        status_pembatalan_pengembalian, status_pengiriman_gagal, no_resi, sku_induk, nama_produk,
        nomor_referensi_sku, serial_number, nama_variasi, harga_awal, harga_setelah_diskon, jumlah,
        returned_quantity, total_harga_produk, total_diskon, diskon_dari_penjual, diskon_dari_shopee,
        berat_produk, jumlah_produk_di_pesan, total_berat, voucher_ditanggung_penjual, cashback_koin,
        voucher_ditanggung_shopee, paket_diskon, paket_diskon_dari_shopee, paket_diskon_dari_penjual,
        potongan_koin_shopee, diskon_kartu_kredit, ongkir_dibayar_pembeli,
        estimasi_potongan_biaya_pengiriman, ongkir_pengembalian_barang, total_pembayaran,
        perkiraan_ongkir, catatan_dari_pembeli, catatan, username_pembeli, nama_penerima,
        no_telepon, alamat_pengiriman, kota_kabupaten, provinsi, waktu_pesanan_selesai, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [f.status_brg, f.dibukukan_accurate, f.no_pesanan, f.status_pesanan,
       f.status_pembatalan_pengembalian, f.status_pengiriman_gagal, f.no_resi, f.sku_induk,
       f.nama_produk, f.nomor_referensi_sku, f.serial_number, f.nama_variasi, f.harga_awal,
       f.harga_setelah_diskon, f.jumlah, f.returned_quantity, f.total_harga_produk, f.total_diskon,
       f.diskon_dari_penjual, f.diskon_dari_shopee, f.berat_produk, f.jumlah_produk_di_pesan,
       f.total_berat, f.voucher_ditanggung_penjual, f.cashback_koin, f.voucher_ditanggung_shopee,
       f.paket_diskon, f.paket_diskon_dari_shopee, f.paket_diskon_dari_penjual,
       f.potongan_koin_shopee, f.diskon_kartu_kredit, f.ongkir_dibayar_pembeli,
       f.estimasi_potongan_biaya_pengiriman, f.ongkir_pengembalian_barang, f.total_pembayaran,
       f.perkiraan_ongkir, f.catatan_dari_pembeli, f.catatan, f.username_pembeli, f.nama_penerima,
       f.no_telepon, f.alamat_pengiriman, f.kota_kabupaten, f.provinsi, normalizeOptionalDateTime(f.waktu_pesanan_selesai),
       req.user.id]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'COD Gagal Shopee Algoo: data baru',
      message: `${req.user.username} menambahkan data COD Gagal Shopee Algoo (ID: ${result.insertId})`,
      module: 'cod_gagal_shopee_algoo',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (err) {
    console.error('Create COD Gagal Shopee Algoo error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateShopeeAlgoo = async (req, res) => {
  try {
    const f = req.body;
    const [result] = await db.query(
      `UPDATE cod_gagal_shopee_algoo SET status_brg=?, dibukukan_accurate=?, no_pesanan=?,
        status_pesanan=?, status_pembatalan_pengembalian=?, status_pengiriman_gagal=?, no_resi=?,
        sku_induk=?, nama_produk=?, nomor_referensi_sku=?, serial_number=?, nama_variasi=?,
        harga_awal=?, harga_setelah_diskon=?, jumlah=?, returned_quantity=?, total_harga_produk=?,
        total_diskon=?, diskon_dari_penjual=?, diskon_dari_shopee=?, berat_produk=?,
        jumlah_produk_di_pesan=?, total_berat=?, voucher_ditanggung_penjual=?, cashback_koin=?,
        voucher_ditanggung_shopee=?, paket_diskon=?, paket_diskon_dari_shopee=?,
        paket_diskon_dari_penjual=?, potongan_koin_shopee=?, diskon_kartu_kredit=?,
        ongkir_dibayar_pembeli=?, estimasi_potongan_biaya_pengiriman=?,
        ongkir_pengembalian_barang=?, total_pembayaran=?, perkiraan_ongkir=?,
        catatan_dari_pembeli=?, catatan=?, username_pembeli=?, nama_penerima=?,
        no_telepon=?, alamat_pengiriman=?, kota_kabupaten=?, provinsi=?,
        waktu_pesanan_selesai=? WHERE id=?`,
      [f.status_brg, f.dibukukan_accurate, f.no_pesanan, f.status_pesanan,
       f.status_pembatalan_pengembalian, f.status_pengiriman_gagal, f.no_resi, f.sku_induk,
       f.nama_produk, f.nomor_referensi_sku, f.serial_number, f.nama_variasi, f.harga_awal,
       f.harga_setelah_diskon, f.jumlah, f.returned_quantity, f.total_harga_produk, f.total_diskon,
       f.diskon_dari_penjual, f.diskon_dari_shopee, f.berat_produk, f.jumlah_produk_di_pesan,
       f.total_berat, f.voucher_ditanggung_penjual, f.cashback_koin, f.voucher_ditanggung_shopee,
       f.paket_diskon, f.paket_diskon_dari_shopee, f.paket_diskon_dari_penjual,
       f.potongan_koin_shopee, f.diskon_kartu_kredit, f.ongkir_dibayar_pembeli,
       f.estimasi_potongan_biaya_pengiriman, f.ongkir_pengembalian_barang, f.total_pembayaran,
       f.perkiraan_ongkir, f.catatan_dari_pembeli, f.catatan, f.username_pembeli, f.nama_penerima,
       f.no_telepon, f.alamat_pengiriman, f.kota_kabupaten, f.provinsi, normalizeOptionalDateTime(f.waktu_pesanan_selesai),
       req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Data not found' });

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'COD Gagal Shopee Algoo: data diubah',
      message: `${req.user.username} mengedit data COD Gagal Shopee Algoo (ID: ${req.params.id})`,
      module: 'cod_gagal_shopee_algoo',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (err) {
    console.error('Update COD Gagal Shopee Algoo error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteShopeeAlgoo = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM cod_gagal_shopee_algoo WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Data not found' });
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

// =============================================
// COD GAGAL SHOPEE MAMI KASIR
// =============================================
exports.getShopeeMamiAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date_from = '', date_to = '' } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      where += ' AND (no_pesanan LIKE ? OR username_pembeli LIKE ? OR nama_produk LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (date_from) { where += ' AND DATE(t.created_at) >= ?'; params.push(date_from); }
    if (date_to)   { where += ' AND DATE(t.created_at) <= ?'; params.push(date_to); }
    const [rows] = await db.query(
      `SELECT t.*, u.full_name as created_by_name FROM cod_gagal_shopee_mami_kasir t LEFT JOIN users u ON t.created_by = u.id ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM cod_gagal_shopee_mami_kasir t ${where}`, params);
    res.json({ success: true, data: rows, pagination: { total: countResult[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countResult[0].total / limit) } });
  } catch (err) {
    console.error('Get COD Gagal Shopee Mami Kasir error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getShopeeMamiById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cod_gagal_shopee_mami_kasir WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

exports.createShopeeMami = async (req, res) => {
  try {
    const f = req.body;
    const [result] = await db.query(
      `INSERT INTO cod_gagal_shopee_mami_kasir (status_brg, dibukukan_accurate, no_pesanan,
        status_pesanan, status_pembatalan_pengembalian, status_pengiriman_gagal, no_resi,
        opsi_pengiriman, antar_ke_counter, pesanan_harus_dikirim_sebelum, waktu_pengiriman_diatur,
        sku_induk, nama_produk, nomor_referensi_sku, nama_variasi, harga_awal, harga_setelah_diskon,
        jumlah, returned_quantity, total_harga_produk, total_diskon, diskon_dari_penjual,
        diskon_dari_shopee, berat_produk, jumlah_produk_di_pesan, total_berat,
        voucher_ditanggung_penjual, cashback_koin, voucher_ditanggung_shopee, paket_diskon,
        paket_diskon_dari_shopee, paket_diskon_dari_penjual, potongan_koin_shopee,
        diskon_kartu_kredit, ongkir_dibayar_pembeli, estimasi_potongan_biaya_pengiriman,
        ongkir_pengembalian_barang, total_pembayaran, perkiraan_ongkir, catatan_dari_pembeli,
        catatan, username_pembeli, nama_penerima, no_telepon, alamat_pengiriman, kota_kabupaten,
        provinsi, waktu_pesanan_selesai, waktu_pesanan_dibuat, waktu_pembayaran_dilakukan,
        metode_pembayaran, status_klaim, tanggal_klaim_diajukan, tanggal_klaim_disetujui,
        tanggal_klaim_dicairkan, tanggal_klaim_ditolak, jumlah_kompensasi, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [f.status_brg, f.dibukukan_accurate, f.no_pesanan, f.status_pesanan,
       f.status_pembatalan_pengembalian, f.status_pengiriman_gagal, f.no_resi,
       f.opsi_pengiriman, f.antar_ke_counter, normalizeOptionalDateTime(f.pesanan_harus_dikirim_sebelum),
       normalizeOptionalDateTime(f.waktu_pengiriman_diatur), f.sku_induk, f.nama_produk, f.nomor_referensi_sku,
       f.nama_variasi, f.harga_awal, f.harga_setelah_diskon, f.jumlah, f.returned_quantity,
       f.total_harga_produk, f.total_diskon, f.diskon_dari_penjual, f.diskon_dari_shopee,
       f.berat_produk, f.jumlah_produk_di_pesan, f.total_berat, f.voucher_ditanggung_penjual,
       f.cashback_koin, f.voucher_ditanggung_shopee, f.paket_diskon, f.paket_diskon_dari_shopee,
       f.paket_diskon_dari_penjual, f.potongan_koin_shopee, f.diskon_kartu_kredit,
       f.ongkir_dibayar_pembeli, f.estimasi_potongan_biaya_pengiriman,
       f.ongkir_pengembalian_barang, f.total_pembayaran, f.perkiraan_ongkir,
       f.catatan_dari_pembeli, f.catatan, f.username_pembeli, f.nama_penerima,
       f.no_telepon, f.alamat_pengiriman, f.kota_kabupaten, f.provinsi,
       normalizeOptionalDateTime(f.waktu_pesanan_selesai), normalizeOptionalDateTime(f.waktu_pesanan_dibuat), normalizeOptionalDateTime(f.waktu_pembayaran_dilakukan),
       f.metode_pembayaran, f.status_klaim, normalizeOptionalDateTime(f.tanggal_klaim_diajukan), normalizeOptionalDateTime(f.tanggal_klaim_disetujui),
       normalizeOptionalDateTime(f.tanggal_klaim_dicairkan), normalizeOptionalDateTime(f.tanggal_klaim_ditolak), f.jumlah_kompensasi, req.user.id]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'COD Gagal Shopee Mami Kasir: data baru',
      message: `${req.user.username} menambahkan data COD Gagal Shopee Mami Kasir (ID: ${result.insertId})`,
      module: 'cod_gagal_shopee_mami_kasir',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (err) {
    console.error('Create COD Gagal Shopee Mami Kasir error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateShopeeMami = async (req, res) => {
  try {
    const f = req.body;
    const [result] = await db.query(
      `UPDATE cod_gagal_shopee_mami_kasir SET status_brg=?, dibukukan_accurate=?, no_pesanan=?,
        status_pesanan=?, status_pembatalan_pengembalian=?, status_pengiriman_gagal=?, no_resi=?,
        opsi_pengiriman=?, antar_ke_counter=?, pesanan_harus_dikirim_sebelum=?,
        waktu_pengiriman_diatur=?, sku_induk=?, nama_produk=?, nomor_referensi_sku=?,
        nama_variasi=?, harga_awal=?, harga_setelah_diskon=?, jumlah=?, returned_quantity=?,
        total_harga_produk=?, total_diskon=?, diskon_dari_penjual=?, diskon_dari_shopee=?,
        berat_produk=?, jumlah_produk_di_pesan=?, total_berat=?, voucher_ditanggung_penjual=?,
        cashback_koin=?, voucher_ditanggung_shopee=?, paket_diskon=?, paket_diskon_dari_shopee=?,
        paket_diskon_dari_penjual=?, potongan_koin_shopee=?, diskon_kartu_kredit=?,
        ongkir_dibayar_pembeli=?, estimasi_potongan_biaya_pengiriman=?,
        ongkir_pengembalian_barang=?, total_pembayaran=?, perkiraan_ongkir=?,
        catatan_dari_pembeli=?, catatan=?, username_pembeli=?, nama_penerima=?,
        no_telepon=?, alamat_pengiriman=?, kota_kabupaten=?, provinsi=?,
        waktu_pesanan_selesai=?, waktu_pesanan_dibuat=?, waktu_pembayaran_dilakukan=?,
        metode_pembayaran=?, status_klaim=?, tanggal_klaim_diajukan=?,
        tanggal_klaim_disetujui=?, tanggal_klaim_dicairkan=?, tanggal_klaim_ditolak=?,
        jumlah_kompensasi=? WHERE id=?`,
      [f.status_brg, f.dibukukan_accurate, f.no_pesanan, f.status_pesanan,
       f.status_pembatalan_pengembalian, f.status_pengiriman_gagal, f.no_resi,
       f.opsi_pengiriman, f.antar_ke_counter, normalizeOptionalDateTime(f.pesanan_harus_dikirim_sebelum),
       normalizeOptionalDateTime(f.waktu_pengiriman_diatur), f.sku_induk, f.nama_produk, f.nomor_referensi_sku,
       f.nama_variasi, f.harga_awal, f.harga_setelah_diskon, f.jumlah, f.returned_quantity,
       f.total_harga_produk, f.total_diskon, f.diskon_dari_penjual, f.diskon_dari_shopee,
       f.berat_produk, f.jumlah_produk_di_pesan, f.total_berat, f.voucher_ditanggung_penjual,
       f.cashback_koin, f.voucher_ditanggung_shopee, f.paket_diskon, f.paket_diskon_dari_shopee,
       f.paket_diskon_dari_penjual, f.potongan_koin_shopee, f.diskon_kartu_kredit,
       f.ongkir_dibayar_pembeli, f.estimasi_potongan_biaya_pengiriman,
       f.ongkir_pengembalian_barang, f.total_pembayaran, f.perkiraan_ongkir,
       f.catatan_dari_pembeli, f.catatan, f.username_pembeli, f.nama_penerima,
       f.no_telepon, f.alamat_pengiriman, f.kota_kabupaten, f.provinsi,
       normalizeOptionalDateTime(f.waktu_pesanan_selesai), normalizeOptionalDateTime(f.waktu_pesanan_dibuat), normalizeOptionalDateTime(f.waktu_pembayaran_dilakukan),
       f.metode_pembayaran, f.status_klaim, normalizeOptionalDateTime(f.tanggal_klaim_diajukan), normalizeOptionalDateTime(f.tanggal_klaim_disetujui),
       normalizeOptionalDateTime(f.tanggal_klaim_dicairkan), normalizeOptionalDateTime(f.tanggal_klaim_ditolak), f.jumlah_kompensasi, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Data not found' });

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'COD Gagal Shopee Mami Kasir: data diubah',
      message: `${req.user.username} mengedit data COD Gagal Shopee Mami Kasir (ID: ${req.params.id})`,
      module: 'cod_gagal_shopee_mami_kasir',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (err) {
    console.error('Update COD Gagal Shopee Mami Kasir error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteShopeeMami = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM cod_gagal_shopee_mami_kasir WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Data not found' });
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

// =============================================
// COD GAGAL TIKTOK MAMI KASIR
// =============================================
exports.getTiktokMamiAll = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', date_from = '', date_to = '' } = req.query;
    const offset = (page - 1) * limit;
    let where = 'WHERE 1=1';
    const params = [];
    if (search) {
      where += ' AND (no_pesanan LIKE ? OR username_pembeli LIKE ? OR nama_produk LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (date_from) { where += ' AND DATE(t.created_at) >= ?'; params.push(date_from); }
    if (date_to)   { where += ' AND DATE(t.created_at) <= ?'; params.push(date_to); }
    const [rows] = await db.query(
      `SELECT t.*, u.full_name as created_by_name FROM cod_gagal_tiktok_mami_kasir t LEFT JOIN users u ON t.created_by = u.id ${where} ORDER BY t.created_at DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    const [countResult] = await db.query(`SELECT COUNT(*) as total FROM cod_gagal_tiktok_mami_kasir t ${where}`, params);
    res.json({ success: true, data: rows, pagination: { total: countResult[0].total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(countResult[0].total / limit) } });
  } catch (err) {
    console.error('Get COD Gagal TikTok Mami Kasir error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getTiktokMamiById = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM cod_gagal_tiktok_mami_kasir WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Data not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};

exports.createTiktokMami = async (req, res) => {
  try {
    const f = req.body;
    const [result] = await db.query(
      `INSERT INTO cod_gagal_tiktok_mami_kasir (status_brg, dibukukan_accurate, no_pesanan,
        status_pesanan, status_pembatalan_pengembalian, status_pengiriman_gagal, no_resi, sku_induk,
        nama_produk, nomor_referensi_sku, serial_number, nama_variasi, harga_awal, harga_setelah_diskon,
        jumlah, returned_quantity, total_harga_produk, total_diskon, diskon_dari_penjual,
        diskon_dari_shopee, berat_produk, jumlah_produk_di_pesan, total_berat,
        voucher_ditanggung_penjual, cashback_koin, voucher_ditanggung_shopee, paket_diskon,
        paket_diskon_dari_shopee, paket_diskon_dari_penjual, potongan_koin_shopee,
        diskon_kartu_kredit, ongkir_dibayar_pembeli, estimasi_potongan_biaya_pengiriman,
        ongkir_pengembalian_barang, total_pembayaran, perkiraan_ongkir, catatan_dari_pembeli,
        catatan, username_pembeli, nama_penerima, no_telepon, alamat_pengiriman,
        kota_kabupaten, provinsi, waktu_pesanan_selesai, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [f.status_brg, f.dibukukan_accurate, f.no_pesanan, f.status_pesanan,
       f.status_pembatalan_pengembalian, f.status_pengiriman_gagal, f.no_resi, f.sku_induk,
       f.nama_produk, f.nomor_referensi_sku, f.serial_number, f.nama_variasi, f.harga_awal,
       f.harga_setelah_diskon, f.jumlah, f.returned_quantity, f.total_harga_produk, f.total_diskon,
       f.diskon_dari_penjual, f.diskon_dari_shopee, f.berat_produk, f.jumlah_produk_di_pesan,
       f.total_berat, f.voucher_ditanggung_penjual, f.cashback_koin, f.voucher_ditanggung_shopee,
       f.paket_diskon, f.paket_diskon_dari_shopee, f.paket_diskon_dari_penjual,
       f.potongan_koin_shopee, f.diskon_kartu_kredit, f.ongkir_dibayar_pembeli,
       f.estimasi_potongan_biaya_pengiriman, f.ongkir_pengembalian_barang, f.total_pembayaran,
       f.perkiraan_ongkir, f.catatan_dari_pembeli, f.catatan, f.username_pembeli, f.nama_penerima,
       f.no_telepon, f.alamat_pengiriman, f.kota_kabupaten, f.provinsi, normalizeOptionalDateTime(f.waktu_pesanan_selesai),
       req.user.id]
    );

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'COD Gagal TikTok Mami Kasir: data baru',
      message: `${req.user.username} menambahkan data COD Gagal TikTok Mami Kasir (ID: ${result.insertId})`,
      module: 'cod_gagal_tiktok_mami_kasir',
      entityId: result.insertId,
      eventType: 'create'
    });

    res.status(201).json({ success: true, message: 'Data created successfully', id: result.insertId });
  } catch (err) {
    console.error('Create COD Gagal TikTok Mami Kasir error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateTiktokMami = async (req, res) => {
  try {
    const f = req.body;
    const [result] = await db.query(
      `UPDATE cod_gagal_tiktok_mami_kasir SET status_brg=?, dibukukan_accurate=?, no_pesanan=?,
        status_pesanan=?, status_pembatalan_pengembalian=?, status_pengiriman_gagal=?, no_resi=?,
        sku_induk=?, nama_produk=?, nomor_referensi_sku=?, serial_number=?, nama_variasi=?,
        harga_awal=?, harga_setelah_diskon=?, jumlah=?, returned_quantity=?, total_harga_produk=?,
        total_diskon=?, diskon_dari_penjual=?, diskon_dari_shopee=?, berat_produk=?,
        jumlah_produk_di_pesan=?, total_berat=?, voucher_ditanggung_penjual=?, cashback_koin=?,
        voucher_ditanggung_shopee=?, paket_diskon=?, paket_diskon_dari_shopee=?,
        paket_diskon_dari_penjual=?, potongan_koin_shopee=?, diskon_kartu_kredit=?,
        ongkir_dibayar_pembeli=?, estimasi_potongan_biaya_pengiriman=?,
        ongkir_pengembalian_barang=?, total_pembayaran=?, perkiraan_ongkir=?,
        catatan_dari_pembeli=?, catatan=?, username_pembeli=?, nama_penerima=?,
        no_telepon=?, alamat_pengiriman=?, kota_kabupaten=?, provinsi=?,
        waktu_pesanan_selesai=? WHERE id=?`,
      [f.status_brg, f.dibukukan_accurate, f.no_pesanan, f.status_pesanan,
       f.status_pembatalan_pengembalian, f.status_pengiriman_gagal, f.no_resi, f.sku_induk,
       f.nama_produk, f.nomor_referensi_sku, f.serial_number, f.nama_variasi, f.harga_awal,
       f.harga_setelah_diskon, f.jumlah, f.returned_quantity, f.total_harga_produk, f.total_diskon,
       f.diskon_dari_penjual, f.diskon_dari_shopee, f.berat_produk, f.jumlah_produk_di_pesan,
       f.total_berat, f.voucher_ditanggung_penjual, f.cashback_koin, f.voucher_ditanggung_shopee,
       f.paket_diskon, f.paket_diskon_dari_shopee, f.paket_diskon_dari_penjual,
       f.potongan_koin_shopee, f.diskon_kartu_kredit, f.ongkir_dibayar_pembeli,
       f.estimasi_potongan_biaya_pengiriman, f.ongkir_pengembalian_barang, f.total_pembayaran,
       f.perkiraan_ongkir, f.catatan_dari_pembeli, f.catatan, f.username_pembeli, f.nama_penerima,
       f.no_telepon, f.alamat_pengiriman, f.kota_kabupaten, f.provinsi, normalizeOptionalDateTime(f.waktu_pesanan_selesai),
       req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Data not found' });

    await createNotificationsForAllUsers({
      actorUserId: req.user.id,
      title: 'COD Gagal TikTok Mami Kasir: data diubah',
      message: `${req.user.username} mengedit data COD Gagal TikTok Mami Kasir (ID: ${req.params.id})`,
      module: 'cod_gagal_tiktok_mami_kasir',
      entityId: req.params.id,
      eventType: 'update'
    });

    res.json({ success: true, message: 'Data updated successfully' });
  } catch (err) {
    console.error('Update COD Gagal TikTok Mami Kasir error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteTiktokMami = async (req, res) => {
  try {
    const [result] = await db.query('DELETE FROM cod_gagal_tiktok_mami_kasir WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ success: false, message: 'Data not found' });
    res.json({ success: true, message: 'Data deleted successfully' });
  } catch (err) { res.status(500).json({ success: false, message: 'Server error' }); }
};
