import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Modal from '../components/Modal';
import PageHeader from '../components/PageHeader';
import { getUser } from '../utils/auth';

const ROLE_OPTIONS = ['superadmin', 'admin', 'staff'];
const EMPTY_FORM = { username: '', password: '', full_name: '', email: '', role: 'staff', is_active: 1 };

const RoleBadge = ({ role }) => {
  const map = {
    superadmin: { bg: '#ede9fe', color: '#7c3aed' },
    admin: { bg: '#dbeafe', color: '#1d4ed8' },
    staff: { bg: '#f1f5f9', color: '#475569' }
  };
  const style = map[role] || {};
  return <span className="badge" style={{ background: style.bg, color: style.color }}>{role}</span>;
};

const Users = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'add', data: null });
  const [pwModal, setPwModal] = useState({ open: false, userId: null });
  const [form, setForm] = useState(EMPTY_FORM);
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const currentUser = getUser();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      if (res.data.success) setData(res.data.data);
    } catch (err) { toast.error('Gagal memuat data'); }
    finally { setLoading(false); }
  };

  const openAdd = () => { setForm(EMPTY_FORM); setModal({ open: true, mode: 'add', data: null }); };
  const openEdit = (row) => { setForm({ ...row, password: '' }); setModal({ open: true, mode: 'edit', data: row }); };

  const handleSave = async () => {
    if (!form.username || !form.full_name) { toast.error('Username dan nama lengkap wajib diisi'); return; }
    if (modal.mode === 'add' && !form.password) { toast.error('Password wajib diisi untuk user baru'); return; }
    setSaving(true);
    try {
      if (modal.mode === 'add') {
        await api.post('/users', form);
        toast.success('User berhasil ditambahkan');
      } else {
        await api.put(`/users/${modal.data.id}`, { full_name: form.full_name, email: form.email, role: form.role, is_active: form.is_active });
        toast.success('User berhasil diperbarui');
      }
      setModal({ open: false, mode: 'add', data: null });
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menyimpan data'); }
    finally { setSaving(false); }
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) { toast.error('Password minimal 6 karakter'); return; }
    setSaving(true);
    try {
      await api.put(`/users/${pwModal.userId}/password`, { password: newPassword });
      toast.success('Password berhasil diubah');
      setPwModal({ open: false, userId: null });
      setNewPassword('');
    } catch (err) { toast.error('Gagal mengubah password'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/users/${id}`);
      toast.success('User berhasil dihapus');
      setDeleteConfirm(null);
      fetchData();
    } catch (err) { toast.error(err.response?.data?.message || 'Gagal menghapus user'); }
  };

  return (
    <div className="fade-in">
      <PageHeader title="Manajemen User" subtitle="Kelola akun pengguna aplikasi" icon="👥" />

      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#1e293b' }}>Daftar User ({data.length})</h3>
          {currentUser?.role === 'superadmin' && (
            <button className="btn btn-primary" onClick={openAdd}>+ Tambah User</button>
          )}
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Username</th>
                <th>Nama Lengkap</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Memuat data...</td></tr>
              ) : data.map((user, i) => (
                <tr key={user.id}>
                  <td>{i + 1}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '13px', fontWeight: 700 }}>
                        {user.full_name?.charAt(0)?.toUpperCase()}
                      </div>
                      <strong>{user.username}</strong>
                    </div>
                  </td>
                  <td>{user.full_name}</td>
                  <td>{user.email || '-'}</td>
                  <td><RoleBadge role={user.role} /></td>
                  <td>
                    <span className="badge" style={{ background: user.is_active ? '#d1fae5' : '#fee2e2', color: user.is_active ? '#059669' : '#dc2626' }}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: '#64748b' }}>
                    {user.last_login ? new Date(user.last_login).toLocaleString('id-ID') : 'Belum pernah'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-sm btn-warning btn-icon" onClick={() => openEdit(user)} title="Edit">✏️</button>
                      <button className="btn btn-sm btn-secondary btn-icon" onClick={() => { setPwModal({ open: true, userId: user.id }); setNewPassword(''); }} title="Ganti Password">🔑</button>
                      {currentUser?.role === 'superadmin' && user.id !== currentUser.id && (
                        <button className="btn btn-sm btn-danger btn-icon" onClick={() => setDeleteConfirm(user)} title="Hapus">🗑️</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={modal.open} onClose={() => setModal({ open: false, mode: 'add', data: null })}
        title={modal.mode === 'add' ? '➕ Tambah User' : '✏️ Edit User'} size="md">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input type="text" className="form-control" value={form.username || ''} onChange={e => setForm({ ...form, username: e.target.value })} disabled={modal.mode === 'edit'} placeholder="Username" />
          </div>
          {modal.mode === 'add' && (
            <div className="form-group">
              <label className="form-label">Password *</label>
              <input type="password" className="form-control" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password (min 6 karakter)" />
            </div>
          )}
          <div className="form-group" style={modal.mode === 'edit' ? { gridColumn: '1 / -1' } : {}}>
            <label className="form-label">Nama Lengkap *</label>
            <input type="text" className="form-control" value={form.full_name || ''} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Nama lengkap" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-control" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Email" />
          </div>
          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-control" value={form.role || 'staff'} onChange={e => setForm({ ...form, role: e.target.value })}>
              {ROLE_OPTIONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          {modal.mode === 'edit' && (
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control" value={form.is_active} onChange={e => setForm({ ...form, is_active: parseInt(e.target.value) })}>
                <option value={1}>Aktif</option>
                <option value={0}>Nonaktif</option>
              </select>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setModal({ open: false, mode: 'add', data: null })}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Menyimpan...' : '💾 Simpan'}</button>
        </div>
      </Modal>

      {/* Change Password Modal */}
      <Modal isOpen={pwModal.open} onClose={() => setPwModal({ open: false, userId: null })} title="🔑 Ganti Password" size="sm">
        <div className="form-group">
          <label className="form-label">Password Baru</label>
          <input type="password" className="form-control" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Minimal 6 karakter" />
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
          <button className="btn btn-secondary" onClick={() => setPwModal({ open: false, userId: null })}>Batal</button>
          <button className="btn btn-primary" onClick={handleChangePassword} disabled={saving}>{saving ? 'Menyimpan...' : '🔑 Ubah Password'}</button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="🗑️ Konfirmasi Hapus" size="sm">
        <p style={{ color: '#64748b', marginBottom: '20px' }}>Hapus user <strong>{deleteConfirm?.username}</strong>?</p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
          <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm.id)}>🗑️ Hapus</button>
        </div>
      </Modal>
    </div>
  );
};

export default Users;
