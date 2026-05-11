import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import DateRangeFilter from '../components/DateRangeFilter';

const MARKETPLACE_OPTIONS = ['Shopee', 'TiktokShop', 'Tokopedia', 'Lazada', 'Lainnya'];
const STATUS_OPTIONS = ['Open', 'In Progress', 'Resolved', 'Closed'];

const EMPTY_FORM = {
  tanggal: '',
  nomor_wa: '',
  marketplace: '',
  no_pesanan: '',
  produk: '',
  keluhan: '',
  masalah: '',
  metode_solusi: '',
  status: 'Open',
};

const STATUS_STYLE = {
  'Open':        { background: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' },
  'In Progress': { background: '#dbeafe', color: '#1e40af', border: '1px solid #bfdbfe' },
  'Resolved':    { background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' },
  'Closed':      { background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0' },
};

const StatusBadge = ({ status }) => {
  const style = STATUS_STYLE[status] || STATUS_STYLE['Open'];
  return (
    <span style={{
      ...style,
      padding: '2px 10px',
      borderRadius: '999px',
      fontSize: '11.5px',
      fontWeight: 600,
      whiteSpace: 'nowrap',
      display: 'inline-block',
    }}>
      {status || 'Open'}
    </span>
  );
};

const SalesSupport = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await api.get('/sales-support', {
        params: { page, limit: 10, search, date_from: dateFrom, date_to: dateTo, status: statusFilter }
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
  }, [search, dateFrom, dateTo, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => fetchData(1), 300);
    return () => clearTimeout(t);
  }, [fetchData]);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, tanggal: new Date().toISOString().slice(0, 10) });
    setModal({ open: true, mode: 'add', data: null });
  };

  const openEdit = (row) => {
    setForm({
      tanggal: row.tanggal ? row.tanggal.slice(0, 10) : '',
      nomor_wa: row.nomor_wa || '',
      marketplace: row.marketplace || '',
      no_pesanan: row.no_pesanan || '',
      produk: row.produk || '',
      keluhan: row.keluhan || '',
      masalah: row.masalah || '',
      metode_solusi: row.metode_solusi || '',
      status: row.status || 'Open',
    });
    setModal({ open: true, mode: 'edit', data: row });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await api.post('/sales-support', form);
        toast.success('Tiket berhasil ditambahkan');
      } else {
        await api.put(`/sales-support/${modal.data.id}`, form);
        toast.success('Tiket berhasil diperbarui');
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
      await api.delete(`/sales-support/${id}`);
      toast.success('Tiket berhasil dihapus');
      setDeleteConfirm(null);
      fetchData(pagination.page);
    } catch (err) {
      toast.error('Gagal menghapus data');
    }
  };

  const columns = [
    {
      header: 'No',
      render: (_, i) => (pagination.page - 1) * 10 + i + 1,
      cellStyle: { width: '48px', textAlign: 'center' }
    },
    {
      header: 'Tanggal',
      render: (row) => row.tanggal
        ? new Date(row.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
        : '-',
      cellStyle: { whiteSpace: 'nowrap' }
    },
    {
      header: 'Nomor WA',
      key: 'nomor_wa',
      render: (row) => row.nomor_wa
        ? <a href={`https://wa.me/${row.nomor_wa.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
            style={{ color: '#16a34a', fontWeight: 600, textDecoration: 'none' }}>
            {row.nomor_wa}
          </a>
        : '-'
    },
    {
      header: 'Marketplace',
      key: 'marketplace',
      render: (row) => row.marketplace || '-'
    },
    {
      header: 'No. Pesanan',
      key: 'no_pesanan',
      render: (row) => row.no_pesanan || '-'
    },
    {
      header: 'Produk',
      key: 'produk',
      render: (row) => row.produk || '-',
      cellStyle: { maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
    },
    {
      header: 'Keluhan',
      key: 'keluhan',
      render: (row) => row.keluhan || '-',
      cellStyle: { maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
    },
    {
      header: 'Masalah',
      key: 'masalah',
      render: (row) => row.masalah || '-',
      cellStyle: { maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
    },
    {
      header: 'Metode/Solusi',
      key: 'metode_solusi',
      render: (row) => row.metode_solusi || '-',
      cellStyle: { maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
    },
    {
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
      cellStyle: { textAlign: 'center' }
    },
    {
      header: 'Aksi',
      render: (row) => (
        <div style={{ display: 'flex', gap: '6px' }}>
          <button className="btn btn-sm btn-warning btn-icon" onClick={() => openEdit(row)} title="Edit">✏️</button>
          <button className="btn btn-sm btn-danger btn-icon" onClick={() => setDeleteConfirm(row)} title="Hapus">🗑️</button>
        </div>
      )
    }
  ];

  return (
    <div className="fade-in">
      <PageHeader
        title="Sales Support"
        subtitle="Manajemen tiket keluhan dan dukungan pelanggan"
        icon="🎧"
      />

      {/* Summary badges */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
        {STATUS_OPTIONS.map(s => {
          const count = data.filter(d => d.status === s).length;
          const style = STATUS_STYLE[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
              style={{
                ...style,
                padding: '5px 14px',
                borderRadius: '999px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                outline: statusFilter === s ? `2px solid ${style.color}` : 'none',
                outlineOffset: '2px',
                transition: 'all 0.15s',
              }}
            >
              {s}
            </button>
          );
        })}
        {statusFilter && (
          <button
            onClick={() => setStatusFilter('')}
            style={{ padding: '5px 14px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
              background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            ✕ Reset Filter
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={loading}
        pagination={pagination}
        onPageChange={fetchData}
        onSearch={setSearch}
        searchValue={search}
        onAdd={openAdd}
        addLabel="+ Tambah Tiket"
        extraFilters={
          <DateRangeFilter
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
            onReset={() => { setDateFrom(''); setDateTo(''); }}
          />
        }
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modal.open}
        onClose={() => setModal({ open: false, mode: 'add', data: null })}
        title={modal.mode === 'add' ? '➕ Tambah Tiket Sales Support' : '✏️ Edit Tiket Sales Support'}
        size="lg"
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Tanggal</label>
            <input type="date" className="form-control"
              value={form.tanggal || ''}
              onChange={e => setForm({ ...form, tanggal: e.target.value })} />
          </div>
          <div className="form-group">
            <label className="form-label">Nomor WA</label>
            <input type="text" className="form-control"
              value={form.nomor_wa || ''}
              onChange={e => setForm({ ...form, nomor_wa: e.target.value })}
              placeholder="628xxxxxxxxxx" />
          </div>
          <div className="form-group">
            <label className="form-label">Marketplace</label>
            <select className="form-control"
              value={form.marketplace || ''}
              onChange={e => setForm({ ...form, marketplace: e.target.value })}>
              <option value="">- Pilih Marketplace -</option>
              {MARKETPLACE_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">No. Pesanan</label>
            <input type="text" className="form-control"
              value={form.no_pesanan || ''}
              onChange={e => setForm({ ...form, no_pesanan: e.target.value })}
              placeholder="Nomor pesanan" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Produk</label>
            <input type="text" className="form-control"
              value={form.produk || ''}
              onChange={e => setForm({ ...form, produk: e.target.value })}
              placeholder="Nama produk" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Keluhan</label>
            <textarea className="form-control" rows={3}
              value={form.keluhan || ''}
              onChange={e => setForm({ ...form, keluhan: e.target.value })}
              placeholder="Deskripsi keluhan pelanggan" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Masalah</label>
            <textarea className="form-control" rows={3}
              value={form.masalah || ''}
              onChange={e => setForm({ ...form, masalah: e.target.value })}
              placeholder="Identifikasi masalah" />
          </div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Metode / Solusi</label>
            <textarea className="form-control" rows={3}
              value={form.metode_solusi || ''}
              onChange={e => setForm({ ...form, metode_solusi: e.target.value })}
              placeholder="Solusi atau metode penanganan" />
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control"
              value={form.status || 'Open'}
              onChange={e => setForm({ ...form, status: e.target.value })}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn btn-secondary"
            onClick={() => setModal({ open: false, mode: 'add', data: null })}>
            Batal
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? 'Menyimpan...' : '💾 Simpan'}
          </button>
        </div>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="🗑️ Konfirmasi Hapus"
        size="sm"
      >
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Hapus tiket dari <strong>{deleteConfirm?.nomor_wa || 'pelanggan ini'}</strong>?
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>🗑️ Hapus</button>
        </div>
      </Modal>
    </div>
  );
};

export default SalesSupport;
