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
        monthly_rusak: monthlyRusak
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
    const dateFilter = start_date && end_date
      ? ` AND DATE(created_at) BETWEEN '${start_date}' AND '${end_date}'`
      : '';

    switch (module) {
      case 'rusak':
        [data] = await db.query(`SELECT tgl_masuk, no_pesanan, marketplace, produk, status, hasil_akhir FROM rusak WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT 100`);
        break;
      case 'retur-tiktok':
        [data] = await db.query(`SELECT tgl_order, nama_akun, no_order, produk, proses, gudang FROM retur_tiktok WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT 100`);
        break;
      case 'retur-shopee':
        [data] = await db.query(`SELECT tgl_order, nama_akun, no_order, produk, proses, gudang FROM retur_shopee WHERE 1=1 ${dateFilter} ORDER BY created_at DESC LIMIT 100`);
        break;
      default:
        return res.status(400).json({ success: false, message: 'Invalid module' });
    }

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });

    res.setHeader('Content-Disposition', `attachment; filename="${module}_${Date.now()}.pdf"`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(16).font('Helvetica-Bold').text('Algoods - Laporan ' + module.toUpperCase(), { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).font('Helvetica').text(`Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`, { align: 'right' });
    doc.moveDown();

    if (data.length > 0) {
      const headers = Object.keys(data[0]);
      const colWidth = (doc.page.width - 60) / headers.length;

      // Header row
      doc.font('Helvetica-Bold').fontSize(8);
      let x = 30;
      headers.forEach(h => {
        doc.rect(x, doc.y, colWidth, 20).stroke();
        doc.text(h.toUpperCase(), x + 2, doc.y + 5, { width: colWidth - 4 });
        x += colWidth;
      });
      doc.moveDown(1.5);

      // Data rows
      doc.font('Helvetica').fontSize(7);
      data.forEach(row => {
        x = 30;
        const rowY = doc.y;
        headers.forEach(h => {
          doc.rect(x, rowY, colWidth, 18).stroke();
          doc.text(String(row[h] || ''), x + 2, rowY + 4, { width: colWidth - 4 });
          x += colWidth;
        });
        doc.moveDown(1.3);
      });
    } else {
      doc.text('Tidak ada data', { align: 'center' });
    }

    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
