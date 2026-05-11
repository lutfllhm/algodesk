import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ExcelImport from '../components/ExcelImport';

const PROSES_OPTIONS = ['Banding', 'Selesai', 'Tidak Banding'];
const GUDANG_OPTIONS = ['Surabaya', 'Jakarta'];
const EMPTY_FORM = {
  tgl_order: '', nama_akun: '', no_order: '', no_retur: '',
  produk: '', kendala: '', proses: 'Tidak Banding', keterangan: '', gudang: 'Jakarta'
};

const ProsesBadge = ({ proses }) => {
  const map = {
    'Banding':       { bg: '#fef9c3', color: '#a16207' },
    'Selesai':       { bg: '#dcfce7', color: '#15803d' },
    'Tidak Banding': { bg: '#fee2e2', color: '#b91c1c' },
  };
  const s = map[proses] || {};
  return <span className="badge" style={{ background: s.bg, color: s.color }}>{proses}</span>;
};

const GudangBadge = ({ gudang }) => {
  const map = { 'Surabaya': 'badge-surabaya', 'Jakarta': 'badge-jakarta' };
  return <span className={`badge ${map[gudang] || ''}`}>{gudang}</span>;
};

const ReturPengembalian = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filterProses, setFilterProses] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/retur-pengembalian', { params: { page, limit: 10, search, proses: filterProses } });
      if (res.data.success) { setData(res.data.data); setPagination(res.data.pagination); }
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  }, [search, filterProses]);

  useEffect(() => { const t = setTimeout(() => fetchData(1), 300); return () => clearTimeout(t); }, [search, filterProses]);

  const openAdd  = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (row) => { setForm({ ...row }); setModal({ open: true, mode: 'edit', data: row }); };

  const handleSave = async () => {
    if (!form.no_order) { toast.error('No Order wajib diisi'); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await api.post('/retur-pengembalian', form);
        toast.success('Data Retur Pengembalian berhasil ditambahkan');
      } else {
        await api.put(`/retur-pengembalian/${modal.data.id}`, form);
        toast.success('Data berhasil diperbarui');
      }
      setModal({ open: false, mode: 'add', data: null });
      fetchData(pagination.page);
    } catch { toast.error('Gagal menyimpan data'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/retur-pengembalian/${id}`);
      toast.success('Data berhasil dihapus');
      setDeleteConfirm(null);
      fetchData(pagination.page);
    } catch { toast.error('Gagal menghapus data'); }
  };

  const columns = [
    { header: 'No', render: (_, i) => (pagination.page - 1) * 10 + i + 1, style: { width: '45px' } },
    { header: 'Tgl Order', render: (row) => row.tgl_order ? new Date(row.tgl_order).toLocaleDateString('id-ID') : '-', style: { width: '100px' } },
    { header: 'Nama Akun', key: 'nama_akun', style: { width: '130px' } },
    { header: 'No Order', key: 'no_order', style: { width: '130px' } },
    { header: 'No Retur', key: 'no_retur', style: { width: '120px' } },
    { header: 'Produk', key: 'produk', style: { width: '130px' } },
    { header: 'Kendala', key: 'kendala', style: { width: '180px' } },
    { header: 'Proses', render: (row) => <ProsesBadge proses={row.proses} />, style: { width: '110px' } },
    { header: 'Keterangan', key: 'keterangan', style: { width: '160px' } },
    { header: 'Gudang', render: (row) => <GudangBadge gudang={row.gudang} />, style: { width: '90px' } },
    {
      header: 'Aksi', style: { width: '80px', textAlign: 'center' },
      render: (row) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <button className="btn btn-sm btn-warning btn-icon" onClick={() => openEdit(row)} title="Edit">✏️</button>
          <button className="btn btn-sm btn-danger btn-icon" onClick={() => setDeleteConfirm(row)} title="Hapus">🗑️</button>
        </div>
      )
    }
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Retur Pengembalian Barang"
        subtitle="Manajemen data retur pengembalian barang"
        actions={<ExcelImport module="retur-pengembalian" onSuccess={() => fetchData(1)} />}
      />

      <DataTable
        columns={columns} data={data} loading={loading} pagination={pagination}
        onPageChange={fetchData} onSearch={setSearch} searchValue={search}
        onAdd={openAdd} addLabel="+ Tambah Data"
        extraFilters={
          <select className="form-control" style={{ width: '160px' }} value={filterProses} onChange={e => setFilterProses(e.target.value)}>
            <option value="">Semua Proses</option>
            {PROSES_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        }
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'add', data: null })}
        title={modal.mode === 'add' ? 'Tambah Retur Pengembalian' : 'Edit Retur Pengembalian'}
        size="lg"
      >
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
          <div className="form-group">
            <label className="form-label">Keterangan</label>
            <input type="text" className="form-control" value={form.keterangan || ''} onChange={e => setForm({ ...form, keterangan: e.target.value })} placeholder="Keterangan tambahan" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'add', data: null })}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Hapus" size="sm">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Hapus data order <strong>{deleteConfirm?.no_order}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Hapus</button>
        </div>
      </Modal>
    </div>
  );
};

export default ReturPengembalian;
