import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import logo from '../assets/logo.png';
import './Login.css';
import './ForgotPassword.css';

/* ─── Icons ──────────────────────────────────────────── */
const IconUser = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const IconArrowLeft = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12"/>
    <polyline points="12 19 5 12 12 5"/>
  </svg>
);

const IconCopy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const IconCheck = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

/* ─── ForgotPassword Page ────────────────────────────── */
const ForgotPassword = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null); // { resetToken, expiresAt }
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      toast.error('Username wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { username: username.trim() });
      if (res.data.success) {
        if (res.data.resetToken) {
          setResult({ resetToken: res.data.resetToken, expiresAt: res.data.expiresAt });
          toast.success('Token reset berhasil dibuat');
        } else {
          toast.success(res.data.message);
          setResult({ info: true });
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result?.resetToken) return;
    navigator.clipboard.writeText(result.resetToken).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const resetLink = result?.resetToken
    ? `${window.location.origin}/reset-password/${result.resetToken}`
    : null;

  return (
    <div className="login-page">
      <div className="fp-shell">
        {/* Header */}
        <div className="fp-logo">
          <img src={logo} alt="Algoods" />
          <span>Algoods</span>
        </div>

        {!result ? (
          /* ── Step 1: Input username ── */
          <>
            <div className="fp-icon-wrap">
              <div className="fp-icon-circle">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#3b82f6"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
            </div>

            <div className="fp-heading">
              <h1>Lupa Password?</h1>
              <p>Masukkan username akun Anda. Token reset akan dibuat dan dapat dibagikan ke administrator.</p>
            </div>

            <form onSubmit={handleSubmit} className="fp-form" autoComplete="off">
              <div className="fp-field">
                <label className="fp-label">Username</label>
                <div className="login-input-wrap">
                  <span className="fp-input-icon"><IconUser /></span>
                  <input
                    type="text"
                    className="login-input login-input-light fp-input"
                    placeholder="Masukkan username Anda"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className="login-submit login-submit-light fp-submit" disabled={loading}>
                {loading ? (
                  <><div className="spinner-sm spinner-sm-dark" /> Memproses...</>
                ) : (
                  'Buat Token Reset'
                )}
              </button>
            </form>
          </>
        ) : result.info ? (
          /* ── Step 1b: Username not found (generic message) ── */
          <div className="fp-success">
            <div className="fp-success-icon fp-success-icon--info">
              <IconCheck />
            </div>
            <h2>Permintaan Dikirim</h2>
            <p>Jika username ditemukan di sistem, token reset telah dibuat. Hubungi administrator untuk mendapatkan token.</p>
          </div>
        ) : (
          /* ── Step 2: Show token ── */
          <div className="fp-success">
            <div className="fp-success-icon">
              <IconCheck />
            </div>
            <h2>Token Berhasil Dibuat</h2>
            <p>Salin token di bawah ini dan buka halaman reset password. Token berlaku selama <strong>1 jam</strong>.</p>

            <div className="fp-token-box">
              <span className="fp-token-label">Token Reset</span>
              <div className="fp-token-value">
                <code>{result.resetToken}</code>
                <button
                  type="button"
                  className="fp-copy-btn"
                  onClick={handleCopy}
                  title="Salin token"
                >
                  {copied ? <IconCheck /> : <IconCopy />}
                </button>
              </div>
            </div>

            <Link
              to={`/reset-password/${result.resetToken}`}
              className="login-submit login-submit-light fp-submit fp-submit-link"
            >
              Lanjut Reset Password →
            </Link>
          </div>
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

export default ForgotPassword;
