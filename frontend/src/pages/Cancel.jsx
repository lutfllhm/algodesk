import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getRecordId } from '../utils/recordId';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ExcelImport from '../components/ExcelImport';
import DateRangeFilter from '../components/DateRangeFilter';

const MARKETPLACE_OPTIONS = ['Shopee', 'TiktokShop', 'Tokopedia', 'Lazada', 'Lainnya'];
const EMPTY_FORM = { no: '', tgl: '', dpk: '', marketplace: '', no_order: '', produk: '', qty: 1, keterangan: '' };

const Cancel = () => {
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
      const res = await api.get('/cancel', { params: { page, limit: 10, search, date_from: dateFrom, date_to: dateTo } });
      if (res.data.success) { setData(res.data.data); setPagination(res.data.pagination); }
    } catch (err) { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  }, [search, dateFrom, dateTo]);

  useEffect(() => { const t = setTimeout(() => fetchData(1), 300); return () => clearTimeout(t); }, [search, dateFrom, dateTo]);

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (row) => { setForm({ ...row }); setModal({ open: true, mode: 'edit', data: row }); };

  const handleSave = async () => {
    if (!form.no_order) { toast.error('No Order wajib diisi'); return; }
    const editId = modal.mode === 'edit' ? getRecordId(modal, form) : null;
    if (modal.mode === 'edit' && editId == null) {
      toast.error('ID data tidak ditemukan. Muat ulang halaman lalu coba edit lagi.');
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === 'add') { await api.post('/cancel', form); toast.success('Data berhasil ditambahkan'); }
      else { await api.put(`/cancel/${editId}`, form); toast.success('Data berhasil diperbarui'); }
      setModal({ open: false, mode: 'add', data: null });
      fetchData(pagination.page);
    } catch (err) { toast.error('Gagal menyimpan data'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/cancel/${id}`);
      toast.success('Data berhasil dihapus');
      setDeleteConfirm(null);
      fetchData(pagination.page);
    } catch (err) { toast.error('Gagal menghapus data'); }
  };

  const columns = [
    { header: 'No', render: (_, i) => (pagination.page - 1) * 10 + i + 1 },
    { header: 'Tanggal', render: (row) => row.tgl ? new Date(row.tgl).toLocaleDateString('id-ID') : '-' },
    { header: 'DPK', key: 'dpk' },
    { header: 'Marketplace', key: 'marketplace' },
    { header: 'No Order', key: 'no_order' },
    { header: 'Produk', key: 'produk' },
    { header: 'QTY', key: 'qty' },
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
      <PageHeader title="Orderan Cancel / Catatan" subtitle="Manajemen data orderan cancel dan catatan" icon="❌"
        actions={<ExcelImport module="cancel" onSuccess={() => fetchData(1)} />}
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
        title={modal.mode === 'add' ? '➕ Tambah Orderan Cancel' : '✏️ Edit Orderan Cancel'} size="md">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input type="date" className="form-control" value={form.tgl || ''} onChange={e => setForm({ ...form, tgl: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">DPK</label>
            <input type="text" className="form-control" value={form.dpk || ''} onChange={e => setForm({ ...form, dpk: e.target.value })} placeholder="DPK" />
          </div>
          <div className="form-group">
     h       <label className="form-label">Marketplace</label>
            <select className="form-control" value={form.marketplace || ''} onChange={e => setForm({ ...form, marketplace: e.target.value })}>
              <option value="">Pilih Marketplace</option>
              {MARKETPLACE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">No Order *</label>
            <input type="text" className="form-control" value={form.no_order || ''} onChange={e => setForm({ ...form, no_order: e.target.value })} placeholder="Nomor order" />
          </div>
          <div className="form-group">
            <label className="form-label">Produk</label>
            <input type="text" className="form-control" value={form.produk || ''} onChange={e => setForm({ ...form, produk: e.target.value })} placeholder="Nama produk" />
          </div>
          <div className="form-group">
            <label className="form-label">QTY</label>
            <input type="number" className="form-control" value={form.qty || 1} onChange={e => setForm({ ...form, qty: e.target.value })} min="1" />
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

export default Cancel;
