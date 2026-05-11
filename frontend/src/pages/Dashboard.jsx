import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend, ArcElement, LineElement, PointElement, Filler
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../utils/api';
import { getUser } from '../utils/auth';
import DateRangeFilter from '../components/DateRangeFilter';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, LineElement, PointElement, Filler);

const TikTokIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/>
  </svg>
);

const ShopeeIcon = ({ size = 14 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C9.51 2 7.5 4.01 7.5 6.5H4L2.5 20.5h19L20 6.5h-3.5C16.5 4.01 14.49 2 12 2zm0 1.5c1.93 0 3.5 1.57 3.5 3.5h-7c0-1.93 1.57-3.5 3.5-3.5zm-5.5 5h11l1.2 11H5.3L6.5 8.5zm5.5 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3zm0 1.5a1.5 1.5 0 0 1 1.5 1.5 1.5 1.5 0 0 1-1.5 1.5 1.5 1.5 0 0 1-1.5-1.5 1.5 1.5 0 0 1 1.5-1.5z"/>
  </svg>
);

/* Stat card — white card with colored bottom accent, matching existing .stat-card style */
const StatCard = ({ title, value, icon, color, sub, onClick }) => (
  <div
    className="stat-card"
    onClick={onClick}
    style={{ cursor: onClick ? 'pointer' : 'default' }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '10px'
        }}>
          {title}
        </p>
        <p style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1, letterSpacing: '-1px' }}>
          {value ?? 0}
        </p>
        {sub && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' }}>{sub}</p>
        )}
      </div>
      <div style={{
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        background: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        border: `1px solid ${color}25`,
        color: color,
      }}>
        <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center' }}>{icon}</span>
      </div>
    </div>
    {/* bottom accent line */}
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '3px',
      background: color,
      borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
      opacity: 0.7,
    }} />
  </div>
);

/* Progress bar */
const ProgressBar = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 700 }}>
          {value} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span>
        </span>
      </div>
      <div style={{ height: '6px', background: 'var(--border-light)', borderRadius: '999px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '999px', transition: 'width 0.6s ease' }} />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [rangePreset, setRangePreset] = useState('all'); // all | week | last7 | last30
  const [codDim, setCodDim] = useState('province'); // province | city
  const navigate = useNavigate();
  const user = getUser();

  const applyPreset = useCallback((preset) => {
    const pad2 = (n) => String(n).padStart(2, '0');
    const toYMD = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

    setRangePreset(preset);
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
      return;
    }

    if (preset === 'week') {
      // Monday as start of week (ID)
      const dow = end.getDay(); // 0..6 (Sun..Sat)
      const diffToMon = (dow + 6) % 7;
      const start = new Date(end);
      start.setDate(end.getDate() - diffToMon);
      setDateFrom(toYMD(start));
      setDateTo(toYMD(end));
      return;
    }

    const days = preset === 'last7' ? 6 : 29; // inclusive range
    const start = new Date(end);
    start.setDate(end.getDate() - days);
    setDateFrom(toYMD(start));
    setDateTo(toYMD(end));
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const params = (dateFrom && dateTo) ? { date_from: dateFrom, date_to: dateTo } : undefined;
      const res = await api.get('/report/dashboard', { params });
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => { applyPreset('all'); }, [applyPreset]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '360px' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ width: '28px', height: '28px', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : hour < 18 ? 'Selamat sore' : 'Selamat malam';
  const dateStr = now.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const chartOpts = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { bodyFont: { family: 'Plus Jakarta Sans', size: 12 }, titleFont: { family: 'Plus Jakarta Sans', size: 12 } }
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: '#9ca3af' }, border: { display: false } },
      y: { grid: { color: '#f3f4f6' }, ticks: { font: { size: 11, family: 'Plus Jakarta Sans' }, color: '#9ca3af' }, border: { display: false } }
    }
  };

  /* monthly trend */
  const monthlyLabels = (stats?.monthly_rusak || []).map(r => {
    const [y, m] = r.month.split('-');
    return new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
  });
  const monthlyData = (stats?.monthly_rusak || []).map(r => r.total);

  const trendData = {
    labels: monthlyLabels.length ? monthlyLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
    datasets: [{
      label: 'Rusak Masuk',
      data: monthlyData.length ? monthlyData : [0, 0, 0, 0, 0, 0],
      fill: true,
      backgroundColor: 'rgba(37,99,235,0.06)',
      borderColor: 'var(--primary)',
      borderWidth: 2,
      pointBackgroundColor: 'var(--primary)',
      pointRadius: 4,
      pointHoverRadius: 6,
      tension: 0.4,
    }]
  };

  const tiketData = {
    labels: ['TikTok Clear', 'TikTok On Goin', 'Shopee Clear', 'Shopee On Goin'],
    datasets: [{
      data: [
        stats?.tiket_tiktok?.clear || 0,
        stats?.tiket_tiktok?.no_going || 0,
        stats?.tiket_shopee?.clear || 0,
        stats?.tiket_shopee?.no_going || 0,
      ],
      backgroundColor: ['#16a34a', '#d97706', '#16a34a', '#d97706'],
      borderRadius: 6,
      borderSkipped: false,
    }]
  };

  const returTotal = (stats?.retur_tiktok?.total || 0) + (stats?.retur_shopee?.total || 0);
  const returDoughnut = {
    labels: ['TT Banding', 'TT Selesai', 'TT Tdk Banding', 'SP Banding', 'SP Selesai', 'SP Tdk Banding'],
    datasets: [{
      data: [
        stats?.retur_tiktok?.banding || 0,
        stats?.retur_tiktok?.selesai || 0,
        stats?.retur_tiktok?.tidak_banding || 0,
        stats?.retur_shopee?.banding || 0,
        stats?.retur_shopee?.selesai || 0,
        stats?.retur_shopee?.tidak_banding || 0,
      ],
      backgroundColor: ['#f59e0b', '#22c55e', '#ef4444', '#fb923c', '#34d399', '#f87171'],
      borderWidth: 2,
      borderColor: '#fff',
      hoverOffset: 4,
    }]
  };

  const returSeries = stats?.retur_series || [];
  const returSeriesLabels = returSeries.map(r => {
    const d = new Date(r.date);
    return Number.isNaN(d.getTime()) ? r.date : d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
  });
  const returTiktokSeriesData = returSeries.map(r => r.tiktok || 0);
  const returShopeeSeriesData = returSeries.map(r => r.shopee || 0);

  const returLine = {
    labels: returSeriesLabels.length ? returSeriesLabels : ['-'],
    datasets: [
      {
        label: 'Retur TikTok',
        data: returTiktokSeriesData.length ? returTiktokSeriesData : [0],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139,92,246,0.10)',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 3,
        fill: true,
      },
      {
        label: 'Retur Shopee',
        data: returShopeeSeriesData.length ? returShopeeSeriesData : [0],
        borderColor: '#ec4899',
        backgroundColor: 'rgba(236,72,153,0.08)',
        borderWidth: 2,
        tension: 0.35,
        pointRadius: 3,
        fill: true,
      }
    ]
  };

  const codDimData = codDim === 'city'
    ? (stats?.cod_gagal?.by_city || [])
    : (stats?.cod_gagal?.by_province || []);

  const codLabels = codDimData.map(r => r.label);
  const codCounts = codDimData.map(r => r.total);
  const codTotal = codCounts.reduce((a, b) => a + (Number(b) || 0), 0);

  const codBar = {
    labels: codLabels.length ? codLabels : ['-'],
    datasets: [{
      label: 'COD Gagal',
      data: codCounts.length ? codCounts : [0],
      backgroundColor: '#ef4444',
      borderRadius: 8,
      borderSkipped: false,
    }]
  };

  return (
    <div className="fade-in">

      {/* ── Greeting bar ── */}
      <div style={{
        background: 'var(--bg-elevated)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '18px 24px',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: 'var(--shadow-sm)',
      }}>
        <div>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '3px' }}>{dateStr}</p>
          <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.3px' }}>
            {greeting}, {user?.full_name?.split(' ')[0] || 'User'} 👋
          </h1>
        </div>
        <div style={{
          background: 'var(--primary-muted)',
          border: '1px solid var(--border)',
          borderRadius: '10px',
          padding: '8px 16px',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--primary)',
        }}>
          Algoods
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <StatCard title="Service Retur" value={stats?.rusak?.total || 0} icon="🔧" color="#6366f1"
          sub={`${stats?.rusak?.proses_servis || stats?.rusak?.service || 0} proses servis`}
          onClick={() => navigate('/rusak')} />
        <StatCard title="Service Reguler" value={0} icon="👤" color="#0891b2"
          sub="customer reguler"
          onClick={() => navigate('/dari-customer')} />
        <StatCard title="Pergantian" value={stats?.pergantian?.total || 0} icon="🔄" color="#0284c7"
          onClick={() => navigate('/pergantian')} />
        <StatCard title="Orderan Cancel" value={stats?.cancel?.total || 0} icon="✕" color="#dc2626"
          onClick={() => navigate('/cancel')} />
        <StatCard title="Tiket TikTok" value={stats?.tiket_tiktok?.total || 0}
          icon={<TikTokIcon size={18} />} color="#374151"
          sub={`${stats?.tiket_tiktok?.clear || 0} clear · ${stats?.tiket_tiktok?.no_going || 0} on goin`}
          onClick={() => navigate('/tiket-tiktok')} />
        <StatCard title="Tiket Shopee" value={stats?.tiket_shopee?.total || 0}
          icon={<ShopeeIcon size={18} />} color="#ea580c"
          sub={`${stats?.tiket_shopee?.clear || 0} clear · ${stats?.tiket_shopee?.no_going || 0} on goin`}
          onClick={() => navigate('/tiket-shopee')} />
        <StatCard title="Retur TikTok" value={stats?.retur_tiktok?.total || 0}
          icon={<TikTokIcon size={18} />} color="#8b5cf6"
          sub={`${stats?.retur_tiktok?.banding || 0} banding`}
          onClick={() => navigate('/retur-tiktok')} />
        <StatCard title="Retur Shopee" value={stats?.retur_shopee?.total || 0}
          icon={<ShopeeIcon size={18} />} color="#ec4899"
          sub={`${stats?.retur_shopee?.banding || 0} banding`}
          onClick={() => navigate('/retur-shopee')} />
        <StatCard title="Sales Support" value={stats?.sales_support?.total || 0} icon="🎧" color="#0ea5e9"
          sub={`${stats?.sales_support?.done_count || 0} done · ${stats?.sales_support?.no_respond || 0} no respond`}
          onClick={() => navigate('/sales-support')} />
      </div>

      {/* ── Filter Retur TikTok & Shopee ── */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>🗓️ Filter Retur TikTok & Shopee</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <select
              className="form-control"
              style={{ width: '170px' }}
              value={rangePreset}
              onChange={(e) => applyPreset(e.target.value)}
            >
              <option value="all">Semua</option>
              <option value="week">Minggu ini</option>
              <option value="last7">7 hari terakhir</option>
              <option value="last30">30 hari terakhir</option>
            </select>
            <DateRangeFilter
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={(v) => { setRangePreset('custom'); setDateFrom(v); }}
              onDateToChange={(v) => { setRangePreset('custom'); setDateTo(v); }}
              onReset={() => applyPreset('all')}
            />
          </div>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {dateFrom && dateTo ? `Aktif: ${dateFrom} s/d ${dateTo}` : 'Aktif: Semua tanggal'}
          </span>
          {(dateFrom && dateTo) && (
            <button className="btn btn-sm btn-secondary" onClick={() => applyPreset('all')}>Reset</button>
          )}
        </div>
      </div>

      {/* ── Grafik Retur (TikTok vs Shopee) ── */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>📊 Grafik Retur (TikTok vs Shopee)</span>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            {dateFrom && dateTo ? `${dateFrom} s/d ${dateTo}` : 'Default: 30 hari terakhir'}
          </span>
        </div>
        <div className="card-body" style={{ height: '210px' }}>
          <Line
            data={returLine}
            options={{
              ...chartOpts,
              plugins: {
                ...chartOpts.plugins,
                legend: { display: true, labels: { color: '#6b7280', boxWidth: 10, usePointStyle: true } }
              },
              scales: {
                x: {
                  ...chartOpts.scales.x,
                  ticks: { font: { size: 10, family: 'Plus Jakarta Sans' }, color: '#9ca3af', maxTicksLimit: 8 }
                },
                y: {
                  ...chartOpts.scales.y,
                  ticks: { font: { size: 10, family: 'Plus Jakarta Sans' }, color: '#9ca3af', maxTicksLimit: 6 }
                }
              }
            }}
          />
        </div>
      </div>

      {/* ── Charts row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', marginBottom: '16px' }}>

        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>📈 Tren Rusak Masuk (6 Bulan)</span>
          </div>
          <div className="card-body" style={{ height: '210px' }}>
            <Line data={trendData} options={chartOpts} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>🎫 Status Tiket</span>
          </div>
          <div className="card-body" style={{ height: '210px' }}>
            <Bar data={tiketData} options={{
              ...chartOpts,
              scales: {
                ...chartOpts.scales,
                x: { ...chartOpts.scales.x, ticks: { font: { size: 10, family: 'Plus Jakarta Sans' }, color: '#9ca3af' } }
              }
            }} />
          </div>
        </div>
      </div>

      {/* ── COD Gagal by Location ── */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="card-header" style={{ alignItems: 'center' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>🚚 COD Gagal (Top 10)</span>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              className={`btn btn-sm ${codDim === 'province' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCodDim('province')}
              type="button"
            >
              Provinsi
            </button>
            <button
              className={`btn btn-sm ${codDim === 'city' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setCodDim('city')}
              type="button"
            >
              Kota/Kab
            </button>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{codTotal} total</span>
          </div>
        </div>
        <div className="card-body" style={{ height: '280px' }}>
          <Bar
            data={codBar}
            options={{
              ...chartOpts,
              indexAxis: 'y',
              plugins: { ...chartOpts.plugins, legend: { display: false } },
              scales: {
                x: { ...chartOpts.scales.x, grid: { color: '#f3f4f6' }, ticks: { ...chartOpts.scales.x.ticks } },
                y: { ...chartOpts.scales.y, grid: { display: false }, ticks: { font: { size: 10, family: 'Plus Jakarta Sans' }, color: '#6b7280' } }
              }
            }}
          />
        </div>
      </div>

      {/* ── Sales Support Chart ── */}
      {(() => {
        const ssMonthly = stats?.sales_support_monthly || [];
        const ssLabels = ssMonthly.map(r => {
          const [y, m] = r.month.split('-');
          return new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
        });
        const ssData = ssMonthly.map(r => r.total);
        const ssTotal = stats?.sales_support?.total || 0;
        const ssDone = stats?.sales_support?.done_count || 0;
        const ssNoRespond = stats?.sales_support?.no_respond || 0;
        const ssRetur = stats?.sales_support?.retur || 0;

        const ssTrendData = {
          labels: ssLabels.length ? ssLabels : ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'],
          datasets: [{
            label: 'Tiket Masuk',
            data: ssData.length ? ssData : [0, 0, 0, 0, 0, 0],
            fill: true,
            backgroundColor: 'rgba(14,165,233,0.08)',
            borderColor: '#0ea5e9',
            borderWidth: 2,
            pointBackgroundColor: '#0ea5e9',
            pointRadius: 4,
            tension: 0.4,
          }]
        };

        const ssStatusData = {
          labels: ['Done', 'No Respond', 'Retur'],
          datasets: [{
            data: [ssDone, ssNoRespond, ssRetur],
            backgroundColor: ['#34d399', '#fbbf24', '#f87171'],
            borderWidth: 2,
            borderColor: '#fff',
            hoverOffset: 4,
          }]
        };

        return (
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div className="card">
              <div className="card-header" style={{ alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>🎧 Tren Sales Support (6 Bulan)</span>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{ssTotal} total tiket</span>
              </div>
              <div className="card-body" style={{ height: '210px' }}>
                <Line data={ssTrendData} options={chartOpts} />
              </div>
            </div>
            <div className="card">
              <div className="card-header" style={{ alignItems: 'center' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>🎧 Status Tiket Support</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{ssTotal}</span>
              </div>
              <div className="card-body" style={{ height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Doughnut data={ssStatusData} options={{
                  responsive: true, maintainAspectRatio: false, cutout: '60%',
                  plugins: {
                    legend: { position: 'bottom', labels: { font: { size: 10, family: 'Plus Jakarta Sans' }, padding: 8, boxWidth: 10, color: '#6b7280' } },
                    tooltip: { bodyFont: { family: 'Plus Jakarta Sans', size: 11 } }
                  }
                }} />
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Retur row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>

        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>↩️ Distribusi Retur</span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{returTotal} total</span>
          </div>
          <div className="card-body" style={{ height: '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Doughnut data={returDoughnut} options={{
              responsive: true, maintainAspectRatio: false, cutout: '62%',
              plugins: {
                legend: { position: 'bottom', labels: { font: { size: 10, family: 'Plus Jakarta Sans' }, padding: 8, boxWidth: 10, color: '#6b7280' } },
                tooltip: { bodyFont: { family: 'Plus Jakarta Sans', size: 11 } }
              }
            }} />
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TikTokIcon size={13} /> Retur TikTok
            </span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.retur_tiktok?.total || 0}</span>
          </div>
          <div className="card-body">
            <ProgressBar label="Banding" value={stats?.retur_tiktok?.banding || 0} total={stats?.retur_tiktok?.total || 1} color="#f59e0b" />
            <ProgressBar label="Selesai" value={stats?.retur_tiktok?.selesai || 0} total={stats?.retur_tiktok?.total || 1} color="#16a34a" />
            <ProgressBar label="Tidak Banding" value={stats?.retur_tiktok?.tidak_banding || 0} total={stats?.retur_tiktok?.total || 1} color="#dc2626" />
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ gap: '8px' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShopeeIcon size={13} /> Retur Shopee
            </span>
            <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{stats?.retur_shopee?.total || 0}</span>
          </div>
          <div className="card-body">
            <ProgressBar label="Banding" value={stats?.retur_shopee?.banding || 0} total={stats?.retur_shopee?.total || 1} color="#f97316" />
            <ProgressBar label="Selesai" value={stats?.retur_shopee?.selesai || 0} total={stats?.retur_shopee?.total || 1} color="#16a34a" />
            <ProgressBar label="Tidak Banding" value={stats?.retur_shopee?.tidak_banding || 0} total={stats?.retur_shopee?.total || 1} color="#dc2626" />
          </div>
        </div>
      </div>

      {/* ── Quick Nav ── */}
      <div className="card">
        <div className="card-header">
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>⚡ Akses Cepat</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '10px' }}>
            {[
              { label: 'Service Retur', icon: '🔧', path: '/rusak', color: '#6366f1' },
              { label: 'Service Reguler', icon: '👤', path: '/dari-customer', color: '#0891b2' },
              { label: 'Pergantian', icon: '🔄', path: '/pergantian', color: '#0284c7' },
              { label: 'Cancel', icon: '✕', path: '/cancel', color: '#dc2626' },
              { label: 'Tiket TikTok', icon: <TikTokIcon size={20} />, path: '/tiket-tiktok', color: '#374151' },
              { label: 'Tiket Shopee', icon: <ShopeeIcon size={20} />, path: '/tiket-shopee', color: '#ea580c' },
              { label: 'Retur TikTok', icon: <TikTokIcon size={20} />, path: '/retur-tiktok', color: '#8b5cf6' },
              { label: 'Retur Shopee', icon: <ShopeeIcon size={20} />, path: '/retur-shopee', color: '#ec4899' },
              { label: 'Laporan', icon: '📊', path: '/report', color: '#16a34a' },
              { label: 'Sales Support', icon: '🎧', path: '/sales-support', color: '#0ea5e9' },
              { label: 'Pengaturan', icon: '⚙️', path: '/settings', color: '#6b7280' },
            ].map(item => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  padding: '14px 12px',
                  borderRadius: '10px',
                  border: `1.5px solid ${item.color}20`,
                  background: `${item.color}08`,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '7px',
                  transition: 'all 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${item.color}14`;
                  e.currentTarget.style.borderColor = `${item.color}40`;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = `0 4px 10px ${item.color}18`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = `${item.color}08`;
                  e.currentTarget.style.borderColor = `${item.color}20`;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: '20px', color: item.color, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: item.color, textAlign: 'center', lineHeight: 1.3 }}>{item.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
