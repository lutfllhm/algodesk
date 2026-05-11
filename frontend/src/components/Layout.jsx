import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { clearAuth, getUser } from '../utils/auth';
import api from '../utils/api';
import toast from 'react-hot-toast';
import logo from '../assets/logo.png';
import './Layout.css';
import NotificationsBell from './NotificationsBell';
import { getResolvedTheme, getThemePreference, setThemePreference } from '../utils/theme';

const BRAND = {
  tiktokCyan: '#25F4EE',
  tiktokPink: '#FE2C55',
  shopee: '#EE4D2D',
};

// SVG TikTok icon
const TikTokIcon = ({ size = 16 }) => {
  const gid = useId();
  const gradientId = `tiktokGradient-${gid}`;

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={BRAND.tiktokCyan} />
          <stop offset="0.55" stopColor={BRAND.tiktokPink} />
          <stop offset="1" stopColor={BRAND.tiktokCyan} />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"
      />
    </svg>
  );
};

// SVG Shopee icon
const ShopeeIcon = ({ size = 16, color = BRAND.shopee }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ color }}>
    <path d="M12 2C9.51 2 7.5 4.01 7.5 6.5H4L2.5 20.5h19L20 6.5h-3.5C16.5 4.01 14.49 2 12 2zm0 1.5c1.93 0 3.5 1.57 3.5 3.5h-7c0-1.93 1.57-3.5 3.5-3.5zm-5.5 5h11l1.2 11H5.3L6.5 8.5zm5.5 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3zm0 1.5a1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5 1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5z"/>
  </svg>
);

// Render icon — bisa string emoji atau komponen React
const NavIcon = ({ icon, size = 16 }) => {
  if (typeof icon === 'string') {
    return <span style={{ fontSize: size }}>{icon}</span>;
  }
  // icon adalah komponen React
  return icon;
};

const menuItems = [
  {
    label: 'Dashboard',
    icon: '📊',
    path: '/dashboard'
  },
  {
    label: 'Retur / Banding',
    icon: '↩️',
    children: [
      { label: 'Retur TikTok', path: '/retur-tiktok', icon: <TikTokIcon size={15} /> },
      { label: 'Retur Shopee', path: '/retur-shopee', icon: <ShopeeIcon size={15} /> },
    ]
  },
  {
    label: 'Tiket',
    icon: '🎫',
    children: [
      { label: 'Tiket TikTok Algoo', path: '/tiket-tiktok', icon: <TikTokIcon size={15} /> },
      { label: 'Tiket Shopee Algoo', path: '/tiket-shopee', icon: <ShopeeIcon size={15} /> },
    ]
  },
  {
    label: 'COD Gagal',
    icon: '📦',
    children: [
      { label: 'COD Gagal TikTok Algoo', path: '/cod-gagal-tiktok', icon: <TikTokIcon size={15} /> },
      { label: 'COD Gagal TikTok Mami Kasir', path: '/cod-gagal-tiktok-mami', icon: <TikTokIcon size={15} /> },
      { label: 'COD Gagal Shopee Algoo', path: '/cod-gagal-shopee-algoo', icon: <ShopeeIcon size={15} /> },
      { label: 'COD Gagal Shopee Mami Kasir', path: '/cod-gagal-shopee-mami', icon: <ShopeeIcon size={15} /> },
    ]
  },
  {
    label: 'Servis & Rusak',
    icon: '🔧',
    children: [
      { label: 'Service Retur', path: '/rusak', icon: '↩️' },
      { label: 'Service Reguler', path: '/dari-customer', icon: '👤' },
    ]
  },
  {
    label: 'Note',
    icon: '📋',
    children: [
      { label: 'Pergantian Barang', path: '/pergantian', icon: '🔄' },
      { label: 'Orderan Cancel', path: '/cancel', icon: '❌' },
    ]
  },
  {
    label: 'Laporan',
    icon: '📈',
    path: '/report'
  },
  {
    label: 'Manajemen User',
    icon: '👥',
    path: '/users'
  },
  {
    label: 'Pengaturan',
    icon: '⚙️',
    path: '/settings'
  }
];

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState(['Servis & Rusak', 'Tiket', 'Retur / Banding', 'COD Gagal']);
  const [flyout, setFlyout] = useState(null); // { label, top, left, width, items }
  const [themePref, setThemePref] = useState(() => getThemePreference());
  const [resolvedTheme, setResolvedTheme] = useState(() => getResolvedTheme(getThemePreference()));
  const navigate = useNavigate();
  const user = getUser();
  const layoutRef = useRef(null);

  const toggleMenu = (label) => {
    setExpandedMenus(prev =>
      prev.includes(label) ? prev.filter(m => m !== label) : [...prev, label]
    );
  };

  const closeFlyout = () => setFlyout(null);

  useEffect(() => {
    if (!flyout) return;

    const onKeyDown = (e) => {
      if (e.key === 'Escape') closeFlyout();
    };

    const onPointerDown = (e) => {
      // close if click outside flyout
      const el = document.querySelector('[data-sidebar-flyout="true"]');
      if (el && !el.contains(e.target)) closeFlyout();
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [flyout]);

  useEffect(() => {
    // when sidebar expands back, close flyout
    if (sidebarOpen) closeFlyout();
  }, [sidebarOpen]);

  useEffect(() => {
    setResolvedTheme(getResolvedTheme(themePref));
  }, [themePref]);

  const menuByLabel = useMemo(() => {
    const m = new Map();
    menuItems.forEach((it) => m.set(it.label, it));
    return m;
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {}
    clearAuth();
    toast.success('Berhasil logout');
    navigate('/login');
  };

  return (
    <div className="layout" ref={layoutRef}>
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <img src={logo} alt="Algoods" className="logo-img" />
            {sidebarOpen && (
              <div className="logo-text">
                <span className="logo-name">Algoods</span>
                <span className="logo-sub">Management System</span>
              </div>
            )}
          </div>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <div key={item.label} className="nav-item-wrapper">
              {item.path ? (
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  <span className="nav-icon"><NavIcon icon={item.icon} /></span>
                  {sidebarOpen && <span className="nav-label">{item.label}</span>}
                </NavLink>
              ) : (
                <>
                  <button
                    className="nav-item nav-group-header"
                    onClick={(e) => {
                      if (!sidebarOpen) {
                        const rect = e.currentTarget.getBoundingClientRect();
                        const nextItems = menuByLabel.get(item.label)?.children || [];
                        // Place flyout next to collapsed sidebar
                        setFlyout({
                          label: item.label,
                          top: Math.max(12, rect.top),
                          left: rect.right + 10,
                          width: 280,
                          items: nextItems
                        });
                        return;
                      }
                      toggleMenu(item.label);
                    }}
                    title={!sidebarOpen ? item.label : undefined}
                  >
                    <span className="nav-icon"><NavIcon icon={item.icon} /></span>
                    {sidebarOpen && (
                      <>
                        <span className="nav-label">{item.label}</span>
                        <span className={`nav-arrow ${expandedMenus.includes(item.label) ? 'expanded' : ''}`}>
                          ›
                        </span>
                      </>
                    )}
                  </button>
                  {sidebarOpen && expandedMenus.includes(item.label) && (
                    <div className="nav-children">
                      {item.children.map(child => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) => `nav-child-item ${isActive ? 'active' : ''}`}
                        >
                          <span className="nav-child-icon"><NavIcon icon={child.icon} /></span>
                          <span>{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="user-info">
              <div className="user-avatar">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="user-details">
                <span className="user-name">{user?.full_name || 'User'}</span>
                <span className="user-role">{user?.role || 'staff'}</span>
              </div>
            </div>
          )}
          <button className="logout-btn" onClick={handleLogout} title="Logout">
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="header">
          <button
            className="toggle-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <span>☰</span>
          </button>
          <div className="header-right">
            <button
              type="button"
              className="notif-btn"
              onClick={() => {
                const next = resolvedTheme === 'dark' ? 'light' : 'dark';
                setThemePref(next);
                setThemePreference(next);
                toast.success(`Tema: ${next === 'dark' ? 'Gelap' : 'Terang'}`);
              }}
              title={`Tema: ${resolvedTheme === 'dark' ? 'Gelap' : 'Terang'} (klik untuk toggle)`}
              aria-label="Toggle tema"
            >
              <span aria-hidden="true">{resolvedTheme === 'dark' ? '🌙' : '☀️'}</span>
            </button>
            <NotificationsBell />
            <div className="header-user">
              <div className="header-avatar">
                {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div>
                <div className="header-name">{user?.full_name}</div>
                <div className="header-role">{user?.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* Flyout for collapsed sidebar groups */}
      {!sidebarOpen && flyout && (
        <div
          className="sidebar-flyout"
          data-sidebar-flyout="true"
          style={{
            top: flyout.top,
            left: flyout.left,
            width: flyout.width
          }}
        >
          <div className="sidebar-flyout-header">
            <span>{flyout.label}</span>
            <button className="sidebar-flyout-close" onClick={closeFlyout} type="button" aria-label="Tutup">
              ✕
            </button>
          </div>
          <div className="sidebar-flyout-body">
            {flyout.items.map((child) => (
              <NavLink
                key={child.path}
                to={child.path}
                className={({ isActive }) => `nav-child-item sidebar-flyout-item ${isActive ? 'active' : ''}`}
                onClick={() => closeFlyout()}
              >
                <span className="nav-child-icon"><NavIcon icon={child.icon} /></span>
                <span>{child.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
