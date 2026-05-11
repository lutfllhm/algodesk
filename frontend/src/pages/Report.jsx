import React, { useState, useCallback, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';

// ─── Module config ────────────────────────────────────────────────────────────
const MODULES = [
  {
    value: 'rusak', label: 'Service Retur', icon: '🔧', color: '#6366f1',
    columns: [
      { key: 'tgl_masuk', label: 'Tgl Masuk', type: 'date' },
      { key: 'no_pesanan', label: 'No Pesanan' },
      { key: 'tipe', label: 'Tipe' },
      { key: 'nomor_seri', label: 'No Seri' },
      { key: 'kelengkapan', label: 'Kelengkapan' },
      { key: 'validasi', label: 'Validasi' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    statKeys: [
      { key: 'total', label: 'Total', color: '#6366f1' },
      { key: 'proses_servis', label: 'Proses Servis', color: '#f59e0b' },
      { key: 'gudang_rusak', label: 'Gudang Rusak', color: '#ef4444' },
      { key: 'kembali', label: 'Kembali', color: '#22c55e' },
    ]
  },
  {
    value: 'dari-customer', label: 'Service Reguler', icon: '👤', color: '#0891b2',
    columns: [
      { key: 'tgl_masuk', label: 'Tgl Masuk', type: 'date' },
      { key: 'nama_customer', label: 'Nama Customer' },
      { key: 'tipe', label: 'Tipe' },
      { key: 'nomor_seri', label: 'No Seri' },
      { key: 'kelengkapan', label: 'Kelengkapan' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    statKeys: [
      { key: 'total', label: 'Total', color: '#0891b2' },
      { key: 'proses_servis', label: 'Proses Servis', color: '#f59e0b' },
      { key: 'gudang_rusak', label: 'Gudang Rusak', color: '#ef4444' },
      { key: 'kembali', label: 'Kembali', color: '#22c55e' },
    ]
  },
  {
    value: 'pergantian', label: 'Pergantian Barang', icon: '🔄', color: '#0284c7',
    columns: [
      { key: 'tgl', label: 'Tanggal', type: 'date' },
      { key: 'marketplace', label: 'Marketplace' },
      { key: 'no_order', label: 'No Order' },
      { key: 'nama_barang_awal', label: 'Barang Awal' },
      { key: 'nama_barang_diganti', label: 'Barang Diganti' },
      { key: 'qty', label: 'QTY' },
      { key: 'keterangan', label: 'Keterangan' },
    ],
    statKeys: [{ key: 'total', label: 'Total', color: '#0284c7' }]
  },
  {
    value: 'cancel', label: 'Orderan Cancel', icon: '❌', color: '#dc2626',
    columns: [
      { key: 'tgl', label: 'Tanggal', type: 'date' },
      { key: 'marketplace', label: 'Marketplace' },
      { key: 'no_order', label: 'No Order' },
      { key: 'produk', label: 'Produk' },
      { key: 'qty', label: 'QTY' },
      { key: 'keterangan', label: 'Keterangan' },
    ],
    statKeys: [{ key: 'total', label: 'Total', color: '#dc2626' }]
  },
  {
    value: 'tiket-tiktok', label: 'Tiket TikTok', icon: '🎵', color: '#374151',
    columns: [
      { key: 'no_tiket', label: 'No Tiket' },
      { key: 'no_order', label: 'No Order' },
      { key: 'kendala', label: 'Kendala' },
      { key: 'proses', label: 'Status', type: 'badge' },
      { key: 'gudang', label: 'Gudang' },
      { key: 'keterangan', label: 'Keterangan' },
    ],
    statKeys: [
      { key: 'total', label: 'Total', color: '#374151' },
      { key: 'clear', label: 'Clear', color: '#22c55e' },
      { key: 'no_going', label: 'No Going', color: '#f59e0b' },
    ]
  },
  {
    value: 'tiket-shopee', label: 'Tiket Shopee', icon: '🛍️', color: '#ea580c',
    columns: [
      { key: 'no_tiket', label: 'No Tiket' },
      { key: 'no_order', label: 'No Order' },
      { key: 'kendala', label: 'Kendala' },
      { key: 'proses', label: 'Status', type: 'badge' },
      { key: 'gudang', label: 'Gudang' },
      { key: 'keterangan', label: 'Keterangan' },
    ],
    statKeys: [
      { key: 'total', label: 'Total', color: '#ea580c' },
      { key: 'clear', label: 'Clear', color: '#22c55e' },
      { key: 'no_going', label: 'No Going', color: '#f59e0b' },
    ]
  },
  {
    value: 'retur-tiktok', label: 'Retur TikTok', icon: '↩️', color: '#8b5cf6',
    columns: [
      { key: 'tgl_order', label: 'Tgl Order', type: 'date' },
      { key: 'nama_akun', label: 'Nama Akun' },
      { key: 'no_order', label: 'No Order' },
      { key: 'no_retur', label: 'No Retur' },
      { key: 'produk', label: 'Produk' },
      { key: 'proses', label: 'Status', type: 'badge' },
      { key: 'gudang', label: 'Gudang' },
    ],
    statKeys: [
      { key: 'total', label: 'Total', color: '#8b5cf6' },
      { key: 'banding', label: 'Banding', color: '#f59e0b' },
      { key: 'selesai', label: 'Selesai', color: '#22c55e' },
      { key: 'tidak_banding', label: 'Tdk Banding', color: '#ef4444' },
    ]
  },
  {
    value: 'retur-shopee', label: 'Retur Shopee', icon: '↩️', color: '#ec4899',
    columns: [
      { key: 'tgl_order', label: 'Tgl Order', type: 'date' },
      { key: 'nama_akun', label: 'Nama Akun' },
      { key: 'no_order', label: 'No Order' },
      { key: 'no_retur', label: 'No Retur' },
      { key: 'produk', label: 'Produk' },
      { key: 'proses', label: 'Status', type: 'badge' },
      { key: 'gudang', label: 'Gudang' },
    ],
    statKeys: [
      { key: 'total', label: 'Total', color: '#ec4899' },
      { key: 'banding', label: 'Banding', color: '#f59e0b' },
      { key: 'selesai', label: 'Selesai', color: '#22c55e' },
      { key: 'tidak_banding', label: 'Tdk Banding', color: '#ef4444' },
    ]
  },
  {
    value: 'sales-support', label: 'Sales Support', icon: '🎧', color: '#0ea5e9',
    columns: [
      { key: 'tanggal', label: 'Tanggal', type: 'date' },
      { key: 'nomor_wa', label: 'Nomor WA' },
      { key: 'marketplace', label: 'Marketplace' },
      { key: 'no_pesanan', label: 'No Pesanan' },
      { key: 'produk', label: 'Produk' },
      { key: 'keluhan', label: 'Keluhan' },
      { key: 'masalah', label: 'Masalah' },
      { key: 'metode_solusi', label: 'Metode/Solusi' },
      { key: 'status', label: 'Status', type: 'badge' },
    ],
    statKeys: [
      { key: 'total', label: 'Total', color: '#0ea5e9' },
      { key: 'done_count', label: 'Done', color: '#22c55e' },
      { key: 'no_respond', label: 'No Respond', color: '#f59e0b' },
      { key: 'retur', label: 'Retur', color: '#ef4444' },
    ]
  },
];

// ─── Badge colors ─────────────────────────────────────────────────────────────
const BADGE_COLORS = {
  'Clear': { bg: '#dcfce7', color: '#166534' },
  'No Going': { bg: '#fef3c7', color: '#92400e' },
  'Banding': { bg: '#fef3c7', color: '#92400e' },
  'Selesai': { bg: '#dcfce7', color: '#166534' },
  'Tidak Banding': { bg: '#fee2e2', color: '#991b1b' },
  'Proses Servis': { bg: '#dbeafe', color: '#1e40af' },
  'Gudang Rusak': { bg: '#fee2e2', color: '#991b1b' },
  'Kembali ke Stok/Customer': { bg: '#dcfce7', color: '#166534' },
  'Done': { bg: '#dcfce7', color: '#166534' },
  'No Respond': { bg: '#fef3c7', color: '#92400e' },
  'Retur': { bg: '#fee2e2', color: '#991b1b' },
};

const Badge = ({ value }) => {
  const style = BADGE_COLORS[value] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span style={{
      background: style.bg, color: style.color,
      padding: '2px 8px', borderRadius: '999px',
      fontSize: '11px', fontWeight: 600, whiteSpace: 'nowrap'
    }}>
      {value || '-'}
    </span>
  );
};

const fmtDate = (v) => {
  if (!v) return '-';
  const d = new Date(v);
  if (isNaN(d)) return v;
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// ─── Report Page ──────────────────────────────────────────────────────────────
const Report = () => {
  const [activeModule, setActiveModule] = useState('rusak');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [previewData, setPreviewData] = useState([]);
  const [previewStats, setPreviewStats] = useState({});
  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 });
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingExport, setLoadingExport] = useState('');
  const [searched, setSearched] = useState(false);

  const moduleCfg = MODULES.find(m => m.value === activeModule) || MODULES[0];

  const fetchPreview = useCallback(async (page = 1) => {
    setLoadingPreview(true);
    setSearched(true);
    try {
      const params = { page, limit: 50 };
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await api.get(`/report/preview/${activeModule}`, { params });
      if (res.data.success) {
        setPreviewData(res.data.data);
        setPreviewStats(res.data.stats || {});
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Gagal memuat preview data');
    } finally {
      setLoadingPreview(false);
    }
  }, [activeModule, startDate, endDate]);

  // Auto-load when module changes (if already searched)
  useEffect(() => {
    if (searched) fetchPreview(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeModule]);

  const handleExport = async (format) => {
    setLoadingExport(format);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      const res = await api.get(`/report/export/${format}/${activeModule}`, {
        params, responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeModule}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Export ${format.toUpperCase()} berhasil`);
    } catch {
      toast.error('Gagal export data');
    } finally {
      setLoadingExport('');
    }
  };

  const handleReset = () => {
    setStartDate('');
    setEndDate('');
    setPreviewData([]);
    setPreviewStats({});
    setSearched(false);
    setPagination({ page: 1, limit: 50, total: 0, totalPages: 0 });
  };

  return (
    <div className="fade-in">
      <PageHeader
        title="Laporan & Export"
        subtitle="Preview, filter, dan export data ke Excel atau PDF"
        icon="📈"
      />

      {/* ── Module selector ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px', marginBottom: '20px' }}>
        {MODULES.map(m => (
          <button
            key={m.value}
            onClick={() => setActiveModule(m.value)}
            style={{
              padding: '12px 10px',
              borderRadius: '12px',
              border: activeModule === m.value ? `2px solid ${m.color}` : '1.5px solid var(--border)',
              background: activeModule === m.value ? `${m.color}10` : 'var(--bg-elevated)',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.15s',
              fontFamily: 'inherit',
              boxShadow: activeModule === m.value ? `0 0 0 3px ${m.color}20` : 'none',
            }}
          >
            <span style={{ fontSize: '22px' }}>{m.icon}</span>
            <span style={{
              fontSize: '11.5px', fontWeight: 600, textAlign: 'center', lineHeight: 1.3,
              color: activeModule === m.value ? m.color : 'var(--text-secondary)'
            }}>
              {m.label}
            </span>
          </button>
        ))}
      </div>

      {/* ── Filter & Actions ── */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-body">
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ margin: 0, flex: '1 1 160px' }}>
              <label className="form-label">Tanggal Mulai</label>
              <input type="date" className="form-control"
                value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group" style={{ margin: 0, flex: '1 1 160px' }}>
              <label className="form-label">Tanggal Akhir</label>
              <input type="date" className="form-control"
                value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingBottom: '1px' }}>
              <button className="btn btn-primary" onClick={() => fetchPreview(1)} disabled={loadingPreview}
                style={{ minWidth: '120px' }}>
                {loadingPreview ? '⏳ Memuat...' : '🔍 Tampilkan'}
              </button>
              <button className="btn btn-secondary" onClick={handleReset}>
                ↺ Reset
              </button>
              <button className="btn btn-success" onClick={() => handleExport('excel')}
                disabled={!!loadingExport} style={{ minWidth: '140px' }}>
                {loadingExport === 'excel' ? '⏳...' : '📊 Export Excel'}
              </button>
              <button className="btn btn-danger" onClick={() => handleExport('pdf')}
                disabled={!!loadingExport} style={{ minWidth: '130px' }}>
                {loadingExport === 'pdf' ? '⏳...' : '📄 Export PDF'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stats summary ── */}
      {searched && Object.keys(previewStats).length > 0 && (
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          {moduleCfg.statKeys.map(sk => (
            <div key={sk.key} style={{
              background: 'var(--bg-elevated)',
              border: `1.5px solid ${sk.color}30`,
              borderRadius: '12px',
              padding: '12px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              minWidth: '100px',
              boxShadow: `0 2px 8px ${sk.color}10`,
            }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: sk.color, lineHeight: 1 }}>
                {previewStats[sk.key] ?? 0}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {sk.label}
              </span>
            </div>
          ))}
          <div style={{
            background: 'var(--bg-elevated)',
            border: '1.5px solid var(--border)',
            borderRadius: '12px',
            padding: '12px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            minWidth: '100px',
          }}>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }}>
              {pagination.total}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ditampilkan
            </span>
          </div>
        </div>
      )}

      {/* ── Preview Table ── */}
      {searched && (
        <div className="card">
          <div className="card-header" style={{ alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px' }}>{moduleCfg.icon}</span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {moduleCfg.label}
              </span>
              {!loadingPreview && (
                <span style={{
                  background: `${moduleCfg.color}15`, color: moduleCfg.color,
                  padding: '2px 10px', borderRadius: '999px', fontSize: '11.5px', fontWeight: 600
                }}>
                  {pagination.total} data
                </span>
              )}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {startDate && endDate ? `${fmtDate(startDate)} — ${fmtDate(endDate)}` : 'Semua periode'}
            </span>
          </div>

          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            {loadingPreview ? (
              <div style={{ padding: '48px', textAlign: 'center' }}>
                <div className="spinner" style={{ width: 24, height: 24, margin: '0 auto 12px' }} />
                <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Memuat data...</p>
              </div>
            ) : previewData.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                Tidak ada data untuk filter yang dipilih.
              </div>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-subtle, #f8fafc)' }}>
                      <th style={thStyle}>#</th>
                      {moduleCfg.columns.map(col => (
                        <th key={col.key} style={thStyle}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((row, i) => (
                      <tr key={row.id || i}
                        style={{ borderBottom: '1px solid var(--border-light, #f1f5f9)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-subtle, #fafafa)' }}>
                        <td style={tdStyle}>{(pagination.page - 1) * pagination.limit + i + 1}</td>
                        {moduleCfg.columns.map(col => (
                          <td key={col.key} style={{ ...tdStyle, maxWidth: col.type === 'badge' ? undefined : '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: col.type === 'badge' ? 'nowrap' : 'normal' }}>
                            {col.type === 'badge'
                              ? <Badge value={row[col.key]} />
                              : col.type === 'date'
                                ? fmtDate(row[col.key])
                                : (row[col.key] ?? '-')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} total)
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-secondary"
                        disabled={pagination.page <= 1}
                        onClick={() => fetchPreview(pagination.page - 1)}>
                        ‹ Prev
                      </button>
                      {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                        const p = pagination.totalPages <= 7 ? i + 1
                          : pagination.page <= 4 ? i + 1
                          : pagination.page >= pagination.totalPages - 3 ? pagination.totalPages - 6 + i
                          : pagination.page - 3 + i;
                        return (
                          <button key={p}
                            className={`btn btn-sm ${p === pagination.page ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => fetchPreview(p)}>
                            {p}
                          </button>
                        );
                      })}
                      <button className="btn btn-sm btn-secondary"
                        disabled={pagination.page >= pagination.totalPages}
                        onClick={() => fetchPreview(pagination.page + 1)}>
                        Next ›
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Empty state ── */}
      {!searched && (
        <div className="card">
          <div className="card-body" style={{ textAlign: 'center', padding: '56px 24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
            <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '6px' }}>
              Pilih modul dan klik Tampilkan
            </p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Atur filter tanggal (opsional) lalu klik <strong>Tampilkan</strong> untuk preview data,
              atau langsung klik <strong>Export Excel / PDF</strong> untuk mengunduh.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const thStyle = {
  padding: '10px 12px',
  textAlign: 'left',
  fontSize: '11px',
  fontWeight: 700,
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  borderBottom: '1.5px solid var(--border)',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '9px 12px',
  color: 'var(--text-primary)',
  fontSize: '12.5px',
  verticalAlign: 'middle',
};

export default Report;
