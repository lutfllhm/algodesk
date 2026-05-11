import React, { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';

const Report = () => {
  const [module, setModule] = useState('rusak');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);

  const modules = [
    { value: 'rusak', label: 'Rusak / Retur', icon: '🔧' },
    { value: 'blp', label: 'BLP', icon: '📦' },
    { value: 'pergantian', label: 'Pergantian Barang', icon: '🔄' },
    { value: 'cancel', label: 'Orderan Cancel', icon: '❌' },
    { value: 'tiket-tiktok', label: 'Tiket TikTok', icon: '🎵' },
    { value: 'tiket-shopee', label: 'Tiket Shopee', icon: '🛍️' },
    { value: 'retur-tiktok', label: 'Retur TikTok', icon: '↩️' },
    { value: 'retur-shopee', label: 'Retur Shopee', icon: '↩️' },
  ];

  const handleExport = async (format) => {
    if (!module) { toast.error('Pilih modul terlebih dahulu'); return; }
    setLoading(true);
    try {
      const params = {};
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;

      const res = await api.get(`/report/export/${format}/${module}`, {
        params,
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${module}_${Date.now()}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Export ${format.toUpperCase()} berhasil`);
    } catch (err) {
      toast.error('Gagal export data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Laporan & Export" subtitle="Export data ke Excel atau PDF" icon="📈" />

      <div className="card">
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
            <div className="form-group">
              <label className="form-label">Pilih Modul</label>
              <select className="form-control" value={module} onChange={e => setModule(e.target.value)}>
                {modules.map(m => (
                  <option key={m.value} value={m.value}>{m.icon} {m.label}</option>
                ))}
              </select>
            </div>
            <div />
            <div className="form-group">
              <label className="form-label">Tanggal Mulai (Opsional)</label>
              <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Tanggal Akhir (Opsional)</label>
              <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', paddingTop: '20px', borderTop: '1px solid #f1f5f9' }}>
            <button
              className="btn btn-success"
              onClick={() => handleExport('excel')}
              disabled={loading}
              style={{ minWidth: '180px' }}
            >
              📊 Export ke Excel
            </button>
            <button
              className="btn btn-danger"
              onClick={() => handleExport('pdf')}
              disabled={loading}
              style={{ minWidth: '180px' }}
            >
              📄 Export ke PDF
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {modules.map(m => (
          <div
            key={m.value}
            className="card"
            style={{
              cursor: 'pointer',
              border: module === m.value ? '2px solid #6366f1' : '1px solid #e2e8f0',
              transition: 'all 0.2s'
            }}
            onClick={() => setModule(m.value)}
          >
            <div className="card-body" style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>{m.icon}</div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{m.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Report;
