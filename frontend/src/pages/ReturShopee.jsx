import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getRecordId } from '../utils/recordId';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ExcelImport from '../components/ExcelImport';
import DateRangeFilter from '../components/DateRangeFilter';

const PROSES_OPTIONS = ['Banding', 'Selesai', 'Tidak Banding'];
const GUDANG_OPTIONS = ['Surabaya', 'Jakarta'];
const EMPTY_FORM = { tgl_order: '', nama_akun: '', no_order: '', no_retur: '', produk: '', kendala: '', proses: 'Tidak Banding', keterangan: '', gudang: 'Jakarta' };

function toDateInputValue(v) {
  if (v == null || v === '') return '';
  const s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const isoPrefix = s.match(/^(\d{4}-\d{2}-\d{2})([T\s]|$)/);
  if (isoPrefix) return isoPrefix[1];
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const ProsesBadge = ({ proses }) => {
  const map = { 'Banding': { bg: '#fef3c7', color: '#d97706' }, 'Selesai': { bg: '#d1fae5', color: '#059669' }, 'Tidak Banding': { bg: '#fee2e2', color: '#dc2626' } };
  const style = map[proses] || {};
  return <span className="badge" style={{ background: style.bg, color: style.color }}>{proses}</span>;
};

const GudangBadge = ({ gudang }) => {
  const map = { 'Surabaya': 'badge-surabaya', 'Jakarta': 'badge-jakarta' };
  return <span className={`badge ${map[gudang] || ''}`}>{gudang}</span>;
};

const ReturShopee = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filterProses, setFilterProses] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/retur/shopee', { params: { page, limit: 10, search, proses: filterProses, date_from: dateFrom, date_to: dateTo } });
      if (res.data.success) { setData(res.data.data); setPagination(res.data.pagination); }
    } catch (err) { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  }, [search, filterProses, dateFrom, dateTo]);

  useEffect(() => { const t = setTimeout(() => fetchData(1), 300); return () => clearTimeout(t); }, [search, filterProses, dateFrom, dateTo]);

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (row) => {
    setForm({ ...row, tgl_order: toDateInputValue(row.tgl_order) });
    setModal({ open: true, mode: 'edit', data: row });
  };

  const handleSave = async () => {
    if (!form.no_order) { toast.error('No Order wajib diisi'); return; }
    const editId = modal.mode === 'edit' ? getRecordId(modal, form) : null;
    if (modal.mode === 'edit' && editId == null) {
      toast.error('ID data tidak ditemukan. Muat ulang halaman lalu coba edit lagi.');
      return;
    }
    setSaving(true);
    try {
      const tglTrim = form.tgl_order != null ? String(form.tgl_order).trim() : '';
      const payload = {
        ...form,
        tgl_order: tglTrim || null,
        proses: form.proses || 'Tidak Banding',
        gudang: form.gudang || 'Jakarta',
      };
      if (modal.mode === 'add') { await api.post('/retur/shopee', payload); toast.success('Retur Shopee berhasil ditambahkan'); }
      else { await api.put(`/retur/shopee/${editId}`, payload); toast.success('Retur Shopee berhasil diperbarui'); }
      setModal({ open: false, mode: 'add', data: null });
      fetchData(pagination.page);
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan data'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/retur/shopee/${id}`);
      toast.success('Data berhasil dihapus');
      setDeleteConfirm(null);
      fetchData(pagination.page);
    } catch (err) { toast.error('Gagal menghapus data'); }
  };

  const columns = [
    { header: 'No', render: (_, i) => (pagination.page - 1) * 10 + i + 1 },
    { header: 'Tgl Order', render: (row) => row.tgl_order ? new Date(row.tgl_order).toLocaleDateString('id-ID') : '-' },
    { header: 'Nama Akun', key: 'nama_akun' },
    { header: 'No Order', key: 'no_order' },
    { header: 'No Retur', key: 'no_retur' },
    { header: 'Produk', key: 'produk' },
    { header: 'Kendala', key: 'kendala', cellStyle: { maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' } },
    { header: 'Proses', render: (row) => <ProsesBadge proses={row.proses} /> },
    { header: 'Keterangan', key: 'keterangan', cellStyle: { maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis' } },
    { header: 'Gudang', render: (row) => <GudangBadge gudang={row.gudang} /> },
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
      <PageHeader title="Retur Shopee" subtitle="Manajemen retur dan banding Shopee" icon="🛍️"
        actions={<ExcelImport module="retur-shopee" onSuccess={() => fetchData(1)} />}
      />
      <DataTable columns={columns} data={data} loading={loading} pagination={pagination}
        onPageChange={fetchData} onSearch={setSearch} searchValue={search}
        onAdd={openAdd} addLabel="+ Tambah Retur"
        extraFilters={
          <>
            <select className="form-control" style={{ width: '160px' }} value={filterProses} onChange={e => setFilterProses(e.target.value)}>
              <option value="">Semua Proses</option>
              {PROSES_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <DateRangeFilter
              dateFrom={dateFrom} dateTo={dateTo}
              onDateFromChange={setDateFrom} onDateToChange={setDateTo}
              onReset={() => { setDateFrom(''); setDateTo(''); }}
            />
          </>
        }
      />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'add', data: null })}
        title={modal.mode === 'add' ? '➕ Tambah Retur Shopee' : '✏️ Edit Retur Shopee'} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Tgl Order</label>
            <input type="date" className="form-control" value={form.tgl_order || ''} onChange={e => setForm({ ...form, tgl_order: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Nama Akun</label>
            <input type="text" className="form-control" value={form.nama_akun || ''} onChange={e => setForm({ ...form, nama_akun: e.target.value })} placeholder="Nama akun" />
          </div>
          <div className="form-group">
            <label className="form-label">No Order *</label>
            <input type="text" className="form-control" value={form.no_order || ''} onChange={e => setForm({ ...form, no_order: e.target.value })} placeholder="Nomor order" />
          </div>
          <div className="form-group">
            <label className="form-label">No Retur</label>
            <input type="text" className="form-control" value={form.no_retur || ''} onChange={e => setForm({ ...form, no_retur: e.target.value })} placeholder="Nomor retur" />
          </div>
          <div className="form-group">
            <label className="form-label">Produk</label>
            <input type="text" className="form-control" value={form.produk || ''} onChange={e => setForm({ ...form, produk: e.target.value })} placeholder="Nama produk" />
          </div>
          <div className="form-group">
            <label className="form-label">Proses</label>
            <select className="form-control" value={form.proses || 'Tidak Banding'} onChange={e => setForm({ ...form, proses: e.target.value })}>
              {PROSES_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Kendala</label>
            <textarea className="form-control" rows={3} value={form.kendala || ''} onChange={e => setForm({ ...form, kendala: e.target.value })} placeholder="Deskripsi kendala" />
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
        <p style={{ color: '#64748b', marginBottom: '20px' }}>Hapus retur order <strong>{deleteConfirm?.no_order}</strong>?</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>🗑️ Hapus</button>
        </div>
      </Modal>
    </div>
  );
};

export default ReturShopee;
