const db = require('../config/database');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');

// ─── Helper: normalize header key ────────────────────────────────────────────
const norm = (str) =>
  String(str || '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

// ─── Helper: parse clean decimal ─────────────────────────────────────────────
const parseCleanDecimal = (val) => {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return val;
  
  let s = String(val).trim();
  s = s.replace(/^[Rr][Pp]\.?\s*/g, '').replace(/\s*$/g, '');
  s = s.replace(/\s+/g, '');
  
  const hasComma = s.includes(',');
  const hasDot = s.includes('.');
  
  if (hasComma && hasDot) {
    if (s.indexOf('.') < s.indexOf(',')) {
      s = s.replace(/\./g, '').replace(/,/g, '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (hasComma) {
    const parts = s.split(',');
    if (parts.length > 2) {
      s = parts.join('');
    } else if (parts[1].length === 3) {
      s = s.replace(/,/g, '');
    } else {
      s = parts[0] + '.' + parts[1];
    }
  } else if (hasDot) {
    const parts = s.split('.');
    if (parts.length > 2) {
      s = parts.join('');
    } else if (parts[1].length === 3) {
      s = s.replace(/\./g, '');
    }
  }
  
  const num = parseFloat(s);
  return isNaN(num) ? null : num;
};

// ─── Helper: parse date value from Excel ─────────────────────────────────────
const MONTH_MAP = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
  mei: '05', agu: '08', okt: '10', des: '12'
};

const parseDate = (val) => {
  if (!val) return null;
  // Excel serial number
  if (typeof val === 'number') {
    const d = xlsx.SSF.parse_date_code(val);
    if (d) {
      const mm = String(d.m).padStart(2, '0');
      const dd = String(d.d).padStart(2, '0');
      return `${d.y}-${mm}-${dd}`;
    }
  }
  // String date
  const s = String(val).trim();
  if (!s) return null;

  // Already YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  // DD/MM/YYYY or DD-MM-YYYY
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m1) return `${m1[3]}-${m1[2].padStart(2, '0')}-${m1[1].padStart(2, '0')}`;

  // DD-MMM (e.g. "08-May", "28-Apr", "12-Jul") — no year, use current year
  const m2 = s.match(/^(\d{1,2})[\/\-]([a-zA-Z]{3,})$/);
  if (m2) {
    const dd = m2[1].padStart(2, '0');
    const mon = MONTH_MAP[m2[2].toLowerCase().slice(0, 3)];
    if (mon) {
      const year = new Date().getFullYear();
      return `${year}-${mon}-${dd}`;
    }
  }

  // DD-MMM-YYYY or DD/MMM/YYYY (e.g. "08-May-2025")
  const m3 = s.match(/^(\d{1,2})[\/\-]([a-zA-Z]{3,})[\/\-](\d{4})/);
  if (m3) {
    const dd = m3[1].padStart(2, '0');
    const mon = MONTH_MAP[m3[2].toLowerCase().slice(0, 3)];
    if (mon) return `${m3[3]}-${mon}-${dd}`;
  }

  // MMM DD, YYYY (e.g. "May 8, 2025")
  const m4 = s.match(/^([a-zA-Z]{3,})\s+(\d{1,2}),?\s+(\d{4})/);
  if (m4) {
    const mon = MONTH_MAP[m4[1].toLowerCase().slice(0, 3)];
    if (mon) return `${m4[3]}-${mon}-${m4[2].padStart(2, '0')}`;
  }

  return null;
};

// ─── Helper: read Excel file → array of row objects ──────────────────────────
const readExcel = (filePath) => {
  const wb = xlsx.readFile(filePath, { cellDates: false, raw: false });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = xlsx.utils.sheet_to_json(ws, { defval: '' });
  // Normalize keys
  return raw.map((row) => {
    const out = {};
    for (const k of Object.keys(row)) out[norm(k)] = row[k];
    return out;
  });
};

// ─── Helper: pick value from row by multiple possible keys ───────────────────
const pick = (row, ...keys) => {
  for (const k of keys) {
    const v = row[norm(k)];
    if (v !== undefined && v !== '') return v;
  }
  return '';
};

// ─── MODULE CONFIGS ───────────────────────────────────────────────────────────
// Each config defines: table, required fields, row → db object mapper
const MODULE_CONFIGS = {
  rusak: {
    table: 'rusak',
    required: [], // tidak ada kolom wajib — semua opsional
    map: (row) => {
      // Normalize status dari Excel ke ENUM yang valid
      const rawStatus = pick(row, 'status') || '';
      const statusMap = {
        'service': 'Proses Servis', 'proses': 'Proses Servis', 'proses servis': 'Proses Servis',
        'error': 'Gudang Rusak', 'rusak': 'Gudang Rusak', 'gudang rusak': 'Gudang Rusak',
        'selesai': 'Kembali ke Stok/Customer', 'kembali': 'Kembali ke Stok/Customer',
        'kembali ke stok/customer': 'Kembali ke Stok/Customer',
      };
      const normalizedStatus = statusMap[rawStatus.toLowerCase()] || 'Proses Servis';
      return {
        tgl_masuk:        parseDate(pick(row, 'tgl_masuk', 'tanggal_masuk', 'tanggal', 'tgl')) || new Date().toISOString().slice(0, 10),
        no_pesanan:       pick(row, 'no_pesanan', 'no_order', 'nomor_pesanan', 'no_resi', 'resi'),
        tipe:             pick(row, 'tipe', 'produk', 'nama_produk', 'barang', 'type'),
        nomor_seri:       pick(row, 'nomor_seri', 'serial_number', 'sn', 'serial', 'no_seri'),
        kendala_diagnosa: pick(row, 'kendala_diagnosa', 'kendala', 'diagnosa', 'keluhan', 'keterangan_kendala'),
        kelengkapan:      pick(row, 'kelengkapan'),
        validasi:         pick(row, 'validasi'),
        status:           normalizedStatus,
        tgl_kembali:      parseDate(pick(row, 'tgl_kembali', 'tgl_kembali_stok', 'tgl_selesai')),
      };
    },
  },

  'dari-customer': {
    table: 'dari_customer',
    required: [],
    map: (row) => {
      const rawStatus = pick(row, 'status') || '';
      const statusMap = {
        'service': 'Proses Servis', 'proses': 'Proses Servis', 'proses servis': 'Proses Servis',
        'error': 'Gudang Rusak', 'rusak': 'Gudang Rusak', 'gudang rusak': 'Gudang Rusak',
        'selesai': 'Kembali ke Stok/Customer', 'kembali': 'Kembali ke Stok/Customer',
        'kembali ke stok/customer': 'Kembali ke Stok/Customer',
      };
      const normalizedStatus = statusMap[rawStatus.toLowerCase()] || 'Proses Servis';
      return {
        tgl_masuk:        parseDate(pick(row, 'tgl_masuk', 'tanggal_masuk', 'tanggal', 'tgl')) || new Date().toISOString().slice(0, 10),
        nama_customer:    pick(row, 'nama_customer', 'nama', 'customer'),
        alamat_customer:  pick(row, 'alamat_customer', 'alamat'),
        tipe:             pick(row, 'tipe', 'produk', 'nama_produk', 'barang', 'type'),
        nomor_seri:       pick(row, 'nomor_seri', 'serial_number', 'sn', 'serial', 'no_seri'),
        kendala_diagnosa: pick(row, 'kendala_diagnosa', 'kendala', 'diagnosa', 'keluhan'),
        kelengkapan:      pick(row, 'kelengkapan'),
        validasi:         pick(row, 'validasi'),
        status:           normalizedStatus,
        tgl_kembali:      parseDate(pick(row, 'tgl_kembali', 'tgl_selesai')),
      };
    },
  },

  blp: {
    table: 'blp',
    required: ['produk'],
    map: (row) => ({
      marketplace:        pick(row, 'marketplace') || 'Lainnya',
      no_pesanan:         pick(row, 'no_pesanan', 'no_order', 'nomor_pesanan'),
      alasan_retur:       pick(row, 'alasan_retur', 'alasan'),
      produk:             pick(row, 'produk', 'nama_produk', 'barang'),
      serial_number:      pick(row, 'serial_number', 'sn', 'serial'),
      kondisi_barang:     pick(row, 'kondisi_barang', 'kondisi'),
      kelengkapan:        pick(row, 'kelengkapan'),
      diagnosa:           pick(row, 'diagnosa'),
      validasi:           pick(row, 'validasi'),
      status:             pick(row, 'status') || 'Service',
      tgl_servis:         parseDate(pick(row, 'tgl_servis', 'tanggal_servis')),
      tgl_selesai_servis: parseDate(pick(row, 'tgl_selesai_servis', 'tgl_selesai')),
      hasil_akhir:        pick(row, 'hasil_akhir', 'hasil') || 'Proses Service',
      tgl_kembali_stok:   parseDate(pick(row, 'tgl_kembali_stok', 'tgl_stok')),
      keterangan:         pick(row, 'keterangan', 'catatan'),
    }),
  },

  cancel: {
    table: 'orderan_cancel',
    required: ['no_order'],
    map: (row) => ({
      tgl:        parseDate(pick(row, 'tgl', 'tanggal', 'tgl_cancel')) || new Date().toISOString().slice(0, 10),
      dpk:        pick(row, 'dpk'),
      marketplace: pick(row, 'marketplace') || 'Lainnya',
      no_order:   pick(row, 'no_order', 'nomor_order', 'no_pesanan'),
      produk:     pick(row, 'produk', 'nama_produk', 'barang'),
      qty:        parseInt(pick(row, 'qty', 'jumlah', 'quantity')) || 1,
      keterangan: pick(row, 'keterangan', 'catatan'),
    }),
  },

  pergantian: {
    table: 'pergantian_barang',
    required: ['no_order'],
    map: (row) => ({
      tgl:               parseDate(pick(row, 'tgl', 'tanggal')) || new Date().toISOString().slice(0, 10),
      marketplace:       pick(row, 'marketplace') || 'Lainnya',
      no_order:          pick(row, 'no_order', 'nomor_order', 'no_pesanan'),
      nama_barang_awal:  pick(row, 'nama_barang_awal', 'barang_awal', 'produk_awal'),
      qty:               parseInt(pick(row, 'qty', 'jumlah', 'quantity')) || 1,
      nama_barang_diganti: pick(row, 'nama_barang_diganti', 'barang_diganti', 'produk_baru'),
      keterangan:        pick(row, 'keterangan', 'catatan'),
    }),
  },

  'tiket-tiktok': {
    table: 'tiket_tiktok',
    required: ['no_tiket'],
    map: (row) => ({
      no_tiket:   pick(row, 'no_tiket', 'nomor_tiket', 'tiket'),
      no_order:   pick(row, 'no_order', 'nomor_order', 'no_pesanan'),
      kendala:    pick(row, 'kendala', 'masalah', 'keterangan_kendala'),
      proses:     pick(row, 'proses', 'status') || 'No Going',
      gudang:     pick(row, 'gudang') || 'Jakarta',
      keterangan: pick(row, 'keterangan', 'catatan'),
    }),
  },

  'tiket-shopee': {
    table: 'tiket_shopee',
    required: ['no_tiket'],
    map: (row) => ({
      no_tiket:   pick(row, 'no_tiket', 'nomor_tiket', 'tiket'),
      no_order:   pick(row, 'no_order', 'nomor_order', 'no_pesanan'),
      kendala:    pick(row, 'kendala', 'masalah', 'keterangan_kendala'),
      proses:     pick(row, 'proses', 'status') || 'No Going',
      gudang:     pick(row, 'gudang') || 'Jakarta',
      keterangan: pick(row, 'keterangan', 'catatan'),
    }),
  },

  'retur-tiktok': {
    table: 'retur_tiktok',
    required: ['no_order'],
    map: (row) => ({
      tgl_order:  parseDate(pick(row, 'tgl_order', 'tanggal_order', 'tgl')) || new Date().toISOString().slice(0, 10),
      nama_akun:  pick(row, 'nama_akun', 'akun', 'nama'),
      no_order:   pick(row, 'no_order', 'nomor_order', 'no_pesanan'),
      no_retur:   pick(row, 'no_retur', 'nomor_retur'),
      produk:     pick(row, 'produk', 'nama_produk', 'barang'),
      kendala:    pick(row, 'kendala', 'masalah'),
      proses:     pick(row, 'proses', 'status') || 'Tidak Banding',
      gudang:     pick(row, 'gudang') || 'Jakarta',
      keterangan: pick(row, 'keterangan', 'catatan'),
    }),
  },

  'retur-shopee': {
    table: 'retur_shopee',
    required: ['no_order'],
    map: (row) => ({
      tgl_order:  parseDate(pick(row, 'tgl_order', 'tanggal_order', 'tgl')) || new Date().toISOString().slice(0, 10),
      nama_akun:  pick(row, 'nama_akun', 'akun', 'nama'),
      no_order:   pick(row, 'no_order', 'nomor_order', 'no_pesanan'),
      no_retur:   pick(row, 'no_retur', 'nomor_retur'),
      produk:     pick(row, 'produk', 'nama_produk', 'barang'),
      kendala:    pick(row, 'kendala', 'masalah'),
      proses:     pick(row, 'proses', 'status') || 'Tidak Banding',
      gudang:     pick(row, 'gudang') || 'Jakarta',
      keterangan: pick(row, 'keterangan', 'catatan'),
    }),
  },

  'cod-gagal': {
    table: 'cod_gagal',
    required: ['no_order'],
    map: (row) => ({
      tgl_order:  parseDate(pick(row, 'tgl_order', 'tanggal_order', 'tgl')) || new Date().toISOString().slice(0, 10),
      nama_akun:  pick(row, 'nama_akun', 'akun', 'nama'),
      no_order:   pick(row, 'no_order', 'nomor_order', 'no_pesanan'),
      no_retur:   pick(row, 'no_retur', 'nomor_retur'),
      produk:     pick(row, 'produk', 'nama_produk', 'barang'),
      kendala:    pick(row, 'kendala', 'masalah'),
      proses:     pick(row, 'proses', 'status') || 'Tidak Banding',
      gudang:     pick(row, 'gudang') || 'Jakarta',
      keterangan: pick(row, 'keterangan', 'catatan'),
    }),
  },

  'retur-pengembalian': {
    table: 'retur_pengembalian',
    required: ['no_order'],
    map: (row) => ({
      tgl_order:  parseDate(pick(row, 'tgl_order', 'tanggal_order', 'tgl')) || new Date().toISOString().slice(0, 10),
      nama_akun:  pick(row, 'nama_akun', 'akun', 'nama'),
      no_order:   pick(row, 'no_order', 'nomor_order', 'no_pesanan'),
      no_retur:   pick(row, 'no_retur', 'nomor_retur'),
      produk:     pick(row, 'produk', 'nama_produk', 'barang'),
      kendala:    pick(row, 'kendala', 'masalah'),
      proses:     pick(row, 'proses', 'status') || 'Tidak Banding',
      gudang:     pick(row, 'gudang') || 'Jakarta',
      keterangan: pick(row, 'keterangan', 'catatan'),
    }),
  },

  'cod-gagal-tiktok': {
    table: 'cod_gagal_tiktok',
    required: [],
    map: (row) => ({
      status_brg:                       pick(row, 'status_brg', 'status brg'),
      dibukukan_accurate:               parseDate(pick(row, 'dibukukan_accurate', 'dibukukan accurate')) || pick(row, 'dibukukan_accurate', 'dibukukan accurate'),
      order_id:                         pick(row, 'order_id', 'order id'),
      order_status:                     pick(row, 'order_status', 'order status'),
      order_substatus:                  pick(row, 'order_substatus', 'order substatus'),
      cancelation_return_type:          pick(row, 'cancelation_return_type', 'cancelationreturn_type', 'cancelation_return type'),
      normal_or_preorder:               pick(row, 'normal_or_preorder', 'normal or preorder', 'normal or preorder'),
      sku_id:                           pick(row, 'sku_id', 'sku id'),
      seller_sku:                       pick(row, 'seller_sku', 'seller sku'),
      variation:                        pick(row, 'variation'),
      delivery_option:                  pick(row, 'delivery_option', 'delivery option'),
      shipping_provider_name:           pick(row, 'shipping_provider_name', 'shipping provider name'),
      buyer_message:                    pick(row, 'buyer_message', 'buyer message'),
      buyer_username:                   pick(row, 'buyer_username', 'buyer username'),
      recipient:                        pick(row, 'recipient'),
      phone:                            pick(row, 'phone', 'phone #'),
      zipcode:                          pick(row, 'zipcode'),
      country:                          pick(row, 'country'),
      province:                         pick(row, 'province'),
      regency_and_city:                 pick(row, 'regency_and_city', 'regency and city'),
      districts:                        pick(row, 'districts'),
      villages:                         pick(row, 'villages'),
      detail_address:                   pick(row, 'detail_address', 'detail address'),
      additional_address:               pick(row, 'additional_address', 'additional address information'),
      payment_method:                   pick(row, 'payment_method', 'payment method'),
      weight_kg:                        parseCleanDecimal(pick(row, 'weight_kg', 'weightkg', 'weight(kg)')),
      product_category:                 pick(row, 'product_category', 'product category'),
      package_id:                       pick(row, 'package_id', 'package id'),
      purchase_channel:                 pick(row, 'purchase_channel', 'purchase channel'),
      seller_note:                      pick(row, 'seller_note', 'seller note'),
      checked_status:                   pick(row, 'checked_status', 'checked status'),
      checked_marked_by:                pick(row, 'checked_marked_by', 'checked marked by'),
      tokopedia_invoice_number:         pick(row, 'tokopedia_invoice_number', 'tokopedia invoice number'),
      // Kolom tambahan dari Excel
      sku_quantity_of_return:           parseInt(pick(row, 'sku_quantity_of_return', 'sku quantity of return')) || null,
      sku_unit_original_price:          parseCleanDecimal(pick(row, 'sku_unit_original_price', 'sku unit original price')),
      sku_subtotal_before_discount:     parseCleanDecimal(pick(row, 'sku_subtotal_before_discount', 'sku subtotal before discount')),
      sku_platform_discount:            parseCleanDecimal(pick(row, 'sku_platform_discount', 'sku platform discount')),
      sku_seller_discount:              parseCleanDecimal(pick(row, 'sku_seller_discount', 'sku seller discount')),
      sku_subtotal_after_discount:      parseCleanDecimal(pick(row, 'sku_subtotal_after_discount', 'sku subtotal after discount')),
      shipping_fee_after_discount:      parseCleanDecimal(pick(row, 'shipping_fee_after_discount', 'shipping fee after discount')),
      original_shipping_fee:            parseCleanDecimal(pick(row, 'original_shipping_fee', 'original shipping fee')),
      shipping_fee_seller_discount:     parseCleanDecimal(pick(row, 'shipping_fee_seller_discount', 'shipping fee seller discount')),
      shipping_fee_platform_discount:   parseCleanDecimal(pick(row, 'shipping_fee_platform_discount', 'shipping fee platform discount')),
      payment_platform_discount:        parseCleanDecimal(pick(row, 'payment_platform_discount', 'payment platform discount')),
      buyer_service_fee:                parseCleanDecimal(pick(row, 'buyer_service_fee', 'buyer service fee')),
      handling_fee:                     parseCleanDecimal(pick(row, 'handling_fee', 'handling fee')),
      shipping_insurance:               parseCleanDecimal(pick(row, 'shipping_insurance', 'shipping insurance')),
      item_insurance:                   parseCleanDecimal(pick(row, 'item_insurance', 'item insurance')),
      order_amount:                     parseCleanDecimal(pick(row, 'order_amount', 'order amount')),
      order_refund_amount:              parseCleanDecimal(pick(row, 'order_refund_amount', 'order refund amount')),
      created_time:                     pick(row, 'created_time', 'created time') || null,
      paid_time:                        pick(row, 'paid_time', 'paid time') || null,
      rts_time:                         pick(row, 'rts_time', 'rts time') || null,
      shipped_time:                     pick(row, 'shipped_time', 'shipped time') || null,
      delivered_time:                   pick(row, 'delivered_time', 'delivered time') || null,
      cancelled_time:                   pick(row, 'cancelled_time', 'cancelled time') || null,
      cancel_by:                        pick(row, 'cancel_by', 'cancel by'),
      cancel_reason:                    pick(row, 'cancel_reason', 'cancel reason'),
      fulfillment_type:                 pick(row, 'fulfillment_type', 'fulfillment type'),
      warehouse_name:                   pick(row, 'warehouse_name', 'warehouse name'),
      tracking_id:                      pick(row, 'tracking_id', 'tracking id', 'trackingid'),
    }),
  },

  'cod-gagal-shopee-algoo': {
    table: 'cod_gagal_shopee_algoo',
    required: [],
    map: (row) => ({
      status_brg:                          pick(row, 'status_brg', 'status brg'),
      dibukukan_accurate:                  parseDate(pick(row, 'dibukukan_accurate', 'dibukukan accurate')) || pick(row, 'dibukukan_accurate', 'dibukukan accurate'),
      no_pesanan:                          pick(row, 'no_pesanan', 'no pesanan', 'no. pesanan'),
      status_pesanan:                      pick(row, 'status_pesanan', 'status pesanan'),
      status_pembatalan_pengembalian:      pick(row, 'status_pembatalan_pengembalian', 'status pembatalanpengembalian'),
      status_pengiriman_gagal:             pick(row, 'status_pengiriman_gagal', 'status pengiriman gagal'),
      no_resi:                             pick(row, 'no_resi', 'no resi', 'no. resi'),
      sku_induk:                           pick(row, 'sku_induk', 'sku induk'),
      nama_produk:                         pick(row, 'nama_produk', 'nama produk'),
      nomor_referensi_sku:                 pick(row, 'nomor_referensi_sku', 'nomor referensi sku'),
      serial_number:                       pick(row, 'serial_number', 'serial number'),
      nama_variasi:                        pick(row, 'nama_variasi', 'nama variasi'),
      harga_awal:                          parseCleanDecimal(pick(row, 'harga_awal', 'harga awal')),
      harga_setelah_diskon:                parseCleanDecimal(pick(row, 'harga_setelah_diskon', 'harga setelah diskon')),
      jumlah:                              parseInt(pick(row, 'jumlah')) || null,
      returned_quantity:                   parseInt(pick(row, 'returned_quantity', 'returned quantity')) || null,
      total_harga_produk:                  parseCleanDecimal(pick(row, 'total_harga_produk', 'total harga produk')),
      total_diskon:                        parseCleanDecimal(pick(row, 'total_diskon', 'total diskon')),
      diskon_dari_penjual:                 parseCleanDecimal(pick(row, 'diskon_dari_penjual', 'diskon dari penjual')),
      diskon_dari_shopee:                  parseCleanDecimal(pick(row, 'diskon_dari_shopee', 'diskon dari shopee')),
      berat_produk:                        pick(row, 'berat_produk', 'berat produk'),
      jumlah_produk_di_pesan:              parseInt(pick(row, 'jumlah_produk_di_pesan', 'jumlah produk di pesan')) || null,
      total_berat:                         pick(row, 'total_berat', 'total berat'),
      voucher_ditanggung_penjual:          parseCleanDecimal(pick(row, 'voucher_ditanggung_penjual', 'voucher ditanggung penjual')),
      cashback_koin:                       parseCleanDecimal(pick(row, 'cashback_koin', 'cashback koin')),
      voucher_ditanggung_shopee:           pick(row, 'voucher_ditanggung_shopee', 'voucher ditanggung shopee'),
      paket_diskon:                        parseCleanDecimal(pick(row, 'paket_diskon', 'paket diskon')),
      paket_diskon_dari_shopee:            parseCleanDecimal(pick(row, 'paket_diskon_dari_shopee', 'paket diskon diskon dari shopee')),
      paket_diskon_dari_penjual:           parseCleanDecimal(pick(row, 'paket_diskon_dari_penjual', 'paket diskon diskon dari penjual')),
      potongan_koin_shopee:                parseCleanDecimal(pick(row, 'potongan_koin_shopee', 'potongan koin shopee')),
      diskon_kartu_kredit:                 parseCleanDecimal(pick(row, 'diskon_kartu_kredit', 'diskon kartu kredit')),
      ongkir_dibayar_pembeli:              parseCleanDecimal(pick(row, 'ongkir_dibayar_pembeli', 'ongkos kirim dibayar oleh pembeli')),
      estimasi_potongan_biaya_pengiriman:  parseCleanDecimal(pick(row, 'estimasi_potongan_biaya_pengiriman', 'estimasi potongan biaya pengiriman')),
      ongkir_pengembalian_barang:          parseCleanDecimal(pick(row, 'ongkir_pengembalian_barang', 'ongkos kirim pengembalian barang')),
      total_pembayaran:                    parseCleanDecimal(pick(row, 'total_pembayaran', 'total pembayaran')),
      perkiraan_ongkir:                    parseCleanDecimal(pick(row, 'perkiraan_ongkir', 'perkiraan ongkos kirim')),
      catatan_dari_pembeli:                pick(row, 'catatan_dari_pembeli', 'catatan dari pembeli'),
      catatan:                             pick(row, 'catatan'),
      username_pembeli:                    pick(row, 'username_pembeli', 'username pembeli'),
      nama_penerima:                       pick(row, 'nama_penerima', 'nama penerima'),
      no_telepon:                          pick(row, 'no_telepon', 'no telepon', 'no. telepon'),
      alamat_pengiriman:                   pick(row, 'alamat_pengiriman', 'alamat pengiriman'),
      kota_kabupaten:                      pick(row, 'kota_kabupaten', 'kotakabupaten'),
      provinsi:                            pick(row, 'provinsi'),
      waktu_pesanan_selesai:               pick(row, 'waktu_pesanan_selesai', 'waktu pesanan selesai') || null,
    }),
  },

  'cod-gagal-shopee-mami': {
    table: 'cod_gagal_shopee_mami_kasir',
    required: [],
    map: (row) => ({
      status_brg:                          pick(row, 'status_brg', 'status brg'),
      dibukukan_accurate:                  parseDate(pick(row, 'dibukukan_accurate', 'dibukukan accurate')) || pick(row, 'dibukukan_accurate', 'dibukukan accurate'),
      no_pesanan:                          pick(row, 'no_pesanan', 'no pesanan', 'no. pesanan'),
      status_pesanan:                      pick(row, 'status_pesanan', 'status pesanan'),
      status_pembatalan_pengembalian:      pick(row, 'status_pembatalan_pengembalian', 'status pembatalanpengembalian'),
      status_pengiriman_gagal:             pick(row, 'status_pengiriman_gagal', 'status pengiriman gagal'),
      no_resi:                             pick(row, 'no_resi', 'no resi', 'no. resi'),
      opsi_pengiriman:                     pick(row, 'opsi_pengiriman', 'opsi pengiriman'),
      antar_ke_counter:                    pick(row, 'antar_ke_counter', 'antar ke counter pick-up', 'antar ke counter/ pickup'),
      pesanan_harus_dikirim_sebelum:       pick(row, 'pesanan_harus_dikirim_sebelum', 'pesanan harus dikirimkan sebelum') || null,
      waktu_pengiriman_diatur:             pick(row, 'waktu_pengiriman_diatur', 'waktu pengiriman diatur') || null,
      sku_induk:                           pick(row, 'sku_induk', 'sku induk'),
      nama_produk:                         pick(row, 'nama_produk', 'nama produk'),
      nomor_referensi_sku:                 pick(row, 'nomor_referensi_sku', 'nomor referensi sku'),
      nama_variasi:                        pick(row, 'nama_variasi', 'nama variasi'),
      harga_awal:                          parseCleanDecimal(pick(row, 'harga_awal', 'harga awal')),
      harga_setelah_diskon:                parseCleanDecimal(pick(row, 'harga_setelah_diskon', 'harga setelah diskon')),
      jumlah:                              parseInt(pick(row, 'jumlah')) || null,
      returned_quantity:                   parseInt(pick(row, 'returned_quantity', 'returned quantity')) || null,
      total_harga_produk:                  parseCleanDecimal(pick(row, 'total_harga_produk', 'total harga produk')),
      total_diskon:                        parseCleanDecimal(pick(row, 'total_diskon', 'total diskon')),
      diskon_dari_penjual:                 parseCleanDecimal(pick(row, 'diskon_dari_penjual', 'diskon dari penjual')),
      diskon_dari_shopee:                  parseCleanDecimal(pick(row, 'diskon_dari_shopee', 'diskon dari shopee')),
      berat_produk:                        pick(row, 'berat_produk', 'berat produk'),
      jumlah_produk_di_pesan:              parseInt(pick(row, 'jumlah_produk_di_pesan', 'jumlah produk di pesan')) || null,
      total_berat:                         pick(row, 'total_berat', 'total berat'),
      voucher_ditanggung_penjual:          parseCleanDecimal(pick(row, 'voucher_ditanggung_penjual', 'voucher ditanggung penjual')),
      cashback_koin:                       parseCleanDecimal(pick(row, 'cashback_koin', 'cashback koin')),
      voucher_ditanggung_shopee:           pick(row, 'voucher_ditanggung_shopee', 'voucher ditanggung shopee'),
      paket_diskon:                        parseCleanDecimal(pick(row, 'paket_diskon', 'paket diskon')),
      paket_diskon_dari_shopee:            parseCleanDecimal(pick(row, 'paket_diskon_dari_shopee')),
      paket_diskon_dari_penjual:           parseCleanDecimal(pick(row, 'paket_diskon_dari_penjual')),
      potongan_koin_shopee:                parseCleanDecimal(pick(row, 'potongan_koin_shopee', 'potongan koin shopee')),
      diskon_kartu_kredit:                 parseCleanDecimal(pick(row, 'diskon_kartu_kredit', 'diskon kartu kredit')),
      ongkir_dibayar_pembeli:              parseCleanDecimal(pick(row, 'ongkir_dibayar_pembeli', 'ongkos kirim dibayar oleh pembeli')),
      estimasi_potongan_biaya_pengiriman:  parseCleanDecimal(pick(row, 'estimasi_potongan_biaya_pengiriman', 'estimasi potongan biaya pengiriman')),
      ongkir_pengembalian_barang:          parseCleanDecimal(pick(row, 'ongkir_pengembalian_barang', 'ongkos kirim pengembalian barang')),
      total_pembayaran:                    parseCleanDecimal(pick(row, 'total_pembayaran', 'total pembayaran')),
      perkiraan_ongkir:                    parseCleanDecimal(pick(row, 'perkiraan_ongkir', 'perkiraan ongkos kirim')),
      catatan_dari_pembeli:                pick(row, 'catatan_dari_pembeli', 'catatan dari pembeli'),
      catatan:                             pick(row, 'catatan'),
      username_pembeli:                    pick(row, 'username_pembeli', 'username pembeli'),
      nama_penerima:                       pick(row, 'nama_penerima', 'nama penerima'),
      no_telepon:                          pick(row, 'no_telepon', 'no telepon', 'no. telepon'),
      alamat_pengiriman:                   pick(row, 'alamat_pengiriman', 'alamat pengiriman'),
      kota_kabupaten:                      pick(row, 'kota_kabupaten', 'kotakabupaten'),
      provinsi:                            pick(row, 'provinsi'),
      waktu_pesanan_selesai:               pick(row, 'waktu_pesanan_selesai', 'waktu pesanan selesai') || null,
      waktu_pesanan_dibuat:                pick(row, 'waktu_pesanan_dibuat', 'waktu pesanan dibuat') || null,
      waktu_pembayaran_dilakukan:          pick(row, 'waktu_pembayaran_dilakukan', 'waktu pembayaran dilakukan') || null,
      metode_pembayaran:                   pick(row, 'metode_pembayaran', 'metode pembayaran'),
      status_klaim:                        pick(row, 'status_klaim', 'status klaim'),
      tanggal_klaim_diajukan:              parseDate(pick(row, 'tanggal_klaim_diajukan', 'tanggal klaim diajukan')),
      tanggal_klaim_disetujui:             parseDate(pick(row, 'tanggal_klaim_disetujui', 'tanggal klaim disetujui')),
      tanggal_klaim_dicairkan:             parseDate(pick(row, 'tanggal_klaim_dicairkan', 'tanggal klaim dicairkan')),
      tanggal_klaim_ditolak:               parseDate(pick(row, 'tanggal_klaim_ditolak', 'tanggal klaim ditolak')),
      summary:                             null, // wait, keep it same
      jumlah_kompensasi:                   parseCleanDecimal(pick(row, 'jumlah_kompensasi', 'jumlah kompensasi')),
    }),
  },

  'cod-gagal-tiktok-mami': {
    table: 'cod_gagal_tiktok_mami_kasir',
    required: [],
    map: (row) => ({
      status_brg:                          pick(row, 'status_brg', 'status brg'),
      dibukukan_accurate:                  parseDate(pick(row, 'dibukukan_accurate', 'dibukukan accurate')) || pick(row, 'dibukukan_accurate', 'dibukukan accurate'),
      no_pesanan:                          pick(row, 'no_pesanan', 'no pesanan', 'no. pesanan', 'order_id', 'order id', 'no_order', 'no order', 'nomor_pesanan', 'nomor pesanan'),
      status_pesanan:                      pick(row, 'status_pesanan', 'status pesanan', 'order_status', 'order status'),
      status_pembatalan_pengembalian:      pick(row, 'status_pembatalan_pengembalian', 'status pembatalanpengembalian', 'cancelation_return_type', 'cancelation return type'),
      status_pengiriman_gagal:             pick(row, 'status_pengiriman_gagal', 'status pengiriman gagal', 'order_substatus', 'order substatus'),
      no_resi:                             pick(row, 'no_resi', 'no resi', 'no. resi'),
      sku_induk:                           pick(row, 'sku_induk', 'sku induk', 'sku_id', 'sku id', 'seller_sku', 'seller sku'),
      nama_produk:                         pick(row, 'nama_produk', 'nama produk'),
      nomor_referensi_sku:                 pick(row, 'nomor_referensi_sku', 'nomor referensi sku'),
      serial_number:                       pick(row, 'serial_number', 'serial number'),
      nama_variasi:                        pick(row, 'nama_variasi', 'nama variasi', 'variation'),
      harga_awal:                          parseCleanDecimal(pick(row, 'harga_awal', 'harga awal')),
      harga_setelah_diskon:                parseCleanDecimal(pick(row, 'harga_setelah_diskon', 'harga setelah diskon')),
      jumlah:                              parseInt(pick(row, 'jumlah')) || null,
      returned_quantity:                   parseInt(pick(row, 'returned_quantity', 'returned quantity')) || null,
      total_harga_produk:                  parseCleanDecimal(pick(row, 'total_harga_produk', 'total harga produk')),
      total_diskon:                        parseCleanDecimal(pick(row, 'total_diskon', 'total diskon')),
      diskon_dari_penjual:                 parseCleanDecimal(pick(row, 'diskon_dari_penjual', 'diskon dari penjual')),
      diskon_dari_shopee:                  parseCleanDecimal(pick(row, 'diskon_dari_shopee', 'diskon dari shopee')),
      berat_produk:                        pick(row, 'berat_produk', 'berat produk', 'weight_kg', 'weightkg', 'weight(kg)'),
      jumlah_produk_di_pesan:              parseInt(pick(row, 'jumlah_produk_di_pesan', 'jumlah produk di pesan')) || null,
      total_berat:                         pick(row, 'total_berat', 'total berat'),
      voucher_ditanggung_penjual:          parseCleanDecimal(pick(row, 'voucher_ditanggung_penjual', 'voucher ditanggung penjual')),
      cashback_koin:                       parseCleanDecimal(pick(row, 'cashback_koin', 'cashback koin')),
      voucher_ditanggung_shopee:           pick(row, 'voucher_ditanggung_shopee', 'voucher ditanggung shopee'),
      paket_diskon:                        parseCleanDecimal(pick(row, 'paket_diskon', 'paket diskon')),
      paket_diskon_dari_shopee:            parseCleanDecimal(pick(row, 'paket_diskon_dari_shopee')),
      paket_diskon_dari_penjual:           parseCleanDecimal(pick(row, 'paket_diskon_dari_penjual')),
      potongan_koin_shopee:                parseCleanDecimal(pick(row, 'potongan_koin_shopee', 'potongan koin shopee')),
      diskon_kartu_kredit:                 parseCleanDecimal(pick(row, 'diskon_kartu_kredit', 'diskon kartu kredit')),
      ongkir_dibayar_pembeli:              parseCleanDecimal(pick(row, 'ongkir_dibayar_pembeli', 'ongkos kirim dibayar oleh pembeli')),
      estimasi_potongan_biaya_pengiriman:  parseCleanDecimal(pick(row, 'estimasi_potongan_biaya_pengiriman', 'estimasi potongan biaya pengiriman')),
      ongkir_pengembalian_barang:          parseCleanDecimal(pick(row, 'ongkir_pengembalian_barang', 'ongkos kirim pengembalian barang')),
      total_pembayaran:                    parseCleanDecimal(pick(row, 'total_pembayaran', 'total pembayaran')),
      perkiraan_ongkir:                    parseCleanDecimal(pick(row, 'perkiraan_ongkir', 'perkiraan ongkos kirim')),
      catatan_dari_pembeli:                pick(row, 'catatan_dari_pembeli', 'catatan dari pembeli', 'buyer_message', 'buyer message'),
      catatan:                             pick(row, 'catatan', 'seller_note', 'seller note'),
      username_pembeli:                    pick(row, 'username_pembeli', 'username pembeli', 'buyer_username', 'buyer username'),
      nama_penerima:                       pick(row, 'nama_penerima', 'nama penerima', 'recipient'),
      no_telepon:                          pick(row, 'no_telepon', 'no telepon', 'no. telepon', 'phone', 'phone #'),
      alamat_pengiriman:                   pick(row, 'alamat_pengiriman', 'alamat pengiriman', 'detail_address', 'detail address'),
      kota_kabupaten:                      pick(row, 'kota_kabupaten', 'kotakabupaten', 'regency_and_city', 'regency and city'),
      provinsi:                            pick(row, 'provinsi', 'province'),
      waktu_pesanan_selesai:               pick(row, 'waktu_pesanan_selesai', 'waktu pesanan selesai') || null,
    }),
  },
};
// ─── IMPORT HANDLER ───────────────────────────────────────────────────────────
exports.importExcel = async (req, res) => {
  const { module } = req.params;
  const config = MODULE_CONFIGS[module];

  if (!config) {
    if (req.file) fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, message: `Modul "${module}" tidak dikenali` });
  }

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'File Excel tidak ditemukan' });
  }

  try {
    const rows = readExcel(req.file.path);

    if (rows.length === 0) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'File Excel kosong atau tidak ada data' });
    }

    const userId = req.user?.id || null;
    const errors = [];
    let inserted = 0;
    let skipped = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row number (1=header, 2=first data)

      // Check required fields
      const missing = config.required.filter((f) => !pick(row, f));
      if (missing.length > 0) {
        errors.push(`Baris ${rowNum}: kolom wajib kosong (${missing.join(', ')})`);
        skipped++;
        continue;
      }

      try {
        const data = config.map(row);
        data.created_by = userId;

        const cols = Object.keys(data);
        const vals = Object.values(data);
        const placeholders = cols.map(() => '?').join(', ');

        await db.query(
          `INSERT INTO ${config.table} (${cols.join(', ')}) VALUES (${placeholders})`,
          vals
        );
        inserted++;
      } catch (rowErr) {
        errors.push(`Baris ${rowNum}: ${rowErr.message}`);
        skipped++;
      }
    }

    fs.unlinkSync(req.file.path);

    return res.json({
      success: true,
      message: `Import selesai: ${inserted} data berhasil, ${skipped} dilewati`,
      data: { inserted, skipped, errors: errors.slice(0, 20) }, // max 20 error messages
    });
  } catch (err) {
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error('Import error:', err);
    return res.status(500).json({ success: false, message: 'Gagal memproses file: ' + err.message });
  }
};

// ─── DOWNLOAD TEMPLATE ────────────────────────────────────────────────────────
const TEMPLATES = {
  rusak: {
    name: 'Template_Rusak.xlsx',
    headers: ['tgl_masuk', 'marketplace', 'no_pesanan', 'alasan_retur', 'produk', 'serial_number', 'kondisi_barang', 'kelengkapan', 'diagnosa', 'validasi', 'status', 'tgl_servis', 'tgl_selesai_servis', 'hasil_akhir', 'tgl_kembali_stok', 'keterangan'],
    example: ['2024-01-15', 'Shopee', 'SPX123456', 'Barang rusak', 'Produk A', 'SN001', 'Rusak ringan', 'Lengkap', 'Layar retak', 'Valid', 'Service', '2024-01-16', '', 'Proses Service', '', ''],
  },
  blp: {
    name: 'Template_BLP.xlsx',
    headers: ['marketplace', 'no_pesanan', 'alasan_retur', 'produk', 'serial_number', 'kondisi_barang', 'kelengkapan', 'diagnosa', 'validasi', 'status', 'tgl_servis', 'tgl_selesai_servis', 'hasil_akhir', 'tgl_kembali_stok', 'keterangan'],
    example: ['Shopee', 'SPX123456', 'Barang rusak', 'Produk A', 'SN001', 'Rusak ringan', 'Lengkap', 'Layar retak', 'Valid', 'Service', '2024-01-16', '', 'Proses Service', '', ''],
  },
  cancel: {
    name: 'Template_Cancel.xlsx',
    headers: ['tgl', 'dpk', 'marketplace', 'no_order', 'produk', 'qty', 'keterangan'],
    example: ['2024-01-15', 'DPK001', 'Shopee', 'SPX123456', 'Produk A', '1', ''],
  },
  pergantian: {
    name: 'Template_Pergantian.xlsx',
    headers: ['tgl', 'marketplace', 'no_order', 'nama_barang_awal', 'qty', 'nama_barang_diganti', 'keterangan'],
    example: ['2024-01-15', 'Shopee', 'SPX123456', 'Produk A', '1', 'Produk B', ''],
  },
  'tiket-tiktok': {
    name: 'Template_Tiket_TikTok.xlsx',
    headers: ['no_tiket', 'no_order', 'kendala', 'proses', 'gudang', 'keterangan'],
    example: ['TKT001', 'TT123456', 'Barang tidak sampai', 'No Going', 'Jakarta', ''],
  },
  'tiket-shopee': {
    name: 'Template_Tiket_Shopee.xlsx',
    headers: ['no_tiket', 'no_order', 'kendala', 'proses', 'gudang', 'keterangan'],
    example: ['TKT001', 'SPX123456', 'Barang tidak sampai', 'No Going', 'Jakarta', ''],
  },
  'retur-tiktok': {
    name: 'Template_Retur_TikTok.xlsx',
    headers: ['tgl_order', 'nama_akun', 'no_order', 'no_retur', 'produk', 'kendala', 'proses', 'gudang', 'keterangan'],
    example: ['2024-01-15', 'Toko ABC', 'TT123456', 'RTR001', 'Produk A', 'Barang rusak', 'Tidak Banding', 'Jakarta', ''],
  },
  'retur-shopee': {
    name: 'Template_Retur_Shopee.xlsx',
    headers: ['tgl_order', 'nama_akun', 'no_order', 'no_retur', 'produk', 'kendala', 'proses', 'gudang', 'keterangan'],
    example: ['2024-01-15', 'Toko ABC', 'SPX123456', 'RTR001', 'Produk A', 'Barang rusak', 'Tidak Banding', 'Jakarta', ''],
  },

  'cod-gagal': {
    name: 'Template_COD_Gagal.xlsx',
    headers: ['tgl_order', 'nama_akun', 'no_order', 'no_retur', 'produk', 'kendala', 'proses', 'gudang', 'keterangan'],
    example: ['2024-01-15', 'Toko ABC', 'COD123456', 'RTR001', 'Produk A', 'COD tidak diterima', 'Tidak Banding', 'Jakarta', ''],
  },

  'retur-pengembalian': {
    name: 'Template_Retur_Pengembalian.xlsx',
    headers: ['tgl_order', 'nama_akun', 'no_order', 'no_retur', 'produk', 'kendala', 'proses', 'gudang', 'keterangan'],
    example: ['2024-01-15', 'Toko ABC', 'SPX123456', 'RTR001', 'Produk A', 'Barang dikembalikan', 'Tidak Banding', 'Jakarta', ''],
  },

  'cod-gagal-tiktok': {
    name: 'Template_COD_Gagal_TikTok.xlsx',
    headers: ['status_brg', 'dibukukan_accurate', 'order_id', 'order_status', 'order_substatus', 'cancelation_return_type', 'normal_or_preorder', 'sku_id', 'seller_sku', 'variation', 'delivery_option', 'shipping_provider_name', 'buyer_message', 'buyer_username', 'recipient', 'phone', 'zipcode', 'country', 'province', 'regency_and_city', 'districts', 'villages', 'detail_address', 'additional_address', 'payment_method', 'weight_kg', 'product_category', 'package_id', 'purchase_channel', 'seller_note', 'checked_status', 'checked_marked_by', 'tokopedia_invoice_number'],
    example: ['Diterima', '08-May', '583799845781275907', 'Dikirim', 'Sedang transit', '', 'Normal', '173538357278428062', 'AT-58M', 'AT 58M, TANPA KERTAS', 'Algoo Tech', 'JX9262167535', '', 'buyer123', 'Nama Penerima', '08123456789', '12345', 'Indonesia', 'Jawa Barat', 'Kota Bandung', 'Coblong', 'Dago', 'Jl. Dago No. 1', '', 'Bayar di tempat', '0.75', 'Bayar di tempat', 'PKG001', 'Pemindai Barcode', '11947163936881210636', 'TikTok', 'Admin', 'Unchecked'],
  },

  'cod-gagal-shopee-algoo': {
    name: 'Template_COD_Gagal_Shopee_Algoo.xlsx',
    headers: ['status_brg', 'dibukukan_accurate', 'no_pesanan', 'status_pesanan', 'status_pembatalan_pengembalian', 'status_pengiriman_gagal', 'no_resi', 'sku_induk', 'nama_produk', 'nomor_referensi_sku', 'serial_number', 'nama_variasi', 'harga_awal', 'harga_setelah_diskon', 'jumlah', 'returned_quantity', 'total_harga_produk', 'total_diskon', 'diskon_dari_penjual', 'diskon_dari_shopee', 'berat_produk', 'jumlah_produk_di_pesan', 'total_berat', 'voucher_ditanggung_penjual', 'cashback_koin', 'voucher_ditanggung_shopee', 'paket_diskon', 'paket_diskon_dari_shopee', 'paket_diskon_dari_penjual', 'potongan_koin_shopee', 'diskon_kartu_kredit', 'ongkir_dibayar_pembeli', 'estimasi_potongan_biaya_pengiriman', 'ongkir_pengembalian_barang', 'total_pembayaran', 'perkiraan_ongkir', 'catatan_dari_pembeli', 'catatan', 'username_pembeli', 'nama_penerima', 'no_telepon', 'alamat_pengiriman', 'kota_kabupaten', 'provinsi', 'waktu_pesanan_selesai'],
    example: ['Diterima', '28-Apr', '260427VT61WAVB', 'Batal', '', 'Selesai Dikirim ke Penjual', 'SPXID060474312994', 'AL-100BLP-BLACK', 'AL-100BLP-BLACK-100x100-@1Roll', 'BLP-BLACK.100x100@500 1Roll', '1.740.999', 'WHITE', '720000', '0', '1', '0', '720000', '0', '3500 gr', '0', '1', '3500 gr', '0', '0', '0', 'N', '0', '0', '0', '0', '0', '0', '0', '0', '98400', '', '', '', 'andririchs', 'A***i', 'Ja*****', 'KAB. SERDANG BEDAGAI', 'KAB. SERDANG BEDAGAI', 'SUMATERA UTARA', ''],
  },

  'cod-gagal-shopee-mami': {
    name: 'Template_COD_Gagal_Shopee_Mami_Kasir.xlsx',
    headers: ['status_brg', 'dibukukan_accurate', 'no_pesanan', 'status_pesanan', 'status_pembatalan_pengembalian', 'status_pengiriman_gagal', 'no_resi', 'opsi_pengiriman', 'antar_ke_counter', 'pesanan_harus_dikirim_sebelum', 'waktu_pengiriman_diatur', 'sku_induk', 'nama_produk', 'nomor_referensi_sku', 'nama_variasi', 'harga_awal', 'harga_setelah_diskon', 'jumlah', 'returned_quantity', 'total_harga_produk', 'total_diskon', 'diskon_dari_penjual', 'diskon_dari_shopee', 'berat_produk', 'jumlah_produk_di_pesan', 'total_berat', 'voucher_ditanggung_penjual', 'cashback_koin', 'voucher_ditanggung_shopee', 'paket_diskon', 'paket_diskon_dari_shopee', 'paket_diskon_dari_penjual', 'potongan_koin_shopee', 'diskon_kartu_kredit', 'ongkir_dibayar_pembeli', 'estimasi_potongan_biaya_pengiriman', 'ongkir_pengembalian_barang', 'total_pembayaran', 'perkiraan_ongkir', 'catatan_dari_pembeli', 'catatan', 'username_pembeli', 'nama_penerima', 'no_telepon', 'alamat_pengiriman', 'kota_kabupaten', 'provinsi', 'waktu_pesanan_selesai', 'waktu_pesanan_dibuat', 'waktu_pembayaran_dilakukan', 'metode_pembayaran', 'status_klaim', 'tanggal_klaim_diajukan', 'tanggal_klaim_disetujui', 'tanggal_klaim_dicairkan', 'tanggal_klaim_ditolak', 'jumlah_kompensasi'],
    example: ['Diterima', '12-Jul', '250513QUX85G3D', 'Batal', '', 'Selesai Dikirim ke Penjual', '004447315396', 'Reguler (Cashless)-SiCepat REG', 'Antar ke Counter', '2025-05-14 23:59', '2025-05-13 17:23', 'AT-5803', 'MAMI KASIR AT-5803 Printer Thermal Mini Printer Struk Nota', 'AT-5803 BLK', 'BLACK', '450000', '157500', '1', '0', '157500', '292500', '292500', '0', '650 gr', '1', '650 gr', '0', '0', 'N', '0', '0', '0', '0', '0', '0', '0', '0', '10000', '', '', '', 'mutiaaazizah451', 'B*****j', '*****01', 'KOTA JAKARTA TIMUR', 'KOTA JAKARTA TIMUR', 'DKI JAKARTA', '', '2025-05-13 14:24', '2025-05-13 14:24', 'COD (Bayar di Tempat)', '', '', '', '', '', '0'],
  },

  'cod-gagal-tiktok-mami': {
    name: 'Template_COD_Gagal_TikTok_Mami_Kasir.xlsx',
    headers: ['status_brg', 'dibukukan_accurate', 'no_pesanan', 'status_pesanan', 'status_pembatalan_pengembalian', 'status_pengiriman_gagal', 'no_resi', 'sku_induk', 'nama_produk', 'nomor_referensi_sku', 'serial_number', 'nama_variasi', 'harga_awal', 'harga_setelah_diskon', 'jumlah', 'returned_quantity', 'total_harga_produk', 'total_diskon', 'diskon_dari_penjual', 'diskon_dari_shopee', 'berat_produk', 'jumlah_produk_di_pesan', 'total_berat', 'voucher_ditanggung_penjual', 'cashback_koin', 'voucher_ditanggung_shopee', 'paket_diskon', 'paket_diskon_dari_shopee', 'paket_diskon_dari_penjual', 'potongan_koin_shopee', 'diskon_kartu_kredit', 'ongkir_dibayar_pembeli', 'estimasi_potongan_biaya_pengiriman', 'ongkir_pengembalian_barang', 'total_pembayaran', 'perkiraan_ongkir', 'catatan_dari_pembeli', 'catatan', 'username_pembeli', 'nama_penerima', 'no_telepon', 'alamat_pengiriman', 'kota_kabupaten', 'provinsi', 'waktu_pesanan_selesai'],
    example: ['Diterima', '28-Apr', '260427VT61WAVB', 'Batal', '', 'Selesai Dikirim ke Penjual', 'SPXID060474312994', 'AL-100BLP-BLACK', 'AL-100BLP-BLACK-100x100-@1Roll', 'BLP-BLACK.100x100@500 1Roll', '1740999', 'WHITE', '720000', '0', '1', '0', '720000', '0', '3500 gr', '0', '1', '3500 gr', '0', '0', '0', 'N', '0', '0', '0', '0', '0', '0', '0', '0', '98400', '', '', '', 'andririchs', 'A***i', 'Ja*****', 'KAB. SERDANG BEDAGAI', 'KAB. SERDANG BEDAGAI', 'SUMATERA UTARA', ''],
  },
};

exports.downloadTemplate = (req, res) => {
  const { module } = req.params;
  const tpl = TEMPLATES[module];

  if (!tpl) {
    return res.status(400).json({ success: false, message: `Modul "${module}" tidak dikenali` });
  }

  const wb = xlsx.utils.book_new();
  const wsData = [tpl.headers, tpl.example];
  const ws = xlsx.utils.aoa_to_sheet(wsData);

  // Style header row width
  ws['!cols'] = tpl.headers.map(() => ({ wch: 20 }));

  xlsx.utils.book_append_sheet(wb, ws, 'Data');
  const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

  res.setHeader('Content-Disposition', `attachment; filename="${tpl.name}"`);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.send(buf);
};
