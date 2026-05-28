import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getRecordId } from '../utils/recordId';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ExcelImport from '../components/ExcelImport';
import DateRangeFilter from '../components/DateRangeFilter';

const KELENGKAPAN_OPTIONS = [
  '(-) Kabel USB',
  '(-) Charger',
  '(-) Adaptor Power',
  '(-) Kabel Adaptor',
  '(-) Stik Roll',
  '(-) Pembatas Kertas',
  'Lengkap',
  '(-) Free Kertas',
  '(-) Panduan',
  '(-) Garansi',
];

const STATUS_OPTIONS = ['Proses Servis', 'Gudang Rusak', 'Kembali ke Stok/Customer'];

const EMPTY_FORM = {
  tgl_masuk: '',
  no_pesanan: '',
  tipe: '',
  nomor_seri: '',
  kendala_diagnosa: '',
  kelengkapan: '',
  validasi: '',
  status: 'Proses Servis',
  tgl_kembali: '',
};

const StatusBadge = ({ status }) => {
  const map = {
    'Proses Servis': { bg: '#dbeafe', color: '#1d4ed8' },
    'Gudang Rusak': { bg: '#fee2e2', color: '#991b1b' },
    'Kembali ke Stok/Customer': { bg: '#fef9c3', color: '#92400e' },
  };
  const style = map[status] || { bg: '#f1f5f9', color: '#475569' };
  return (
    <span
      className="badge"
      style={{
        background: style.bg,
        color: style.color,
        padding: '3px 10px',
        borderRadius: '999px',
        fontWeight: 600,
        fontSize: '12px',
        whiteSpace: 'nowrap',
      }}
    >
      {status || '-'}
    </span>
  );
};

const KelengkapanBadge = ({ value }) => {
  if (!value) return <span>-</span>;
  const isLengkap = value === 'Lengkap';
  return (
    <span
      style={{
        background: isLengkap ? '#fef9c3' : '#8b0000',
        color: isLengkap ? '#92400e' : '#fff',
        padding: '3px 10px',
        borderRadius: '999px',
        fontWeight: 600,
        fontSize: '12px',
        whiteSpace: 'nowrap',
      }}
    >
      {value}
    </span>
  );
};

const DariRetur = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/rusak', {
        params: { page, limit: pagination.limit, search, status: filterStatus, date_from: dateFrom, date_to: dateTo }
      });
      if (res.data.success) {
        setData(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      toast.error('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus, dateFrom, dateTo, pagination.limit]);

  useEffect(() => {
    const timer = setTimeout(() => fetchData(1), 300);
    return () => clearTimeout(timer);
  }, [search, filterStatus, dateFrom, dateTo]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setModal({ open: true, mode: 'add', data: null });
  };

  const openEdit = (row) => {
    setForm({ ...row });
    setModal({ open: true, mode: 'edit', data: row });
  };

  const openView = (row) => {
    setModal({ open: true, mode: 'view', data: row });
  };

  const handleSave = async () => {
    const editId = modal.mode === 'edit' ? getRecordId(modal, form) : null;
    if (modal.mode === 'edit' && editId == null) {
      toast.error('ID data tidak ditemukan. Muat ulang halaman lalu coba edit lagi.');
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await api.post('/rusak', form);
        toast.success('Data berhasil ditambahkan');
      } else {
        await api.put(`/rusak/${editId}`, form);
        toast.success('Data berhasil diperbarui');
      }
      setModal({ open: false, mode: 'add', data: null });
      fetchData(pagination.page);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/rusak/${id}`);
      toast.success('Data berhasil dihapus');
      setDeleteConfirm(null);
      fetchData(pagination.page);
    } catch (err) {
      toast.error('Gagal menghapus data');
    }
  };

  const columns = [
    {
      header: 'No',
      render: (_, i) => (pagination.page - 1) * pagination.limit + i + 1,
      style: { width: '45px', textAlign: 'center' },
    },
    {
      header: 'Tgl Masuk',
      key: 'tgl_masuk',
      render: (row) => row.tgl_masuk ? new Date(row.tgl_masuk).toLocaleDateString('id-ID') : '-',
      style: { width: '100px' },
    },
    { header: 'No Pesanan / Resi', key: 'no_pesanan', style: { width: '150px' } },
    { header: 'Tipe', key: 'tipe', style: { width: '100px' } },
    { header: 'Nomor Seri', key: 'nomor_seri', style: { width: '130px' } },
    { header: 'Kendala / Diagnosa', key: 'kendala_diagnosa', style: { width: '160px' } },
    {
      header: 'Kelengkapan',
      render: (row) => <KelengkapanBadge value={row.kelengkapan} />,
      style: { width: '150px' },
    },
    { header: 'Validasi', key: 'validasi', style: { width: '100px' } },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
      style: { width: '160px' },
    },
    {
      header: 'Tgl Kembali',
      render: (row) => row.tgl_kembali ? new Date(row.tgl_kembali).toLocaleDateString('id-ID') : '-',
      style: { width: '100px' },
    },
    {
      header: 'Aksi',
      style: { width: '100px', textAlign: 'center' },
      render: (row) => (
        <div style={{ display: 'flex', gap: '4px', justifyContent: 'center' }}>
          <button className="btn btn-sm btn-secondary btn-icon" onClick={() => openView(row)} title="Detail">👁️</button>
          <button className="btn btn-sm btn-warning btn-icon" onClick={() => openEdit(row)} title="Edit">✏️</button>
          <button className="btn btn-sm btn-danger btn-icon" onClick={() => setDeleteConfirm(row)} title="Hapus">🗑️</button>
        </div>
      ),
    },
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Servis & Rusak — Service Retur"
        subtitle="Manajemen data servis dan barang rusak dari retur marketplace"
        icon="🔧"
        actions={<ExcelImport module="rusak" onSuccess={() => fetchData(1)} />}
      />

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={(p) => fetchData(p)}
        onSearch={setSearch}
        searchValue={search}
        onAdd={openAdd}
        addLabel="+ Tambah Data"
        extraFilters={
          <>
            <select className="form-control" style={{ width: '180px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <DateRangeFilter
              dateFrom={dateFrom} dateTo={dateTo}
              onDateFromChange={setDateFrom} onDateToChange={setDateTo}
              onReset={() => { setDateFrom(''); setDateTo(''); }}
            />
          </>
        }
      />

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modal.open && modal.mode !== 'view'}
        onClose={() => setModal({ open: false, mode: 'add', data: null })}
        title={modal.mode === 'add' ? '➕ Tambah Data Service Retur' : '✏️ Edit Data Service Retur'}
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Tanggal Masuk</label>
            <input type="date" className="form-control" value={form.tgl_masuk || ''} onChange={e => setForm({ ...form, tgl_masuk: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">No Pesanan / Resi</label>
            <input type="text" className="form-control" value={form.no_pesanan || ''} onChange={e => setForm({ ...form, no_pesanan: e.target.value })} placeholder="No pesanan atau resi" />
          </div>
          <div className="form-group">
            <label className="form-label">Tipe</label>
            <input type="text" className="form-control" value={form.tipe || ''} onChange={e => setForm({ ...form, tipe: e.target.value })} placeholder="Tipe produk" />
          </div>
          <div className="form-group">
            <label className="form-label">Nomor Seri</label>
            <input type="text" className="form-control" value={form.nomor_seri || ''} onChange={e => setForm({ ...form, nomor_seri: e.target.value })} placeholder="Nomor seri" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Kendala / Diagnosa</label>
            <textarea className="form-control" rows={2} value={form.kendala_diagnosa || ''} onChange={e => setForm({ ...form, kendala_diagnosa: e.target.value })} placeholder="Kendala atau diagnosa kerusakan" />
          </div>
          <div className="form-group">
            <label className="form-label">Kelengkapan</label>
            <select className="form-control" value={form.kelengkapan || ''} onChange={e => setForm({ ...form, kelengkapan: e.target.value })}>
              <option value="">Pilih Kelengkapan</option>
              {KELENGKAPAN_OPTIONS.map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Validasi</label>
            <input type="text" className="form-control" value={form.validasi || ''} onChange={e => setForm({ ...form, validasi: e.target.value })} placeholder="Validasi" />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control" value={form.status || 'Proses Servis'} onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tgl Kembali</label>
            <input type="date" className="form-control" value={form.tgl_kembali || ''} onChange={e => setForm({ ...form, tgl_kembali: e.target.value })} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'add', data: null })}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : '💾 Simpan'}
          </button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={modal.open && modal.mode === 'view'}
        onClose={() => setModal({ open: false, mode: 'add', data: null })}
        title="👁️ Detail Data Service Retur"
        size="lg"
      >
        {modal.data && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              ['Tgl Masuk', modal.data.tgl_masuk ? new Date(modal.data.tgl_masuk).toLocaleDateString('id-ID') : '-'],
              ['No Pesanan / Resi', modal.data.no_pesanan],
              ['Tipe', modal.data.tipe],
              ['Nomor Seri', modal.data.nomor_seri],
              ['Kendala / Diagnosa', modal.data.kendala_diagnosa],
              ['Kelengkapan', modal.data.kelengkapan],
              ['Validasi', modal.data.validasi],
              ['Status', modal.data.status],
              ['Tgl Kembali', modal.data.tgl_kembali ? new Date(modal.data.tgl_kembali).toLocaleDateString('id-ID') : '-'],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '10px', background: '#f8fafc', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontSize: '13px', color: '#1e293b', fontWeight: 500 }}>{value || '-'}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="🗑️ Konfirmasi Hapus" size="sm">
        <p style={{ color: '#64748b', marginBottom: '20px' }}>
          Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>🗑️ Hapus</button>
        </div>
      </Modal>
    </div>
  );
};

export default DariRetur;
