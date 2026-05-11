import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ExcelImport from '../components/ExcelImport';
import DateRangeFilter from '../components/DateRangeFilter';

const STATUS_OPTIONS = ['Service', 'Error', 'Selesai'];
const HASIL_OPTIONS = ['Kembali ke Stok', 'Gudang Rusak', 'Proses Service'];
const MARKETPLACE_OPTIONS = ['Shopee', 'TiktokShop', 'Tokopedia', 'Lazada', 'Lainnya'];

const EMPTY_FORM = {
  no: '', marketplace: '', no_pesanan: '', alasan_retur: '', produk: '',
  serial_number: '', kondisi_barang: '', kelengkapan: '', diagnosa: '', validasi: '',
  status: 'Service', tgl_servis: '', tgl_selesai_servis: '', hasil_akhir: 'Proses Service',
  tgl_kembali_stok: '', keterangan: ''
};

const StatusBadge = ({ status }) => {
  const map = { Service: 'badge-service', Error: 'badge-error', Selesai: 'badge-selesai' };
  return <span className={`badge ${map[status] || ''}`}>{status}</span>;
};

const BLP = () => {
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
      const res = await api.get('/blp', { params: { page, limit: 10, search, date_from: dateFrom, date_to: dateTo } });
      if (res.data.success) {
        setData(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [search, dateFrom, dateTo]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(1), 300);
    return () => clearTimeout(timer);
  }, [search, dateFrom, dateTo]);

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (row) => { setForm({ ...row }); setModal({ open: true, mode: 'edit', data: row }); };

  const handleSave = async () => {
    if (!form.produk) { toast.error('Produk wajib diisi'); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await api.post('/blp', form);
        toast.success('Data BLP berhasil ditambahkan');
      } else {
        await api.put(`/blp/${modal.data.id}`, form);
        toast.success('Data BLP berhasil diperbarui');
      }
      setModal({ open: false, mode: 'add', data: null });
      fetchData(pagination.page);
    } catch (err) {
      toast.error('Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/blp/${id}`);
      toast.success('Data berhasil dihapus');
      setDeleteConfirm(null);
      fetchData(pagination.page);
    } catch (err) {
      toast.error('Gagal menghapus data');
    }
  };

  const columns = [
    { header: 'No', key: 'no', render: (_, i) => (pagination.page - 1) * 10 + i + 1 },
    { header: 'Marketplace', key: 'marketplace' },
    { header: 'No Pesanan', key: 'no_pesanan' },
    { header: 'Alasan Retur', key: 'alasan_retur' },
    { header: 'Produk', key: 'produk' },
    { header: 'Serial Number', key: 'serial_number' },
    { header: 'Kondisi Barang', key: 'kondisi_barang' },
    { header: 'Kelengkapan', key: 'kelengkapan' },
    { header: 'Diagnosa', key: 'diagnosa' },
    { header: 'Validasi', key: 'validasi' },
    { header: 'Status', render: (row) => <StatusBadge status={row.status} /> },
    { header: 'Tgl Servis', render: (row) => row.tgl_servis ? new Date(row.tgl_servis).toLocaleDateString('id-ID') : '-' },
    { header: 'Tgl Selesai', render: (row) => row.tgl_selesai_servis ? new Date(row.tgl_selesai_servis).toLocaleDateString('id-ID') : '-' },
    { header: 'Hasil Akhir', key: 'hasil_akhir' },
    { header: 'Tgl Kembali Stok', render: (row) => row.tgl_kembali_stok ? new Date(row.tgl_kembali_stok).toLocaleDateString('id-ID') : '-' },
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
      <PageHeader title="Service" subtitle="Manajemen data service barang" icon="�️"
        actions={<ExcelImport module="blp" onSuccess={() => fetchData(1)} />}
      />

      <DataTable
        columns={columns} data={data} loading={loading} pagination={pagination}
        onPageChange={fetchData} onSearch={setSearch} searchValue={search}
        onAdd={openAdd} addLabel="+ Tambah Data BLP"
        extraFilters={
          <DateRangeFilter
            dateFrom={dateFrom} dateTo={dateTo}
            onDateFromChange={setDateFrom} onDateToChange={setDateTo}
            onReset={() => { setDateFrom(''); setDateTo(''); }}
          />
        }
      />

      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'add', data: null })}
        title={modal.mode === 'add' ? '➕ Tambah Data BLP' : '✏️ Edit Data BLP'} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Marketplace</label>
            <select className="form-control" value={form.marketplace || ''} onChange={e => setForm({ ...form, marketplace: e.target.value })}>
              <option value="">Pilih Marketplace</option>
              {MARKETPLACE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">No Pesanan</label>
            <input type="text" className="form-control" value={form.no_pesanan || ''} onChange={e => setForm({ ...form, no_pesanan: e.target.value })} placeholder="No pesanan" />
          </div>
          <div className="form-group">
            <label className="form-label">Alasan Retur</label>
            <input type="text" className="form-control" value={form.alasan_retur || ''} onChange={e => setForm({ ...form, alasan_retur: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Produk *</label>
            <input type="text" className="form-control" value={form.produk || ''} onChange={e => setForm({ ...form, produk: e.target.value })} placeholder="Nama produk" />
          </div>
          <div className="form-group">
            <label className="form-label">Serial Number</label>
            <input type="text" className="form-control" value={form.serial_number || ''} onChange={e => setForm({ ...form, serial_number: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Kondisi Barang</label>
            <input type="text" className="form-control" value={form.kondisi_barang || ''} onChange={e => setForm({ ...form, kondisi_barang: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Kelengkapan</label>
            <input type="text" className="form-control" value={form.kelengkapan || ''} onChange={e => setForm({ ...form, kelengkapan: e.target.value })} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Diagnosa</label>
            <textarea className="form-control" rows={2} value={form.diagnosa || ''} onChange={e => setForm({ ...form, diagnosa: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Validasi</label>
            <input type="text" className="form-control" value={form.validasi || ''} onChange={e => setForm({ ...form, validasi: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={form.status || 'Service'} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tgl Servis</label>
            <input type="date" className="form-control" value={form.tgl_servis || ''} onChange={e => setForm({ ...form, tgl_servis: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Tgl Selesai Servis</label>
            <input type="date" className="form-control" value={form.tgl_selesai_servis || ''} onChange={e => setForm({ ...form, tgl_selesai_servis: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Hasil Akhir</label>
            <select className="form-control" value={form.hasil_akhir || 'Proses Service'} onChange={e => setForm({ ...form, hasil_akhir: e.target.value })}>
              {HASIL_OPTIONS.map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tgl Kembali Stok</label>
            <input type="date" className="form-control" value={form.tgl_kembali_stok || ''} onChange={e => setForm({ ...form, tgl_kembali_stok: e.target.value })} />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Keterangan</label>
            <textarea className="form-control" rows={2} value={form.keterangan || ''} onChange={e => setForm({ ...form, keterangan: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'add', data: null })}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : '💾 Simpan'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="🗑️ Konfirmasi Hapus" size="sm">
        <p style={{ color: '#64748b', marginBottom: '20px' }}>Hapus data <strong>{deleteConfirm?.produk}</strong>?</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>🗑️ Hapus</button>
        </div>
      </Modal>
    </div>
  );
};

export default BLP;
