import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ExcelImport from '../components/ExcelImport';
import DateRangeFilter from '../components/DateRangeFilter';

const EMPTY_FORM = {
  status_brg: '', dibukukan_accurate: '', no_pesanan: '', status_pesanan: '',
  status_pembatalan_pengembalian: '', status_pengiriman_gagal: '', no_resi: '', sku_induk: '',
  nama_produk: '', nomor_referensi_sku: '', serial_number: '', nama_variasi: '',
  harga_awal: '', harga_setelah_diskon: '', jumlah: '', returned_quantity: '',
  total_harga_produk: '', total_diskon: '', diskon_dari_penjual: '', diskon_dari_shopee: '',
  berat_produk: '', jumlah_produk_di_pesan: '', total_berat: '', voucher_ditanggung_penjual: '',
  cashback_koin: '', voucher_ditanggung_shopee: '', paket_diskon: '', paket_diskon_dari_shopee: '',
  paket_diskon_dari_penjual: '', potongan_koin_shopee: '', diskon_kartu_kredit: '',
  ongkir_dibayar_pembeli: '', estimasi_potongan_biaya_pengiriman: '',
  ongkir_pengembalian_barang: '', total_pembayaran: '', perkiraan_ongkir: '',
  catatan_dari_pembeli: '', catatan: '', username_pembeli: '', nama_penerima: '',
  no_telepon: '', alamat_pengiriman: '', kota_kabupaten: '', provinsi: '', waktu_pesanan_selesai: ''
};

const CodGagalTiktokMami = () => {
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
      const res = await api.get('/cod-gagal-new/tiktok-mami', { params: { page, limit: 10, search, date_from: dateFrom, date_to: dateTo } });
      if (res.data.success) { setData(res.data.data); setPagination(res.data.pagination); }
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  }, [search, dateFrom, dateTo]);

  useEffect(() => { const t = setTimeout(() => fetchData(1), 300); return () => clearTimeout(t); }, [search, dateFrom, dateTo]);

  const f = (key) => ({ value: form[key] || '', onChange: e => setForm({ ...form, [key]: e.target.value }) });

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (row) => { setForm({ ...row }); setModal({ open: true, mode: 'edit', data: row }); };

  const handleSave = async () => {
    if (!form.no_pesanan) { toast.error('No. Pesanan wajib diisi'); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await api.post('/cod-gagal-new/tiktok-mami', form);
        toast.success('Data berhasil ditambahkan');
      } else {
        await api.put(`/cod-gagal-new/tiktok-mami/${modal.data.id}`, form);
        toast.success('Data berhasil diperbarui');
      }
      setModal({ open: false, mode: 'add', data: null });
      fetchData(pagination.page);
    } catch { toast.error('Gagal menyimpan data'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/cod-gagal-new/tiktok-mami/${id}`);
      toast.success('Data berhasil dihapus');
      setDeleteConfirm(null);
      fetchData(pagination.page);
    } catch { toast.error('Gagal menghapus data'); }
  };

  const columns = [
    { header: 'No', render: (_, i) => (pagination.page - 1) * 10 + i + 1, style: { width: '45px' } },
    { header: 'Status Brg', key: 'status_brg', style: { width: '100px' } },
    { header: 'Dibukukan', key: 'dibukukan_accurate', style: { width: '100px' } },
    { header: 'No. Pesanan', key: 'no_pesanan', style: { width: '150px' } },
    { header: 'Status Pesanan', key: 'status_pesanan', style: { width: '110px' } },
    { header: 'Status Pembatalan', key: 'status_pembatalan_pengembalian', style: { width: '140px' } },
    { header: 'Status Pengiriman Gagal', key: 'status_pengiriman_gagal', style: { width: '160px' } },
    { header: 'No. Resi', key: 'no_resi', style: { width: '130px' } },
    { header: 'SKU Induk', key: 'sku_induk', style: { width: '120px' } },
    { header: 'Nama Produk', key: 'nama_produk', style: { width: '200px' } },
    { header: 'Nomor Referensi SKU', key: 'nomor_referensi_sku', style: { width: '150px' } },
    { header: 'Serial Number', key: 'serial_number', style: { width: '120px' } },
    { header: 'Nama Variasi', key: 'nama_variasi', style: { width: '130px' } },
    { header: 'Harga Awal', render: r => r.harga_awal ? Number(r.harga_awal).toLocaleString('id-ID') : '-', style: { width: '110px' } },
    { header: 'Harga Setelah Diskon', render: r => r.harga_setelah_diskon ? Number(r.harga_setelah_diskon).toLocaleString('id-ID') : '-', style: { width: '140px' } },
    { header: 'Jumlah', key: 'jumlah', style: { width: '70px' } },
    { header: 'Returned Qty', key: 'returned_quantity', style: { width: '100px' } },
    { header: 'Total Harga Produk', render: r => r.total_harga_produk ? Number(r.total_harga_produk).toLocaleString('id-ID') : '-', style: { width: '140px' } },
    { header: 'Total Diskon', render: r => r.total_diskon ? Number(r.total_diskon).toLocaleString('id-ID') : '-', style: { width: '110px' } },
    { header: 'Diskon Penjual', render: r => r.diskon_dari_penjual ? Number(r.diskon_dari_penjual).toLocaleString('id-ID') : '-', style: { width: '120px' } },
    { header: 'Diskon Shopee', render: r => r.diskon_dari_shopee ? Number(r.diskon_dari_shopee).toLocaleString('id-ID') : '-', style: { width: '120px' } },
    { header: 'Berat Produk', key: 'berat_produk', style: { width: '100px' } },
    { header: 'Jml Produk Pesan', key: 'jumlah_produk_di_pesan', style: { width: '120px' } },
    { header: 'Total Berat', key: 'total_berat', style: { width: '100px' } },
    { header: 'Voucher Penjual', render: r => r.voucher_ditanggung_penjual ? Number(r.voucher_ditanggung_penjual).toLocaleString('id-ID') : '-', style: { width: '120px' } },
    { header: 'Cashback Koin', render: r => r.cashback_koin ? Number(r.cashback_koin).toLocaleString('id-ID') : '-', style: { width: '110px' } },
    { header: 'Voucher Shopee', key: 'voucher_ditanggung_shopee', style: { width: '110px' } },
    { header: 'Paket Diskon', render: r => r.paket_diskon ? Number(r.paket_diskon).toLocaleString('id-ID') : '-', style: { width: '100px' } },
    { header: 'Paket Diskon Shopee', render: r => r.paket_diskon_dari_shopee ? Number(r.paket_diskon_dari_shopee).toLocaleString('id-ID') : '-', style: { width: '140px' } },
    { header: 'Paket Diskon Penjual', render: r => r.paket_diskon_dari_penjual ? Number(r.paket_diskon_dari_penjual).toLocaleString('id-ID') : '-', style: { width: '140px' } },
    { header: 'Potongan Koin Shopee', render: r => r.potongan_koin_shopee ? Number(r.potongan_koin_shopee).toLocaleString('id-ID') : '-', style: { width: '140px' } },
    { header: 'Diskon Kartu Kredit', render: r => r.diskon_kartu_kredit ? Number(r.diskon_kartu_kredit).toLocaleString('id-ID') : '-', style: { width: '130px' } },
    { header: 'Ongkir Dibayar Pembeli', render: r => r.ongkir_dibayar_pembeli ? Number(r.ongkir_dibayar_pembeli).toLocaleString('id-ID') : '-', style: { width: '150px' } },
    { header: 'Est. Potongan Ongkir', render: r => r.estimasi_potongan_biaya_pengiriman ? Number(r.estimasi_potongan_biaya_pengiriman).toLocaleString('id-ID') : '-', style: { width: '140px' } },
    { header: 'Ongkir Pengembalian', render: r => r.ongkir_pengembalian_barang ? Number(r.ongkir_pengembalian_barang).toLocaleString('id-ID') : '-', style: { width: '140px' } },
    { header: 'Total Pembayaran', render: r => r.total_pembayaran ? Number(r.total_pembayaran).toLocaleString('id-ID') : '-', style: { width: '130px' } },
    { header: 'Perkiraan Ongkir', render: r => r.perkiraan_ongkir ? Number(r.perkiraan_ongkir).toLocaleString('id-ID') : '-', style: { width: '120px' } },
    { header: 'Catatan Pembeli', key: 'catatan_dari_pembeli', style: { width: '150px' } },
    { header: 'Catatan', key: 'catatan', style: { width: '150px' } },
    { header: 'Username Pembeli', key: 'username_pembeli', style: { width: '130px' } },
    { header: 'Nama Penerima', key: 'nama_penerima', style: { width: '130px' } },
    { header: 'No. Telepon', key: 'no_telepon', style: { width: '120px' } },
    { header: 'Alamat Pengiriman', key: 'alamat_pengiriman', style: { width: '200px' } },
    { header: 'Kota/Kabupaten', key: 'kota_kabupaten', style: { width: '130px' } },
    { header: 'Provinsi', key: 'provinsi', style: { width: '120px' } },
    { header: 'Waktu Pesanan Selesai', key: 'waktu_pesanan_selesai', style: { width: '160px' } },
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

  const Field = ({ label, fieldKey, type = 'text', span = false }) => (
    <div className="form-group" style={span ? { gridColumn: '1 / -1' } : {}}>
      <label className="form-label">{label}</label>
      {type === 'textarea'
        ? <textarea className="form-control" rows={2} {...f(fieldKey)} />
        : <input type={type} className="form-control" {...f(fieldKey)} />}
    </div>
  );

  return (
    <div className="fade-in">
      <PageHeader
        title="COD Gagal TikTok Mami Kasir"
        subtitle="Manajemen data COD gagal TikTok Mami Kasir"
        actions={<ExcelImport module="cod-gagal-tiktok-mami" onSuccess={() => fetchData(1)} />}
      />
      <DataTable
        columns={columns} data={data} loading={loading} pagination={pagination}
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
        title={modal.mode === 'add' ? 'Tambah COD Gagal TikTok Mami Kasir' : 'Edit COD Gagal TikTok Mami Kasir'} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '65vh', overflowY: 'auto', padding: '4px' }}>
          <Field label="Status Brg" fieldKey="status_brg" />
          <Field label="Dibukukan Accurate" fieldKey="dibukukan_accurate" />
          <Field label="No. Pesanan *" fieldKey="no_pesanan" />
          <Field label="Status Pesanan" fieldKey="status_pesanan" />
          <Field label="Status Pembatalan/Pengembalian" fieldKey="status_pembatalan_pengembalian" />
          <Field label="Status Pengiriman Gagal" fieldKey="status_pengiriman_gagal" />
          <Field label="No. Resi" fieldKey="no_resi" />
          <Field label="SKU Induk" fieldKey="sku_induk" />
          <Field label="Nama Produk" fieldKey="nama_produk" span />
          <Field label="Nomor Referensi SKU" fieldKey="nomor_referensi_sku" />
          <Field label="Serial Number" fieldKey="serial_number" />
          <Field label="Nama Variasi" fieldKey="nama_variasi" span />
          <Field label="Harga Awal" fieldKey="harga_awal" type="number" />
          <Field label="Harga Setelah Diskon" fieldKey="harga_setelah_diskon" type="number" />
          <Field label="Jumlah" fieldKey="jumlah" type="number" />
          <Field label="Returned Quantity" fieldKey="returned_quantity" type="number" />
          <Field label="Total Harga Produk" fieldKey="total_harga_produk" type="number" />
          <Field label="Total Diskon" fieldKey="total_diskon" type="number" />
          <Field label="Diskon Dari Penjual" fieldKey="diskon_dari_penjual" type="number" />
          <Field label="Diskon Dari Shopee" fieldKey="diskon_dari_shopee" type="number" />
          <Field label="Berat Produk" fieldKey="berat_produk" />
          <Field label="Jumlah Produk di Pesan" fieldKey="jumlah_produk_di_pesan" type="number" />
          <Field label="Total Berat" fieldKey="total_berat" />
          <Field label="Voucher Ditanggung Penjual" fieldKey="voucher_ditanggung_penjual" type="number" />
          <Field label="Cashback Koin" fieldKey="cashback_koin" type="number" />
          <Field label="Voucher Ditanggung Shopee" fieldKey="voucher_ditanggung_shopee" />
          <Field label="Paket Diskon" fieldKey="paket_diskon" type="number" />
          <Field label="Paket Diskon (dari Shopee)" fieldKey="paket_diskon_dari_shopee" type="number" />
          <Field label="Paket Diskon (dari Penjual)" fieldKey="paket_diskon_dari_penjual" type="number" />
          <Field label="Potongan Koin Shopee" fieldKey="potongan_koin_shopee" type="number" />
          <Field label="Diskon Kartu Kredit" fieldKey="diskon_kartu_kredit" type="number" />
          <Field label="Ongkir Dibayar Pembeli" fieldKey="ongkir_dibayar_pembeli" type="number" />
          <Field label="Estimasi Potongan Biaya Pengiriman" fieldKey="estimasi_potongan_biaya_pengiriman" type="number" />
          <Field label="Ongkir Pengembalian Barang" fieldKey="ongkir_pengembalian_barang" type="number" />
          <Field label="Total Pembayaran" fieldKey="total_pembayaran" type="number" />
          <Field label="Perkiraan Ongkir" fieldKey="perkiraan_ongkir" type="number" />
          <Field label="Catatan dari Pembeli" fieldKey="catatan_dari_pembeli" type="textarea" span />
          <Field label="Catatan" fieldKey="catatan" type="textarea" span />
          <Field label="Username (Pembeli)" fieldKey="username_pembeli" />
          <Field label="Nama Penerima" fieldKey="nama_penerima" />
          <Field label="No. Telepon" fieldKey="no_telepon" />
          <Field label="Alamat Pengiriman" fieldKey="alamat_pengiriman" type="textarea" span />
          <Field label="Kota/Kabupaten" fieldKey="kota_kabupaten" />
          <Field label="Provinsi" fieldKey="provinsi" />
          <Field label="Waktu Pesanan Selesai" fieldKey="waktu_pesanan_selesai" type="datetime-local" />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'add', data: null })}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Hapus" size="sm">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Hapus data pesanan <strong>{deleteConfirm?.no_pesanan}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Hapus</button>
        </div>
      </Modal>
    </div>
  );
};

export default CodGagalTiktokMami;
