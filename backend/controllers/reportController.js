const db = require('../config/database');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');

exports.getDashboardStats = async (req, res) => {
  try {
    const { date_from, date_to } = req.query;

    // Optional date filter for retur section only.
    // Use DATE(created_at) so it works consistently across TIMESTAMP/DATETIME columns.
    const dateWhere = (date_from && date_to) ? ` AND DATE(created_at) BETWEEN ? AND ?` : '';
    const dateParams = (date_from && date_to) ? [date_from, date_to] : [];

    const [rusakStats] = await db.query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN status = 'Service' THEN 1 ELSE 0 END) as service,
        SUM(CASE WHEN status = 'Error' THEN 1 ELSE 0 END) as error,
        SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as selesai
      FROM rusak
    `);

    const [blpStats] = await db.query(`SELECT COUNT(*) as total FROM blp`);
    const [pergantianStats] = await db.query(`SELECT COUNT(*) as total FROM pergantian_barang`);
    const [cancelStats] = await db.query(`SELECT COUNT(*) as total FROM orderan_cancel`);

    const [tiketTiktokStats] = await db.query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN proses = 'Clear' THEN 1 ELSE 0 END) as clear,
        SUM(CASE WHEN proses = 'No Going' THEN 1 ELSE 0 END) as no_going
      FROM tiket_tiktok
    `);

    const [tiketShopeeStats] = await db.query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN proses = 'Clear' THEN 1 ELSE 0 END) as clear,
        SUM(CASE WHEN proses = 'No Going' THEN 1 ELSE 0 END) as no_going
      FROM tiket_shopee
    `);

    const [returTiktokStats] = await db.query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN proses = 'Banding' THEN 1 ELSE 0 END) as banding,
        SUM(CASE WHEN proses = 'Selesai' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN proses = 'Tidak Banding' THEN 1 ELSE 0 END) as tidak_banding
      FROM retur_tiktok
      WHERE 1=1 ${dateWhere}
    `, dateParams);

    const [returShopeeStats] = await db.query(`
      SELECT COUNT(*) as total,
        SUM(CASE WHEN proses = 'Banding' THEN 1 ELSE 0 END) as banding,
        SUM(CASE WHEN proses = 'Selesai' THEN 1 ELSE 0 END) as selesai,
        SUM(CASE WHEN proses = 'Tidak Banding' THEN 1 ELSE 0 END) as tidak_banding
      FROM retur_shopee
      WHERE 1=1 ${dateWhere}
    `, dateParams);

    // Retur time-series (for chart). Default: last 30 days if no date range is provided.
    const seriesWhere = (date_from && date_to)
      ? `WHERE DATE(created_at) BETWEEN ? AND ?`
      : `WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`;
    const seriesParams = (date_from && date_to) ? [date_from, date_to] : [];

    const [returTiktokSeries] = await db.query(`
      SELECT DATE(created_at) as d, COUNT(*) as total
      FROM retur_tiktok
      ${seriesWhere}
      GROUP BY d
      ORDER BY d
    `, seriesParams);

    const [returShopeeSeries] = await db.query(`
      SELECT DATE(created_at) as d, COUNT(*) as total
      FROM retur_shopee
      ${seriesWhere}
      GROUP BY d
      ORDER BY d
    `, seriesParams);

    const seriesMap = new Map();
    returTiktokSeries.forEach((r) => {
      const key = (r.d instanceof Date) ? r.d.toISOString().slice(0, 10) : String(r.d);
      seriesMap.set(key, { date: key, tiktok: Number(r.total) || 0, shopee: 0 });
    });
    returShopeeSeries.forEach((r) => {
      const key = (r.d instanceof Date) ? r.d.toISOString().slice(0, 10) : String(r.d);
      const prev = seriesMap.get(key) || { date: key, tiktok: 0, shopee: 0 };
      seriesMap.set(key, { ...prev, shopee: Number(r.total) || 0 });
    });
    const returSeries = Array.from(seriesMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // COD gagal aggregated by province/city (top 10) — always from COD tables only (no retur date filter).
    const invalidLoc = `('-', 'Indonesia', 'INDONESIA', 'indonesia')`;

    const [codByProvince] = await db.query(`
      SELECT label, SUM(total) as total
      FROM (
        SELECT COALESCE(NULLIF(TRIM(province), ''), '-') as label, COUNT(*) as total
        FROM cod_gagal_tiktok
        WHERE province IS NOT NULL
          AND TRIM(province) <> ''
          AND TRIM(province) NOT IN ${invalidLoc}
        GROUP BY label
        UNION ALL
        SELECT COALESCE(NULLIF(TRIM(provinsi), ''), '-') as label, COUNT(*) as total
        FROM cod_gagal_shopee_algoo
        WHERE provinsi IS NOT NULL
          AND TRIM(provinsi) <> ''
          AND TRIM(provinsi) NOT IN ${invalidLoc}
        GROUP BY label
        UNION ALL
        SELECT COALESCE(NULLIF(TRIM(provinsi), ''), '-') as label, COUNT(*) as total
        FROM cod_gagal_shopee_mami_kasir
        WHERE provinsi IS NOT NULL
          AND TRIM(provinsi) <> ''
          AND TRIM(provinsi) NOT IN ${invalidLoc}
        GROUP BY label
        UNION ALL
        SELECT COALESCE(NULLIF(TRIM(provinsi), ''), '-') as label, COUNT(*) as total
        FROM cod_gagal_tiktok_mami_kasir
        WHERE provinsi IS NOT NULL
          AND TRIM(provinsi) <> ''
          AND TRIM(provinsi) NOT IN ${invalidLoc}
        GROUP BY label
      ) x
      GROUP BY label
      ORDER BY total DESC
      LIMIT 10
    `);

    const [codByCity] = await db.query(`
      SELECT label, SUM(total) as total
      FROM (
        SELECT COALESCE(NULLIF(TRIM(regency_and_city), ''), '-') as label, COUNT(*) as total
        FROM cod_gagal_tiktok
        WHERE regency_and_city IS NOT NULL
          AND TRIM(regency_and_city) <> ''
          AND TRIM(regency_and_city) NOT IN ${invalidLoc}
        GROUP BY label
        UNION ALL
        SELECT COALESCE(NULLIF(TRIM(kota_kabupaten), ''), '-') as label, COUNT(*) as total
        FROM cod_gagal_shopee_algoo
        WHERE kota_kabupaten IS NOT NULL
          AND TRIM(kota_kabupaten) <> ''
          AND TRIM(kota_kabupaten) NOT IN ${invalidLoc}
        GROUP BY label
        UNION ALL
        SELECT COALESCE(NULLIF(TRIM(kota_kabupaten), ''), '-') as label, COUNT(*) as total
        FROM cod_gagal_shopee_mami_kasir
        WHERE kota_kabupaten IS NOT NULL
          AND TRIM(kota_kabupaten) <> ''
          AND TRIM(kota_kabupaten) NOT IN ${invalidLoc}
        GROUP BY label
        UNION ALL
        SELECT COALESCE(NULLIF(TRIM(kota_kabupaten), ''), '-') as label, COUNT(*) as total
        FROM cod_gagal_tiktok_mami_kasir
        WHERE kota_kabupaten IS NOT NULL
          AND TRIM(kota_kabupaten) <> ''
          AND TRIM(kota_kabupaten) NOT IN ${invalidLoc}
        GROUP BY label
      ) x
      GROUP BY label
      ORDER BY total DESC
      LIMIT 10
    `);

    // Monthly trend for rusak
    const [monthlyRusak] = await db.query(`
      SELECT DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as total
      FROM rusak
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month
    `);

    // Sales Support stats
    const [salesSupportStats] = await db.query(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) as done_count,
        SUM(CASE WHEN status = 'No Respond' THEN 1 ELSE 0 END) as no_respond,
        SUM(CASE WHEN status = 'Retur' THEN 1 ELSE 0 END) as retur
      FROM sales_support
    `).catch(() => [[ { total: 0, done_count: 0, no_respond: 0, retur: 0 } ]]);

    const [salesSupportMonthly] = await db.query(`
      SELECT DATE_FORMAT(tanggal, '%Y-%m') as month, COUNT(*) as total
      FROM sales_support
      WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY month ORDER BY month
    `).catch(() => [[]]);

    res.json({
      success: true,
      data: {
        rusak: rusakStats[0],
        blp: blpStats[0],
        pergantian: pergantianStats[0],
        cancel: cancelStats[0],
        tiket_tiktok: tiketTiktokStats[0],
        tiket_shopee: tiketShopeeStats[0],
        retur_tiktok: returTiktokStats[0],
        retur_shopee: returShopeeStats[0],
        retur_series: returSeries,
        cod_gagal: {
          by_province: codByProvince,
          by_city: codByCity,
        },
        monthly_rusak: monthlyRusak,
        sales_support: salesSupportStats[0],
        sales_support_monthly: salesSupportMonthly
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const { module } = req.params;
    const { start_date, end_date } = req.query;

    let data = [];
    let sheetName = module;

    const dateFilter = start_date && end_date
      ? ` AND DATE(created_at) BETWEEN '${start_date}' AND '${end_date}'`
      : '';

    switch (module) {
      case 'rusak':
        [data] = await db.query(`SELECT * FROM rusak WHERE 1=1 ${dateFilter} ORDER BY created_at DESC`);
        break;
      case 'dari-customer':
        [data] = await db.query(`SELECT * FROM dari_customer WHERE 1=1 ${dateFilter} ORDER BY created_at DESC`);
        break;
      case 'blp':
        [data] = await db.query(`SELECT * FROM blp WHERE 1=1 ${dateFilter} ORDER BY created_at DESC`);
        break;
      case 'pergantian':
        [data] = await db.query(`SELECT * FROM pergantian_barang WHERE 1=1 ${dateFilter} ORDER BY created_at DESC`);
        break;
      case 'cancel':
        [data] = await db.query(`SELECT * FROM orderan_cancel WHERE 1=1 ${dateFilter} ORDER BY created_at DESC`);
        break;
      case 'tiket-tiktok':
        [data] = await db.query(`SELECT * FROM tiket_tiktok WHERE 1=1 ${dateFilter} ORDER BY created_at DESC`);
        break;
      case 'tiket-shopee':
        [data] = await db.query(`SELECT * FROM tiket_shopee WHERE 1=1 ${dateFilter} ORDER BY created_at DESC`);
        break;
      case 'retur-tiktok':
        [data] = await db.query(`SELECT * FROM retur_tiktok WHERE 1=1 ${dateFilter} ORDER BY created_at DESC`);
        break;
      case 'retur-shopee':
        [data] = await db.query(`SELECT * FROM retur_shopee WHERE 1=1 ${dateFilter} ORDER BY created_at DESC`);
        break;
      case 'sales-support':
        [data] = await db.query(`SELECT * FROM sales_support WHERE 1=1 ${dateFilter} ORDER BY created_at DESC`);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid module' });
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="${module}_${Date.now()}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (error) {
    console.error('Export Excel error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const { module } = req.params;
    const { start_date, end_date } = req.query;

    let data = [];
    let columns = [];
    let title = module;

    const dateFilter = start_date && end_date
      ? ` AND DATE(created_at) BETWEEN '${start_date}' AND '${end_date}'`
      : '';

    switch (module) {
      case 'rusak':
        title = 'Service Retur';
        columns = ['tgl_masuk','no_pesanan','tipe','nomor_seri','kelengkapan','status'];
        [data] = await db.query(`SELECT tgl_masuk, no_pesanan, tipe, nomor_seri, kelengkapan, status FROM rusak WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT 200`);
        break;
      case 'dari-customer':
        title = 'Service Reguler';
        columns = ['tgl_masuk','nama_customer','tipe','nomor_seri','kelengkapan','status'];
        [data] = await db.query(`SELECT tgl_masuk, nama_customer, tipe, nomor_seri, kelengkapan, status FROM dari_customer WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT 200`);
        break;
      case 'pergantian':
        title = 'Pergantian Barang';
        columns = ['tgl','marketplace','no_order','nama_barang_awal','nama_barang_diganti','qty'];
        [data] = await db.query(`SELECT tgl, marketplace, no_order, nama_barang_awal, nama_barang_diganti, qty FROM pergantian_barang WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT 200`);
        break;
      case 'cancel':
        title = 'Orderan Cancel';
        columns = ['tgl','marketplace','no_order','produk','qty','keterangan'];
        [data] = await db.query(`SELECT tgl, marketplace, no_order, produk, qty, keterangan FROM orderan_cancel WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT 200`);
        break;
      case 'tiket-tiktok':
        title = 'Tiket TikTok';
        columns = ['no_tiket','no_order','kendala','proses','gudang'];
        [data] = await db.query(`SELECT no_tiket, no_order, kendala, proses, gudang FROM tiket_tiktok WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT 200`);
        break;
      case 'tiket-shopee':
        title = 'Tiket Shopee';
        columns = ['no_tiket','no_order','kendala','proses','gudang'];
        [data] = await db.query(`SELECT no_tiket, no_order, kendala, proses, gudang FROM tiket_shopee WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT 200`);
        break;
      case 'retur-tiktok':
        title = 'Retur TikTok';
        columns = ['tgl_order','nama_akun','no_order','produk','proses','gudang'];
        [data] = await db.query(`SELECT tgl_order, nama_akun, no_order, produk, proses, gudang FROM retur_tiktok WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT 200`);
        break;
      case 'retur-shopee':
        title = 'Retur Shopee';
        columns = ['tgl_order','nama_akun','no_order','produk','proses','gudang'];
        [data] = await db.query(`SELECT tgl_order, nama_akun, no_order, produk, proses, gudang FROM retur_shopee WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT 200`);
        break;
      case 'sales-support':
        title = 'Sales Support';
        columns = ['tanggal','nomor_wa','marketplace','no_pesanan','produk','keluhan','masalah','metode_solusi','status'];
        [data] = await db.query(`SELECT tanggal, nomor_wa, marketplace, no_pesanan, produk, keluhan, masalah, metode_solusi, status FROM sales_support WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT 200`);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid module' });
    }

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Disposition', `attachment; filename="${module}_${Date.now()}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Header
    doc.fontSize(14).font('Helvetica-Bold')
      .text(`Algoods — Laporan ${title}`, { align: 'center' });
    doc.fontSize(9).font('Helvetica')
      .text(
        `Periode: ${start_date && end_date ? `${start_date} s/d ${end_date}` : 'Semua data'}   |   Dicetak: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}   |   Total: ${data.length} baris`,
        { align: 'center' }
      );
    doc.moveDown(0.8);

    if (data.length > 0) {
      const headers = columns.length ? columns : Object.keys(data[0]);
      const pageW = doc.page.width - 60;
      const colW = pageW / headers.length;
      const rowH = 18;
      const headerH = 22;

      const drawRow = (cols, y, isHeader) => {
        let x = 30;
        cols.forEach((cell, i) => {
          const text = String(cell ?? '');
          if (isHeader) {
            doc.rect(x, y, colW, headerH).fillAndStroke('#1e40af', '#1e40af');
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(7)
              .text(text.toUpperCase().replace(/_/g, ' '), x + 3, y + 6, { width: colW - 6, lineBreak: false });
          } else {
            doc.rect(x, y, colW, rowH).stroke('#e2e8f0');
            doc.fillColor('#1e293b').font('Helvetica').fontSize(7)
              .text(text, x + 3, y + 5, { width: colW - 6, lineBreak: false });
          }
          x += colW;
        });
      };

      let currentY = doc.y;

      // Header row
      drawRow(headers, currentY, true);
      currentY += headerH;

      // Data rows
      data.forEach((row, idx) => {
        if (currentY + rowH > doc.page.height - 40) {
          doc.addPage({ margin: 30, size: 'A4', layout: 'landscape' });
          currentY = 30;
          drawRow(headers, currentY, true);
          currentY += headerH;
        }
        // Alternating row background
        if (idx % 2 === 0) {
          doc.rect(30, currentY, pageW, rowH).fill('#f8fafc');
        }
        drawRow(headers.map(h => row[h]), currentY, false);
        currentY += rowH;
      });
    } else {
      doc.moveDown().fontSize(11).fillColor('#64748b')
        .text('Tidak ada data untuk periode yang dipilih.', { align: 'center' });
    }

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Preview Data untuk Laporan ──────────────────────────────────────────────
exports.getReportPreview = async (req, res) => {
  try {
    const { module } = req.params;
    const { start_date, end_date, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const dateFilter = start_date && end_date
      ? ` AND DATE(created_at) BETWEEN '${start_date}' AND '${end_date}'`
      : '';

    let data = [];
    let total = 0;
    let stats = {};

    switch (module) {
      case 'rusak':
        [data] = await db.query(`SELECT * FROM rusak WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
        [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM rusak WHERE 1=1 ${dateFilter}`);
        [[stats]] = await db.query(`
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Proses Servis' THEN 1 ELSE 0 END) as proses_servis,
            SUM(CASE WHEN status = 'Gudang Rusak' THEN 1 ELSE 0 END) as gudang_rusak,
            SUM(CASE WHEN status = 'Kembali ke Stok/Customer' THEN 1 ELSE 0 END) as kembali
          FROM rusak WHERE 1=1 ${dateFilter}
        `);
        break;

      case 'dari-customer':
        [data] = await db.query(`SELECT * FROM dari_customer WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
        [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM dari_customer WHERE 1=1 ${dateFilter}`);
        [[stats]] = await db.query(`
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Proses Servis' THEN 1 ELSE 0 END) as proses_servis,
            SUM(CASE WHEN status = 'Gudang Rusak' THEN 1 ELSE 0 END) as gudang_rusak,
            SUM(CASE WHEN status = 'Kembali ke Stok/Customer' THEN 1 ELSE 0 END) as kembali
          FROM dari_customer WHERE 1=1 ${dateFilter}
        `);
        break;

      case 'pergantian':
        [data] = await db.query(`SELECT * FROM pergantian_barang WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
        [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM pergantian_barang WHERE 1=1 ${dateFilter}`);
        stats = { total };
        break;

      case 'cancel':
        [data] = await db.query(`SELECT * FROM orderan_cancel WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
        [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM orderan_cancel WHERE 1=1 ${dateFilter}`);
        stats = { total };
        break;

      case 'tiket-tiktok':
        [data] = await db.query(`SELECT * FROM tiket_tiktok WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
        [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM tiket_tiktok WHERE 1=1 ${dateFilter}`);
        [[stats]] = await db.query(`
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN proses = 'Clear' THEN 1 ELSE 0 END) as clear,
            SUM(CASE WHEN proses = 'No Going' THEN 1 ELSE 0 END) as no_going
          FROM tiket_tiktok WHERE 1=1 ${dateFilter}
        `);
        break;

      case 'tiket-shopee':
        [data] = await db.query(`SELECT * FROM tiket_shopee WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
        [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM tiket_shopee WHERE 1=1 ${dateFilter}`);
        [[stats]] = await db.query(`
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN proses = 'Clear' THEN 1 ELSE 0 END) as clear,
            SUM(CASE WHEN proses = 'No Going' THEN 1 ELSE 0 END) as no_going
          FROM tiket_shopee WHERE 1=1 ${dateFilter}
        `);
        break;

      case 'retur-tiktok':
        [data] = await db.query(`SELECT * FROM retur_tiktok WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
        [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM retur_tiktok WHERE 1=1 ${dateFilter}`);
        [[stats]] = await db.query(`
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN proses = 'Banding' THEN 1 ELSE 0 END) as banding,
            SUM(CASE WHEN proses = 'Selesai' THEN 1 ELSE 0 END) as selesai,
            SUM(CASE WHEN proses = 'Tidak Banding' THEN 1 ELSE 0 END) as tidak_banding
          FROM retur_tiktok WHERE 1=1 ${dateFilter}
        `);
        break;

      case 'retur-shopee':
        [data] = await db.query(`SELECT * FROM retur_shopee WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
        [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM retur_shopee WHERE 1=1 ${dateFilter}`);
        [[stats]] = await db.query(`
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN proses = 'Banding' THEN 1 ELSE 0 END) as banding,
            SUM(CASE WHEN proses = 'Selesai' THEN 1 ELSE 0 END) as selesai,
            SUM(CASE WHEN proses = 'Tidak Banding' THEN 1 ELSE 0 END) as tidak_banding
          FROM retur_shopee WHERE 1=1 ${dateFilter}
        `);
        break;

      case 'sales-support':
        [data] = await db.query(`SELECT * FROM sales_support WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
        [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM sales_support WHERE 1=1 ${dateFilter}`);
        [[stats]] = await db.query(`
          SELECT
            COUNT(*) as total,
            SUM(CASE WHEN status = 'Done' THEN 1 ELSE 0 END) as done_count,
            SUM(CASE WHEN status = 'No Respond' THEN 1 ELSE 0 END) as no_respond,
            SUM(CASE WHEN status = 'Retur' THEN 1 ELSE 0 END) as retur
          FROM sales_support WHERE 1=1 ${dateFilter}
        `);
        break;

      default:
        return res.status(400).json({ success: false, message: 'Invalid module' });
    }

    res.json({
      success: true,
      data,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Report preview error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
