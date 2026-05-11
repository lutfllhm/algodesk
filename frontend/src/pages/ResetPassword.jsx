import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import logo from '../assets/logo.png';
import './Login.css';
import './ForgotPassword.css';

/* ─── Icons ──────────────────────────────────────────── */
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ─── Password strength helper ───────────────────────── */
const getStrength = (pw) => {
  if (!pw) return { level: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { level: 1, label: 'Lemah', color: '#ef4444' };
  if (score <= 2) return { level: 2, label: 'Cukup', color: '#f59e0b' };
  if (score <= 3) return { level: 3, label: 'Baik', color: '#3b82f6' };
  return { level: 4, label: 'Kuat', color: '#22c55e' };
};

/* ─── ResetPassword Page ─────────────────────────────── */
const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [username, setUsername] = useState('');
  const [form, setForm] = useState({ newPassword: '', confirmPassword: '' });
  const [show, setShow] = useState({ new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setValidating(false);
      return;
    }
    api.get(`/auth/validate-reset-token/${token}`)
      .then((res) => {
        if (res.data.valid) {
          setTokenValid(true);
          setUsername(res.data.username || '');
        }
      })
      .catch(() => {})
      .finally(() => setValidating(false));
  }, [token]);

  const strength = getStrength(form.newPassword);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.newPassword || !form.confirmPassword) {
      toast.error('Semua field wajib diisi');
      return;
    }
    if (form.newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword: form.newPassword
      });
      if (res.data.success) {
        setDone(true);
        toast.success('Password berhasil direset');
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="fp-shell">
        {/* Header */}
        <div className="fp-logo">
          <img src={logo} alt="Algoods" />
          <span>Algoods</span>
        </div>

        {validating ? (
          <div className="fp-validating">
            <div className="spinner-sm" style={{ borderTopColor: '#3b82f6', borderColor: '#e2e8f0', width: 28, height: 28 }} />
            <p>Memvalidasi token...</p>
          </div>
        ) : !tokenValid ? (
          /* ── Invalid / expired token ── */
          <div className="fp-success">
            <div className="fp-success-icon fp-success-icon--error">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
            <h2>Token Tidak Valid</h2>
            <p>Token reset password tidak ditemukan atau sudah kadaluarsa. Silakan buat token baru.</p>
            <Link to="/forgot-password" className="login-submit login-submit-light fp-submit fp-submit-link">
              Buat Token Baru
            </Link>
          </div>
        ) : done ? (
          /* ── Success ── */
          <div className="fp-success">
            <div className="fp-success-icon">
              <IconCheck />
            </div>
            <h2>Password Berhasil Direset</h2>
            <p>Password akun <strong>{username}</strong> telah diperbarui. Anda akan diarahkan ke halaman login dalam 3 detik.</p>
            <Link to="/login" className="login-submit login-submit-light fp-submit fp-submit-link">
              Login Sekarang
            </Link>
          </div>
        ) : (
          /* ── Reset form ── */
          <>
            <div className="fp-icon-wrap">
              <div className="fp-icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
            </div>

            <div className="fp-heading">
              <h1>Reset Password</h1>
              {username && <p>Buat password baru untuk akun <strong>{username}</strong>.</p>}
              {!username && <p>Masukkan password baru untuk akun Anda.</p>}
            </div>

            <form onSubmit={handleSubmit} className="fp-form" autoComplete="off">
              {/* New password */}
              <div className="fp-field">
                <label className="fp-label">Password Baru</label>
                <div className="login-input-wrap">
                  <input
                    type={show.new ? 'text' : 'password'}
                    className="login-input login-input-light fp-input login-input-password"
                    placeholder="Minimal 6 karakter"
                    value={form.newPassword}
                    onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
                    autoFocus
                  />
                  <button type="button" className="login-input-toggle login-input-toggle-light"
                    onClick={() => setShow({ ...show, new: !show.new })}
                    aria-label={show.new ? 'Sembunyikan' : 'Tampilkan'}>
                    {show.new ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {/* Strength bar */}
                {form.newPassword && (
                  <div className="fp-strength">
                    <div className="fp-strength-bars">
                      {[1, 2, 3, 4].map((n) => (
                        <div
                          key={n}
                          className="fp-strength-bar"
                          style={{ background: n <= strength.level ? strength.color : '#e2e8f0' }}
                        />
                      ))}
                    </div>
                    <span className="fp-strength-label" style={{ color: strength.color }}>
                      {strength.label}
                    </span>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="fp-field">
                <label className="fp-label">Konfirmasi Password</label>
                <div className="login-input-wrap">
                  <input
                    type={show.confirm ? 'text' : 'password'}
                    className={`login-input login-input-light fp-input login-input-password${
                      form.confirmPassword && form.confirmPassword !== form.newPassword ? ' fp-input--error' : ''
                    }${
                      form.confirmPassword && form.confirmPassword === form.newPassword ? ' fp-input--ok' : ''
                    }`}
                    placeholder="Ulangi password baru"
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  />
                  <button type="button" className="login-input-toggle login-input-toggle-light"
                    onClick={() => setShow({ ...show, confirm: !show.confirm })}
                    aria-label={show.confirm ? 'Sembunyikan' : 'Tampilkan'}>
                    {show.confirm ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {form.confirmPassword && form.confirmPassword !== form.newPassword && (
                  <span className="fp-field-error">Password tidak cocok</span>
                )}
              </div>

              <button type="submit" className="login-submit login-submit-light fp-submit" disabled={loading}>
                {loading ? (
                  <><div className="spinner-sm spinner-sm-dark" /> Menyimpan...</>
                ) : (
                  'Simpan Password Baru'
                )}
              </button>
            </form>
          </>
        )}

        {/* Back to login */}
        <Link to="/login" className="fp-back">
          <IconArrowLeft />
          Kembali ke Login
        </Link>
      </div>
    </div>
  );
};

export default ResetPassword;
