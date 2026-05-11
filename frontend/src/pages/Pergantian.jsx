import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ExcelImport from '../components/ExcelImport';
import DateRangeFilter from '../components/DateRangeFilter';

const MARKETPLACE_OPTIONS = ['Shopee', 'TiktokShop', 'Tokopedia', 'Lazada', 'Lainnya'];
const EMPTY_FORM = { tgl: '', marketplace: '', no_order: '', nama_barang_awal: '', qty: 1, nama_barang_diganti: '', keterangan: '' };

const Pergantian = () => {
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
      const res = await api.get('/pergantian', { params: { page, limit: 10, search, date_from: dateFrom, date_to: dateTo } });
      if (res.data.success) { setData(res.data.data); setPagination(res.data.pagination); }
    } catch (err) { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  }, [search, dateFrom, dateTo]);

  useEffect(() => { const t = setTimeout(() => fetchData(1), 300); return () => clearTimeout(t); }, [search, dateFrom, dateTo]);

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (row) => { setForm({ ...row }); setModal({ open: true, mode: 'edit', data: row }); };

  const handleSave = async () => {
    if (!form.no_order || !form.nama_barang_awal) { toast.error('No Order dan Nama Barang Awal wajib diisi'); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') { await api.post('/pergantian', form); toast.success('Data berhasil ditambahkan'); }
      else { await api.put(`/pergantian/${modal.data.id}`, form); toast.success('Data berhasil diperbarui'); }
      setModal({ open: false, mode: 'add', data: null });
      fetchData(pagination.page);
    } catch (err) { toast.error('Gagal menyimpan data'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/pergantian/${id}`);
      toast.success('Data berhasil dihapus');
      setDeleteConfirm(null);
      fetchData(pagination.page);
    } catch (err) { toast.error('Gagal menghapus data'); }
  };

  const columns = [
    { header: 'No', render: (_, i) => (pagination.page - 1) * 10 + i + 1 },
    { header: 'Tanggal', render: (row) => row.tgl ? new Date(row.tgl).toLocaleDateString('id-ID') : '-' },
    { header: 'Marketplace', key: 'marketplace' },
    { header: 'No Order', key: 'no_order' },
    { header: 'Nama Barang Awal', key: 'nama_barang_awal' },
    { header: 'QTY', key: 'qty' },
    { header: 'Nama Barang Diganti', key: 'nama_barang_diganti' },
    { header: 'Keterangan', key: 'keterangan' },
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
      <PageHeader title="Pergantian Barang" subtitle="Manajemen data pergantian barang" icon="🔄"
        actions={<ExcelImport module="pergantian" onSuccess={() => fetchData(1)} />}
      />
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination}
        onPageChange={fetchData} onSearch={setSearch} searchValue={search}
        onAdd={openAdd} addLabel="+ Tambah Data"
        extraFilters={
          <DateRangeFilter
            dateFrom={dateFrom} dateTo={dateTo}
            onDateFromChange={setDateFrom} onDateToChange={setDateTo}
            onReset={() => { setDateFrom(''); setDateTo(''); }}
          />
        }
      />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'add', data: null })}
        title={modal.mode === 'add' ? '➕ Tambah Pergantian Barang' : '✏️ Edit Pergantian Barang'} size="md">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input type="date" className="form-control" value={form.tgl || ''} onChange={e => setForm({ ...form, tgl: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Marketplace</label>
            <select className="form-control" value={form.marketplace || ''} onChange={e => setForm({ ...form, marketplace: e.target.value })}>
              <option value="">Pilih Marketplace</option>
              {MARKETPLACE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">No Order *</label>
            <input type="text" className="form-control" value={form.no_order || ''} onChange={e => setForm({ ...form, no_order: e.target.value })} placeholder="Nomor order" />
          </div>
          <div className="form-group">
            <label className="form-label">Nama Barang Awal *</label>
            <input type="text" className="form-control" value={form.nama_barang_awal || ''} onChange={e => setForm({ ...form, nama_barang_awal: e.target.value })} placeholder="Nama barang awal" />
          </div>
          <div className="form-group">
            <label className="form-label">QTY</label>
            <input type="number" className="form-control" value={form.qty || 1} onChange={e => setForm({ ...form, qty: e.target.value })} min="1" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Nama Barang yang Diganti ke</label>
            <input type="text" className="form-control" value={form.nama_barang_diganti || ''} onChange={e => setForm({ ...form, nama_barang_diganti: e.target.value })} placeholder="Nama barang pengganti" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Keterangan</label>
            <textarea className="form-control" rows={3} value={form.keterangan || ''} onChange={e => setForm({ ...form, keterangan: e.target.value })} placeholder="Keterangan" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'add', data: null })}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : '💾 Simpan'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="🗑️ Konfirmasi Hapus" size="sm">
        <p style={{ color: '#64748b', marginBottom: '20px' }}>Hapus data order <strong>{deleteConfirm?.no_order}</strong>?</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>🗑️ Hapus</button>
        </div>
      </Modal>
    </div>
  );
};

export default Pergantian;
