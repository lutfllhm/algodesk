import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { setAuth, isAuthenticated } from '../utils/auth';
import logo from '../assets/logo.png';
import './Login.css';

const Illustration = () => (
  <svg className="login-illus" viewBox="0 0 900 700" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4f46e5" />
        <stop offset="1" stopColor="#22c1f1" />
      </linearGradient>
      <linearGradient id="card" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#0b1022" stopOpacity="0.35" />
        <stop offset="1" stopColor="#0b1022" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
        <stop offset="1" stopColor="#ffffff" stopOpacity="0.05" />
      </linearGradient>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#041028" floodOpacity="0.35" />
      </filter>
    </defs>

    <rect width="900" height="700" rx="0" fill="url(#bg)" />

    {/* Floating UI chips */}
    <g opacity="0.7">
      <rect x="615" y="145" width="145" height="86" rx="14" fill="url(#glass)" />
      <rect x="635" y="168" width="90" height="10" rx="5" fill="#ffffff" opacity="0.7" />
      <rect x="635" y="188" width="70" height="10" rx="5" fill="#ffffff" opacity="0.45" />
      <rect x="602" y="268" width="165" height="108" rx="16" fill="url(#glass)" />
      <rect x="622" y="295" width="110" height="12" rx="6" fill="#ffffff" opacity="0.7" />
      <rect x="622" y="322" width="85" height="12" rx="6" fill="#ffffff" opacity="0.45" />
      <rect x="622" y="349" width="125" height="12" rx="6" fill="#ffffff" opacity="0.3" />
    </g>

    {/* Base platform */}
    <g filter="url(#shadow)">
      <path d="M170 525 L450 405 L780 520 L500 640 Z" fill="url(#card)" />
      <path d="M170 525 L450 405 L780 520" fill="none" stroke="#ffffff" strokeOpacity="0.18" />
    </g>

    {/* Phone */}
    <g filter="url(#shadow)">
      <rect x="468" y="250" width="238" height="362" rx="34" fill="#0b1228" opacity="0.75" />
      <rect x="492" y="282" width="190" height="295" rx="24" fill="url(#glass)" />
      <rect x="545" y="265" width="84" height="10" rx="5" fill="#ffffff" opacity="0.35" />
      <circle cx="587" cy="595" r="12" fill="#ffffff" opacity="0.18" />
      <path d="M515 430 H660" stroke="#ffffff" strokeOpacity="0.35" strokeWidth="10" strokeLinecap="round" />
      <path d="M515 460 H620" stroke="#ffffff" strokeOpacity="0.22" strokeWidth="10" strokeLinecap="round" />
      <path d="M515 490 H645" stroke="#ffffff" strokeOpacity="0.18" strokeWidth="10" strokeLinecap="round" />
    </g>

    {/* Character (simple) */}
    <g filter="url(#shadow)">
      <circle cx="705" cy="410" r="22" fill="#ffffff" opacity="0.85" />
      <path d="M690 440 C700 422 725 422 735 440 L748 487 C750 497 744 508 734 512 L706 525 C696 529 684 524 681 513 L670 470 C668 460 678 447 690 440 Z"
        fill="#ffffff" opacity="0.22" />
      <path d="M712 456 L745 438" stroke="#ffffff" strokeOpacity="0.75" strokeWidth="10" strokeLinecap="round" />
      <rect x="742" y="420" width="54" height="34" rx="10" fill="#111827" opacity="0.35" />
    </g>

    {/* Accent blocks */}
    <g opacity="0.85">
      <rect x="290" y="475" width="120" height="86" rx="18" fill="#0ea5e9" opacity="0.35" />
      <rect x="318" y="505" width="64" height="12" rx="6" fill="#ffffff" opacity="0.55" />
      <rect x="318" y="528" width="80" height="12" rx="6" fill="#ffffff" opacity="0.35" />
    </g>
  </svg>
);

/* ─── SVG Icons ──────────────────────────────────────── */
const IconEye = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const IconEyeOff = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const IconArrow = () => null;

/* ─── Login Page ─────────────────────────────────────── */
const Login = () => {
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated()) navigate('/dashboard');
  }, [navigate]);

  const year = useMemo(() => new Date().getFullYear(), []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.username || !form.password) {
      toast.error('Username dan password wajib diisi');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      if (res.data.success) {
        setAuth(res.data.token, res.data.user);
        toast.success(`Selamat datang, ${res.data.user.full_name}!`);
        navigate('/dashboard');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-shell login-shell-utech">
        {/* Left (form) */}
        <section className="login-left">
          <div className="login-left-inner">
            <div className="login-left-logo">
              <img src={logo} alt="Algoods" className="brand-logo-img" />
              <span>Algoods</span>
            </div>

            <div className="login-left-heading">
              <h1>Welcome to Algoods</h1>
              <p>Sign into your account</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form login-form-utech" autoComplete="off">
              <div className="login-field">
                <label className="login-label sr-only">Username</label>
                <div className="login-input-wrap">
                  <input
                    type="text"
                    className="login-input login-input-light"
                    placeholder="Phone or Email address"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="login-field">
                <label className="login-label sr-only">Password</label>
                <div className="login-input-wrap">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="login-input login-input-light login-input-password"
                    placeholder="Password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="login-input-toggle login-input-toggle-light"
                    onClick={() => setShowPass(!showPass)}
                    aria-label={showPass ? 'Hide password' : 'Show password'}
                  >
                    {showPass ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-submit login-submit-light" disabled={loading}>
                {loading ? (
                  <>
                    <div className="spinner-sm spinner-sm-dark" />
                    Logging in...
                  </>
                ) : (
                  <>Log In</>
                )}
              </button>

              <button type="button" className="login-forgot" disabled>
                Forgot password?
              </button>
            </form>

            <div className="login-left-foot">© {year} Algoods</div>
          </div>
        </section>

        {/* Right (illustration) */}
        <section className="login-right" aria-hidden="true">
          <Illustration />
        </section>
      </div>
    </div>
  );
};

export default Login;
