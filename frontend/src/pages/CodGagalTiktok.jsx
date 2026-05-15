import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { getRecordId } from '../utils/recordId';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import ExcelImport from '../components/ExcelImport';
import DateRangeFilter from '../components/DateRangeFilter';

const EMPTY_FORM = {
  status_brg: '', dibukukan_accurate: '', order_id: '', order_status: '', order_substatus: '',
  cancelation_return_type: '', normal_or_preorder: '', sku_id: '', seller_sku: '', variation: '',
  delivery_option: '', shipping_provider_name: '', buyer_message: '', buyer_username: '',
  recipient: '', phone: '', zipcode: '', country: '', province: '', regency_and_city: '',
  districts: '', villages: '', detail_address: '', additional_address: '', payment_method: '',
  weight_kg: '', product_category: '', package_id: '', purchase_channel: '', seller_note: '',
  checked_status: '', checked_marked_by: '', tokopedia_invoice_number: '',
  sku_quantity_of_return: '', sku_unit_original_price: '', sku_subtotal_before_discount: '',
  sku_platform_discount: '', sku_seller_discount: '', sku_subtotal_after_discount: '',
  shipping_fee_after_discount: '', original_shipping_fee: '', shipping_fee_seller_discount: '',
  shipping_fee_platform_discount: '', payment_platform_discount: '', buyer_service_fee: '',
  handling_fee: '', shipping_insurance: '', item_insurance: '', order_amount: '', order_refund_amount: '',
  created_time: '', paid_time: '', rts_time: '', shipped_time: '', delivered_time: '',
  cancelled_time: '', cancel_by: '', cancel_reason: '', fulfillment_type: '',
  warehouse_name: '', tracking_id: ''
};

const CodGagalTiktok = () => {
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
      const res = await api.get('/cod-gagal-new/tiktok', { params: { page, limit: 10, search, date_from: dateFrom, date_to: dateTo } });
      if (res.data.success) { setData(res.data.data); setPagination(res.data.pagination); }
    } catch { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  }, [search, dateFrom, dateTo]);

  useEffect(() => { const t = setTimeout(() => fetchData(1), 300); return () => clearTimeout(t); }, [search, dateFrom, dateTo]);

  const f = (key) => ({ value: form[key] || '', onChange: e => setForm({ ...form, [key]: e.target.value }) });

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (row) => { setForm({ ...row }); setModal({ open: true, mode: 'edit', data: row }); };

  const handleSave = async () => {
    if (!form.order_id) { toast.error('Order ID wajib diisi'); return; }
    const editId = modal.mode === 'edit' ? getRecordId(modal, form) : null;
    if (modal.mode === 'edit' && editId == null) {
      toast.error('ID data tidak ditemukan. Muat ulang halaman lalu coba edit lagi.');
      return;
    }
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await api.post('/cod-gagal-new/tiktok', form);
        toast.success('Data berhasil ditambahkan');
      } else {
        await api.put(`/cod-gagal-new/tiktok/${editId}`, form);
        toast.success('Data berhasil diperbarui');
      }
      setModal({ open: false, mode: 'add', data: null });
      fetchData(pagination.page);
    } catch { toast.error('Gagal menyimpan data'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/cod-gagal-new/tiktok/${id}`);
      toast.success('Data berhasil dihapus');
      setDeleteConfirm(null);
      fetchData(pagination.page);
    } catch { toast.error('Gagal menghapus data'); }
  };

  const columns = [
    { header: 'No', render: (_, i) => (pagination.page - 1) * 10 + i + 1, style: { width: '45px' } },
    { header: 'Status Brg', key: 'status_brg', style: { width: '100px' } },
    { header: 'Dibukukan', key: 'dibukukan_accurate', style: { width: '100px' } },
    { header: 'Order ID', key: 'order_id', style: { width: '160px' } },
    { header: 'Order Status', key: 'order_status', style: { width: '110px' } },
    { header: 'Order Substatus', key: 'order_substatus', style: { width: '130px' } },
    { header: 'Cancel/Return Type', key: 'cancelation_return_type', style: { width: '140px' } },
    { header: 'Normal/Pre-order', key: 'normal_or_preorder', style: { width: '120px' } },
    { header: 'SKU ID', key: 'sku_id', style: { width: '140px' } },
    { header: 'Seller SKU', key: 'seller_sku', style: { width: '120px' } },
    { header: 'Variation', key: 'variation', style: { width: '130px' } },
    { header: 'Delivery Option', key: 'delivery_option', style: { width: '120px' } },
    { header: 'Shipping Provider', key: 'shipping_provider_name', style: { width: '130px' } },
    { header: 'Buyer Username', key: 'buyer_username', style: { width: '130px' } },
    { header: 'Recipient', key: 'recipient', style: { width: '120px' } },
    { header: 'Phone', key: 'phone', style: { width: '110px' } },
    { header: 'Province', key: 'province', style: { width: '120px' } },
    { header: 'City', key: 'regency_and_city', style: { width: '130px' } },
    { header: 'Payment Method', key: 'payment_method', style: { width: '120px' } },
    { header: 'Weight (kg)', key: 'weight_kg', style: { width: '90px' } },
    { header: 'SKU Qty Return', key: 'sku_quantity_of_return', style: { width: '110px' } },
    { header: 'SKU Unit Price', render: r => r.sku_unit_original_price ? Number(r.sku_unit_original_price).toLocaleString('id-ID') : '-', style: { width: '110px' } },
    { header: 'SKU Subtotal', render: r => r.sku_subtotal_before_discount ? Number(r.sku_subtotal_before_discount).toLocaleString('id-ID') : '-', style: { width: '110px' } },
    { header: 'SKU Subtotal After Disc', render: r => r.sku_subtotal_after_discount ? Number(r.sku_subtotal_after_discount).toLocaleString('id-ID') : '-', style: { width: '140px' } },
    { header: 'Handling Fee', render: r => r.handling_fee ? Number(r.handling_fee).toLocaleString('id-ID') : '-', style: { width: '110px' } },
    { header: 'Shipping Insurance', render: r => r.shipping_insurance ? Number(r.shipping_insurance).toLocaleString('id-ID') : '-', style: { width: '130px' } },
    { header: 'Order Amount', render: r => r.order_amount ? Number(r.order_amount).toLocaleString('id-ID') : '-', style: { width: '110px' } },
    { header: 'Created Time', key: 'created_time', style: { width: '150px' } },
    { header: 'Paid Time', key: 'paid_time', style: { width: '150px' } },
    { header: 'RTS Time', key: 'rts_time', style: { width: '150px' } },
    { header: 'Shipped Time', key: 'shipped_time', style: { width: '150px' } },
    { header: 'Delivered Time', key: 'delivered_time', style: { width: '150px' } },
    { header: 'Cancelled Time', key: 'cancelled_time', style: { width: '150px' } },
    { header: 'Cancel By', key: 'cancel_by', style: { width: '110px' } },
    { header: 'Cancel Reason', key: 'cancel_reason', style: { width: '130px' } },
    { header: 'Fulfillment Type', key: 'fulfillment_type', style: { width: '130px' } },
    { header: 'Warehouse', key: 'warehouse_name', style: { width: '120px' } },
    { header: 'Tracking ID', key: 'tracking_id', style: { width: '130px' } },
    { header: 'Checked Status', key: 'checked_status', style: { width: '120px' } },
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
        title="COD Gagal TikTok Algoo"
        subtitle="Manajemen data COD gagal TikTok Algoo"
        actions={<ExcelImport module="cod-gagal-tiktok" onSuccess={() => fetchData(1)} />}
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
        title={modal.mode === 'add' ? 'Tambah COD Gagal TikTok' : 'Edit COD Gagal TikTok'} size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', maxHeight: '65vh', overflowY: 'auto', padding: '4px' }}>
          <Field label="Status Brg" fieldKey="status_brg" />
          <Field label="Dibukukan Accurate" fieldKey="dibukukan_accurate" />
          <Field label="Order ID *" fieldKey="order_id" />
          <Field label="Order Status" fieldKey="order_status" />
          <Field label="Order Substatus" fieldKey="order_substatus" />
          <Field label="Cancelation/Return Type" fieldKey="cancelation_return_type" />
          <Field label="Normal or Pre-order" fieldKey="normal_or_preorder" />
          <Field label="SKU ID" fieldKey="sku_id" />
          <Field label="Seller SKU" fieldKey="seller_sku" />
          <Field label="Variation" fieldKey="variation" />
          <Field label="Delivery Option" fieldKey="delivery_option" />
          <Field label="Shipping Provider Name" fieldKey="shipping_provider_name" />
          <Field label="Buyer Message" fieldKey="buyer_message" type="textarea" span />
          <Field label="Buyer Username" fieldKey="buyer_username" />
          <Field label="Recipient" fieldKey="recipient" />
          <Field label="Phone #" fieldKey="phone" />
          <Field label="Zipcode" fieldKey="zipcode" />
          <Field label="Country" fieldKey="country" />
          <Field label="Province" fieldKey="province" />
          <Field label="Regency and City" fieldKey="regency_and_city" />
          <Field label="Districts" fieldKey="districts" />
          <Field label="Villages" fieldKey="villages" />
          <Field label="Detail Address" fieldKey="detail_address" type="textarea" span />
          <Field label="Additional Address" fieldKey="additional_address" type="textarea" span />
          <Field label="Payment Method" fieldKey="payment_method" />
          <Field label="Weight (kg)" fieldKey="weight_kg" type="number" />
          <Field label="Product Category" fieldKey="product_category" />
          <Field label="Package ID" fieldKey="package_id" />
          <Field label="Purchase Channel" fieldKey="purchase_channel" />
          <Field label="Seller Note" fieldKey="seller_note" type="textarea" span />
          <Field label="Checked Status" fieldKey="checked_status" />
          <Field label="Checked Marked by" fieldKey="checked_marked_by" />
          <Field label="Tokopedia Invoice Number" fieldKey="tokopedia_invoice_number" />
          {/* Kolom tambahan */}
          <Field label="SKU Qty of Return" fieldKey="sku_quantity_of_return" type="number" />
          <Field label="SKU Unit Original Price" fieldKey="sku_unit_original_price" type="number" />
          <Field label="SKU Subtotal Before Discount" fieldKey="sku_subtotal_before_discount" type="number" />
          <Field label="SKU Platform Discount" fieldKey="sku_platform_discount" type="number" />
          <Field label="SKU Seller Discount" fieldKey="sku_seller_discount" type="number" />
          <Field label="SKU Subtotal After Discount" fieldKey="sku_subtotal_after_discount" type="number" />
          <Field label="Shipping Fee After Discount" fieldKey="shipping_fee_after_discount" type="number" />
          <Field label="Original Shipping Fee" fieldKey="original_shipping_fee" type="number" />
          <Field label="Shipping Fee Seller Discount" fieldKey="shipping_fee_seller_discount" type="number" />
          <Field label="Shipping Fee Platform Discount" fieldKey="shipping_fee_platform_discount" type="number" />
          <Field label="Payment Platform Discount" fieldKey="payment_platform_discount" type="number" />
          <Field label="Buyer Service Fee" fieldKey="buyer_service_fee" type="number" />
          <Field label="Handling Fee" fieldKey="handling_fee" type="number" />
          <Field label="Shipping Insurance" fieldKey="shipping_insurance" type="number" />
          <Field label="Item Insurance" fieldKey="item_insurance" type="number" />
          <Field label="Order Amount" fieldKey="order_amount" type="number" />
          <Field label="Order Refund Amount" fieldKey="order_refund_amount" type="number" />
          <Field label="Created Time" fieldKey="created_time" type="datetime-local" />
          <Field label="Paid Time" fieldKey="paid_time" type="datetime-local" />
          <Field label="RTS Time" fieldKey="rts_time" type="datetime-local" />
          <Field label="Shipped Time" fieldKey="shipped_time" type="datetime-local" />
          <Field label="Delivered Time" fieldKey="delivered_time" type="datetime-local" />
          <Field label="Cancelled Time" fieldKey="cancelled_time" type="datetime-local" />
          <Field label="Cancel By" fieldKey="cancel_by" />
          <Field label="Cancel Reason" fieldKey="cancel_reason" />
          <Field label="Fulfillment Type" fieldKey="fulfillment_type" />
          <Field label="Warehouse Name" fieldKey="warehouse_name" />
          <Field label="Tracking ID" fieldKey="tracking_id" />
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
          <button className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'add', data: null })}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Konfirmasi Hapus" size="sm">
        <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
          Hapus data order <strong>{deleteConfirm?.order_id}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>Hapus</button>
        </div>
      </Modal>
    </div>
  );
};

export default CodGagalTiktok;
