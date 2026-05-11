import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import PageHeader from '../components/PageHeader';
import { getUser } from '../utils/auth';
import { getThemePreference, setThemePreference } from '../utils/theme';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('general');
  const [themePref, setThemePref] = useState(() => getThemePreference());
  const currentUser = getUser();

  useEffect(() => {
    fetchSettings();
    fetchLogs();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.data.success) setSettings(res.data.data);
    } catch (err) { toast.error('Gagal memuat pengaturan'); }
    finally { setLoading(false); }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/settings/activity-log');
      if (res.data.success) setLogs(res.data.data);
    } catch (err) {}
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/settings', settings);
      toast.success('Pengaturan berhasil disimpan');
    } catch (err) { toast.error('Gagal menyimpan pengaturan'); }
    finally { setSaving(false); }
  };

  const handleBackup = async () => {
    setBackingUp(true);
    try {
      const res = await api.get('/settings/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${Date.now()}.sql`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Backup database berhasil diunduh');
    } catch (err) { toast.error('Gagal backup database'); }
    finally { setBackingUp(false); }
  };

  const tabs = [
    { id: 'general', label: 'Umum', icon: '⚙️' },
    { id: 'backup', label: 'Backup Database', icon: '💾' },
    { id: 'logs', label: 'Activity Log', icon: '📋' },
  ];

  return (
    <div className="fade-in">
      <PageHeader title="Pengaturan" subtitle="Konfigurasi aplikasi Algoods" icon="⚙️" />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-elevated)', padding: '6px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', width: 'fit-content', border: '1px solid var(--border)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              background: activeTab === tab.id ? 'linear-gradient(135deg, #6366f1, #4f46e5)' : 'transparent',
              color: activeTab === tab.id ? 'white' : 'var(--text-secondary)'
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>⚙️ Pengaturan Umum</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center' }}>Memuat pengaturan...</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Tema</label>
                  <select
                    className="form-control"
                    value={themePref}
                    onChange={(e) => {
                      const next = e.target.value;
                      setThemePref(next);
                      setThemePreference(next);
                      toast.success(`Tema: ${next === 'system' ? 'Sistem' : next === 'dark' ? 'Gelap' : 'Terang'}`);
                    }}
                  >
                    <option value="system">Ikuti Sistem</option>
                    <option value="light">Terang</option>
                    <option value="dark">Gelap</option>
                  </select>
                  <div style={{ marginTop: '6px', fontSize: '12px', color: 'var(--text-muted)' }}>
                    Pilih “Ikuti Sistem” untuk mengikuti dark/light dari OS.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Aplikasi</label>
                  <input type="text" className="form-control" value={settings.app_name || ''} onChange={e => setSettings({ ...settings, app_name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Nama Perusahaan</label>
                  <input type="text" className="form-control" value={settings.company_name || ''} onChange={e => setSettings({ ...settings, company_name: e.target.value })} />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Alamat Perusahaan</label>
                  <textarea className="form-control" rows={2} value={settings.company_address || ''} onChange={e => setSettings({ ...settings, company_address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Telepon</label>
                  <input type="text" className="form-control" value={settings.company_phone || ''} onChange={e => setSettings({ ...settings, company_phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-control" value={settings.company_email || ''} onChange={e => setSettings({ ...settings, company_email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Item per Halaman</label>
                  <select className="form-control" value={settings.items_per_page || '10'} onChange={e => setSettings({ ...settings, items_per_page: e.target.value })}>
                    <option value="10">10</option>
                    <option value="25">25</option>
                    <option value="50">50</option>
                    <option value="100">100</option>
                  </select>
                </div>
              </div>
            )}
            <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border-light)' }}>
              <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                {saving ? 'Menyimpan...' : '💾 Simpan Pengaturan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backup */}
      {activeTab === 'backup' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>💾 Backup Database</h3>
          </div>
          <div className="card-body" style={{ textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>🗄️</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Backup Database MySQL</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', maxWidth: '400px', margin: '0 auto 32px' }}>
              Download backup database dalam format SQL. File backup akan otomatis terunduh ke komputer Anda.
            </p>
            <button
              className="btn btn-primary"
              onClick={handleBackup}
              disabled={backingUp}
              style={{ minWidth: '200px', padding: '14px 28px', fontSize: '15px' }}
            >
              {backingUp ? '⏳ Memproses...' : '💾 Download Backup'}
            </button>
            <p style={{ marginTop: '16px', fontSize: '12px', color: 'var(--text-muted)' }}>
              Pastikan mysqldump tersedia di server
            </p>
          </div>
        </div>
      )}

      {/* Activity Log */}
      {activeTab === 'logs' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>📋 Activity Log</h3>
            <button className="btn btn-secondary btn-sm" onClick={fetchLogs}>🔄 Refresh</button>
          </div>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>User</th>
                  <th>Aksi</th>
                  <th>Modul</th>
                  <th>Deskripsi</th>
                  <th>IP</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Tidak ada log</td></tr>
                ) : logs.map((log, i) => (
                  <tr key={i}>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{new Date(log.created_at).toLocaleString('id-ID')}</td>
                    <td><strong>{log.username || '-'}</strong></td>
                    <td>
                      <span className="badge" style={{
                        background: log.action === 'login' ? '#d1fae5' : log.action === 'delete' ? '#fee2e2' : '#dbeafe',
                        color: log.action === 'login' ? '#059669' : log.action === 'delete' ? '#dc2626' : '#1d4ed8'
                      }}>
                        {log.action}
                      </span>
                    </td>
                    <td>{log.module}</td>
                    <td style={{ fontSize: '12px' }}>{log.description}</td>
                    <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{log.ip_address}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
