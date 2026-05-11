import React, { useEffect, useRef, useState } from 'react';
import api from '../utils/api';

const formatTime = (isoOrDate) => {
  const d = new Date(isoOrDate);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString();
};

export default function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [items, setItems] = useState([]);
  const containerRef = useRef(null);

  const fetchUnread = async () => {
    const res = await api.get('/notifications/unread-count');
    setUnread(res.data?.unread || 0);
  };

  const fetchList = async () => {
    const res = await api.get('/notifications', { params: { limit: 30, offset: 0 } });
    setItems(res.data?.data || []);
  };

  useEffect(() => {
    fetchUnread().catch(() => {});
    const t = setInterval(() => fetchUnread().catch(() => {}), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!open) return;
    fetchList().catch(() => {});
    fetchUnread().catch(() => {});
  }, [open]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current) return;
      if (containerRef.current.contains(e.target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const markRead = async (id) => {
    await api.post(`/notifications/${id}/read`);
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    fetchUnread().catch(() => {});
  };

  const markAllRead = async () => {
    await api.post('/notifications/read-all');
    setItems((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnread(0);
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        className="notif-btn"
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Notifikasi"
      >
        <span style={{ fontSize: 16 }}>🔔</span>
        {unread > 0 && (
          <span className="notif-badge">{unread > 99 ? '99+' : unread}</span>
        )}
      </button>

      {open && (
        <div className="notif-popover">
          <div className="notif-popover-header">
            <div style={{ fontWeight: 700, fontSize: 13 }}>Notifikasi</div>
            <button className="notif-link" type="button" onClick={markAllRead} disabled={items.length === 0}>
              Tandai semua dibaca
            </button>
          </div>

          <div className="notif-list">
            {items.length === 0 ? (
              <div style={{ padding: 14, color: 'var(--text-muted)', fontSize: 12.5 }}>
                Belum ada notifikasi.
              </div>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className={`notif-item ${n.is_read ? '' : 'unread'}`}
                  onClick={() => markRead(n.id).catch(() => {})}
                  title="Klik untuk tandai dibaca"
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: 12.5, color: 'var(--text-primary)' }}>
                        {n.title}
                      </div>
                      {n.message && (
                        <div style={{ fontSize: 12.5, color: 'var(--text-secondary)', marginTop: 2, whiteSpace: 'normal' }}>
                          {n.message}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                        {formatTime(n.created_at)}
                      </div>
                    </div>
                    {!n.is_read && <span className="notif-dot" />}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

