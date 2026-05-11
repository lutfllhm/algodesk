import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ExcelImport from '../components/ExcelImport';
import DateRangeFilter from '../components/DateRangeFilter';

const PROSES_OPTIONS = [
  { value: 'No Going', label: 'On Goin' },
  { value: 'Clear', label: 'Clear' },
];
const GUDANG_OPTIONS = ['Surabaya', 'Jakarta'];
const EMPTY_FORM = { no_tiket: '', no_order: '', kendala: '', proses: 'No Going', gudang: 'Jakarta', keterangan: '' };

const ProsesBadge = ({ proses }) => {
  const map = { 'Clear': 'badge-clear', 'No Going': 'badge-no-going' };
  const label = proses === 'No Going' ? 'On Goin' : proses;
  return <span className={`badge ${map[proses] || ''}`}>{label}</span>;
};

const GudangBadge = ({ gudang }) => {
  const map = { 'Surabaya': 'badge-surabaya', 'Jakarta': 'badge-jakarta' };
  return <span className={`badge ${map[gudang] || ''}`}>{gudang}</span>;
};

const TiketShopee = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/tiket/shopee', { params: { page, limit: 10, search, date_from: dateFrom, date_to: dateTo } });
      if (res.data.success) { setData(res.data.data); setPagination(res.data.pagination); }
    } catch (err) { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  }, [search, dateFrom, dateTo]);

  useEffect(() => { const t = setTimeout(() => fetchData(1), 300); return () => clearTimeout(t); }, [search, dateFrom, dateTo]);

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (row) => { setForm({ ...row }); setModal({ open: true, mode: 'edit', data: row }); };

  const handleSave = async () => {
    if (!form.no_tiket || !form.no_order) { toast.error('No Tiket dan No Order wajib diisi'); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') { await api.post('/tiket/shopee', form); toast.success('Tiket Shopee berhasil ditambahkan'); }
      else { await api.put(`/tiket/shopee/${modal.data.id}`, form); toast.success('Tiket Shopee berhasil diperbarui'); }
      setModal({ open: false, mode: 'add', data: null });
      fetchData(pagination.page);
    } catch (err) { toast.error('Gagal menyimpan data'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/tiket/shopee/${id}`);
      toast.success('Data berhasil dihapus');
      setDeleteConfirm(null);
      fetchData(pagination.page);
    } catch (err) { toast.error('Gagal menghapus data'); }
  };

  const columns = [
    { header: 'No', render: (_, i) => (pagination.page - 1) * 10 + i + 1 },
    { header: 'No Tiket', key: 'no_tiket' },
    { header: 'No Order', key: 'no_order' },
    { header: 'Kendala', key: 'kendala', cellStyle: { maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' } },
    { header: 'Proses', render: (row) => <ProsesBadge proses={row.proses} /> },
    { header: 'Gudang', render: (row) => <GudangBadge gudang={row.gudang} /> },
    { header: 'Keterangan', key: 'keterangan', cellStyle: { maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis' } },
    {
      header: 'Aksi',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-sm btn-warning btn-icon" onClick={() => openEdit(row)}>✏️</button>
          <button className="btn btn-sm btn-danger btn-icon" onClick={() => setDeleteConfirm(row)}>🗑️</button>
        </div>
      )
    }
  ];

  return (
    <div className="fade-in">
      <PageHeader title="Tiket Shopee Algoo" subtitle="Manajemen tiket komplain Shopee" icon="🛍️"
        actions={<ExcelImport module="tiket-shopee" onSuccess={() => fetchData(1)} />}
      />
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination}
        onPageChange={fetchData} onSearch={setSearch} searchValue={search}
        onAdd={openAdd} addLabel="+ Tambah Tiket"
        extraFilters={
          <DateRangeFilter
            dateFrom={dateFrom} dateTo={dateTo}
            onDateFromChange={setDateFrom} onDateToChange={setDateTo}
            onReset={() => { setDateFrom(''); setDateTo(''); }}
          />
        }
      />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'add', data: null })}
        title={modal.mode === 'add' ? '➕ Tambah Tiket Shopee' : '✏️ Edit Tiket Shopee'} size="md">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">No Tiket *</label>
            <input type="text" className="form-control" value={form.no_tiket || ''} onChange={e => setForm({ ...form, no_tiket: e.target.value })} placeholder="Nomor tiket" />
          </div>
          <div className="form-group">
            <label className="form-label">No Order *</label>
            <input type="text" className="form-control" value={form.no_order || ''} onChange={e => setForm({ ...form, no_order: e.target.value })} placeholder="Nomor order" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Kendala</label>
            <textarea className="form-control" rows={3} value={form.kendala || ''} onChange={e => setForm({ ...form, kendala: e.target.value })} placeholder="Deskripsi kendala" />
          </div>
          <div className="form-group">
            <label className="form-label">Proses</label>
            <select className="form-control" value={form.proses || 'No Going'} onChange={e => setForm({ ...form, proses: e.target.value })}>
              {PROSES_OPTIONS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Gudang</label>
            <select className="form-control" value={form.gudang || 'Jakarta'} onChange={e => setForm({ ...form, gudang: e.target.value })}>
              {GUDANG_OPTIONS.map(g => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Keterangan</label>
            <textarea className="form-control" rows={2} value={form.keterangan || ''} onChange={e => setForm({ ...form, keterangan: e.target.value })} placeholder="Keterangan tambahan" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'add', data: null })}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : '💾 Simpan'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="🗑️ Konfirmasi Hapus" size="sm">
        <p style={{ color: '#64748b', marginBottom: '20px' }}>Hapus tiket <strong>{deleteConfirm?.no_tiket}</strong>?</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>🗑️ Hapus</button>
        </div>
      </Modal>
    </div>
  );
};

export default TiketShopee;
