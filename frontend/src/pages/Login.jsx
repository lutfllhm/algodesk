import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { setAuth, isAuthenticated } from '../utils/auth';
import logo from '../assets/logo.png';
import './Login.css';

const Illustration = () => (
  <svg className="login-illus" viewBox="0 0 860 660" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
      <linearGradient id="ilBg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5b4fcf" />
        <stop offset="100%" stopColor="#00c6ff" />
      </linearGradient>
      <linearGradient id="ilPlatform" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a9fd4" />
        <stop offset="100%" stopColor="#0d7aad" />
      </linearGradient>
      <linearGradient id="ilPlatformSide" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#0d7aad" />
        <stop offset="100%" stopColor="#085a82" />
      </linearGradient>
      <linearGradient id="ilPhone" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1a1a3e" />
        <stop offset="100%" stopColor="#0d0d2b" />
      </linearGradient>
      <linearGradient id="ilScreen" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e040fb" />
        <stop offset="100%" stopColor="#ff6090" />
      </linearGradient>
      <linearGradient id="ilChart" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0%" stopColor="#00e5ff" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#00e5ff" stopOpacity="0.9" />
      </linearGradient>
      <linearGradient id="ilBlock1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1fc8e3" />
        <stop offset="100%" stopColor="#0fa8c8" />
      </linearGradient>
      <linearGradient id="ilBlock2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1aafcc" />
        <stop offset="100%" stopColor="#0d8faa" />
      </linearGradient>
      <linearGradient id="ilCard1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e040fb" />
        <stop offset="100%" stopColor="#c020d0" />
      </linearGradient>
      <linearGradient id="ilCard2" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#00e5ff" />
        <stop offset="100%" stopColor="#00b8d4" />
      </linearGradient>
      <filter id="ilShadow" x="-30%" y="-30%" width="160%" height="160%">
        <feDropShadow dx="0" dy="12" stdDeviation="14" floodColor="#041028" floodOpacity="0.4" />
      </filter>
      <filter id="ilGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#00e5ff" floodOpacity="0.5" />
      </filter>
    </defs>

    {/* Background */}
    <rect width="860" height="660" fill="url(#ilBg)" />

    {/* Decorative dots top-right */}
    {[0,1,2,3,4].map(col => [0,1,2,3,4].map(row => (
      <circle key={`d${col}${row}`} cx={680 + col * 18} cy={60 + row * 18}
        r="2.5" fill="#ffffff" opacity="0.18" />
    )))}

    {/* ── Main platform (isometric base) ── */}
    {/* Top face */}
    <polygon points="160,430 430,300 700,430 430,560" fill="url(#ilPlatform)" opacity="0.92" />
    {/* Left face */}
    <polygon points="160,430 430,560 430,600 160,470" fill="url(#ilPlatformSide)" opacity="0.85" />
    {/* Right face */}
    <polygon points="700,430 430,560 430,600 700,470" fill="#0a6a96" opacity="0.85" />

    {/* ── Sub-blocks on platform ── */}
    {/* Block left */}
    <polygon points="195,415 310,355 310,395 195,455" fill="#0d8faa" />
    <polygon points="195,415 310,355 370,385 255,445" fill="url(#ilBlock1)" />
    <polygon points="255,445 370,385 370,425 255,485" fill="#0a7a94" />

    {/* Block right */}
    <polygon points="550,415 665,355 665,395 550,455" fill="#0d8faa" />
    <polygon points="550,415 665,355 725,385 610,445" fill="url(#ilBlock2)" />
    <polygon points="610,445 725,385 725,425 610,485" fill="#0a7a94" />

    {/* Small cube far right */}
    <polygon points="660,450 720,420 720,450 660,480" fill="#0a7a94" />
    <polygon points="660,450 720,420 750,435 690,465" fill="#1aafcc" />
    <polygon points="690,465 750,435 750,465 690,495" fill="#085a82" />

    {/* ── Laptop (left area) ── */}
    <g filter="url(#ilShadow)">
      {/* Screen */}
      <rect x="148" y="340" width="130" height="88" rx="6" fill="#0d1b3e" />
      <rect x="154" y="346" width="118" height="76" rx="4" fill="#0a2a5e" />
      {/* Screen content lines */}
      <rect x="162" y="356" width="70" height="7" rx="3" fill="#00e5ff" opacity="0.7" />
      <rect x="162" y="370" width="50" height="5" rx="2.5" fill="#ffffff" opacity="0.3" />
      <rect x="162" y="382" width="90" height="5" rx="2.5" fill="#ffffff" opacity="0.2" />
      <rect x="162" y="394" width="65" height="5" rx="2.5" fill="#ffffff" opacity="0.2" />
      {/* Base */}
      <rect x="138" y="428" width="150" height="8" rx="4" fill="#0d1b3e" />
    </g>

    {/* ── Phone (center, tall) ── */}
    <g filter="url(#ilShadow)">
      {/* Phone body */}
      <rect x="358" y="148" width="144" height="268" rx="22" fill="url(#ilPhone)" />
      {/* Screen area */}
      <rect x="368" y="168" width="124" height="228" rx="16" fill="#0a1535" />
      {/* Notch */}
      <rect x="408" y="158" width="44" height="8" rx="4" fill="#0d0d2b" />
      {/* Screen content - chart */}
      <rect x="376" y="178" width="108" height="68" rx="8" fill="url(#ilScreen)" opacity="0.85" />
      {/* Chart bars */}
      <rect x="384" y="220" width="12" height="20" rx="3" fill="#ffffff" opacity="0.7" />
      <rect x="400" y="210" width="12" height="30" rx="3" fill="#ffffff" opacity="0.85" />
      <rect x="416" y="200" width="12" height="40" rx="3" fill="#ffffff" opacity="0.9" />
      <rect x="432" y="215" width="12" height="25" rx="3" fill="#ffffff" opacity="0.7" />
      <rect x="448" y="205" width="12" height="35" rx="3" fill="#ffffff" opacity="0.8" />
      {/* Lines below chart */}
      <rect x="376" y="256" width="108" height="7" rx="3.5" fill="#ffffff" opacity="0.18" />
      <rect x="376" y="270" width="80" height="7" rx="3.5" fill="#ffffff" opacity="0.12" />
      <rect x="376" y="284" width="95" height="7" rx="3.5" fill="#ffffff" opacity="0.1" />
      <rect x="376" y="298" width="60" height="7" rx="3.5" fill="#ffffff" opacity="0.1" />
      {/* Home indicator */}
      <rect x="408" y="378" width="44" height="5" rx="2.5" fill="#ffffff" opacity="0.25" />
    </g>

    {/* ── Floating card top-right (pink/purple) ── */}
    <g filter="url(#ilShadow)">
      <rect x="570" y="148" width="148" height="80" rx="14" fill="url(#ilCard1)" opacity="0.92" />
      <rect x="584" y="166" width="80" height="9" rx="4.5" fill="#ffffff" opacity="0.85" />
      <rect x="584" y="182" width="60" height="7" rx="3.5" fill="#ffffff" opacity="0.55" />
      <rect x="584" y="196" width="100" height="7" rx="3.5" fill="#ffffff" opacity="0.4" />
      {/* Icon circle */}
      <circle cx="694" cy="178" r="16" fill="#ffffff" opacity="0.2" />
      <rect x="688" y="172" width="12" height="12" rx="3" fill="#ffffff" opacity="0.7" />
    </g>

    {/* ── Floating card mid-right (cyan) ── */}
    <g filter="url(#ilShadow)">
      <rect x="590" y="258" width="148" height="80" rx="14" fill="url(#ilCard2)" opacity="0.88" />
      <rect x="604" y="276" width="90" height="9" rx="4.5" fill="#ffffff" opacity="0.85" />
      <rect x="604" y="292" width="65" height="7" rx="3.5" fill="#ffffff" opacity="0.55" />
      <rect x="604" y="306" width="110" height="7" rx="3.5" fill="#ffffff" opacity="0.4" />
    </g>

    {/* ── Character RIGHT (standing, holding tablet) ── */}
    <g>
      {/* Legs */}
      <rect x="638" y="490" width="14" height="50" rx="7" fill="#1a3a6e" />
      <rect x="656" y="490" width="14" height="50" rx="7" fill="#1a3a6e" />
      {/* Shoes */}
      <ellipse cx="645" cy="540" rx="12" ry="6" fill="#0d1b3e" />
      <ellipse cx="663" cy="540" rx="12" ry="6" fill="#0d1b3e" />
      {/* Body */}
      <rect x="628" y="420" width="52" height="72" rx="14" fill="#e8eaf6" />
      {/* Head */}
      <circle cx="654" cy="404" r="22" fill="#ffcc99" />
      {/* Hair */}
      <path d="M632 398 Q654 378 676 398 Q672 388 654 384 Q636 388 632 398Z" fill="#3d2b1f" />
      {/* Arm holding tablet */}
      <rect x="676" y="438" width="12" height="38" rx="6" fill="#e8eaf6" transform="rotate(-20 682 457)" />
      {/* Tablet */}
      <rect x="688" y="430" width="44" height="58" rx="6" fill="#1a1a3e" />
      <rect x="692" y="436" width="36" height="46" rx="4" fill="#0a2a5e" />
      <rect x="696" y="442" width="28" height="6" rx="3" fill="#00e5ff" opacity="0.8" />
      <rect x="696" y="454" width="20" height="4" rx="2" fill="#ffffff" opacity="0.4" />
      <rect x="696" y="464" width="24" height="4" rx="2" fill="#ffffff" opacity="0.3" />
    </g>

    {/* ── Character LEFT (sitting, with laptop) ── */}
    <g>
      {/* Seat/cube */}
      <polygon points="220,470 290,435 290,475 220,510" fill="#0a7a94" />
      <polygon points="220,470 290,435 320,450 250,485" fill="#1aafcc" />
      <polygon points="250,485 320,450 320,490 250,525" fill="#085a82" />
      {/* Legs */}
      <rect x="248" y="468" width="12" height="38" rx="6" fill="#1a3a6e" />
      <rect x="266" y="468" width="12" height="38" rx="6" fill="#1a3a6e" />
      {/* Body */}
      <rect x="236" y="400" width="52" height="70" rx="14" fill="#b2dfdb" />
      {/* Head */}
      <circle cx="262" cy="384" r="22" fill="#ffcc99" />
      {/* Hijab */}
      <path d="M240 384 Q262 358 284 384 Q284 408 262 414 Q240 408 240 384Z" fill="#80cbc4" />
      <ellipse cx="262" cy="406" rx="26" ry="10" fill="#80cbc4" />
      {/* Arm */}
      <rect x="284" y="418" width="12" height="36" rx="6" fill="#b2dfdb" transform="rotate(15 290 436)" />
    </g>

    {/* ── Shield icon on platform ── */}
    <g filter="url(#ilGlow)" opacity="0.9">
      <path d="M430 490 L410 500 L410 520 Q410 535 430 542 Q450 535 450 520 L450 500 Z"
        fill="#00e5ff" opacity="0.25" />
      <path d="M430 494 L414 503 L414 520 Q414 532 430 538 Q446 532 446 520 L446 503 Z"
        fill="none" stroke="#00e5ff" strokeWidth="2" />
      <path d="M422 518 L428 524 L440 512" stroke="#00e5ff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>

    {/* ── Small floating elements ── */}
    {/* Wifi icon bottom */}
    <g opacity="0.6" transform="translate(390,570)">
      <path d="M20 12 Q20 4 30 4 Q40 4 40 12" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <path d="M23 16 Q23 10 30 10 Q37 10 37 16" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="30" cy="20" r="3" fill="#ffffff" />
    </g>

    {/* Floating dots accent */}
    <circle cx="160" cy="280" r="6" fill="#00e5ff" opacity="0.5" />
    <circle cx="175" cy="265" r="4" fill="#e040fb" opacity="0.5" />
    <circle cx="148" cy="265" r="3" fill="#ffffff" opacity="0.35" />
    <circle cx="720" cy="360" r="5" fill="#00e5ff" opacity="0.4" />
    <circle cx="735" cy="348" r="3" fill="#ffffff" opacity="0.3" />

    {/* Sparkle top-left */}
    <g opacity="0.7" transform="translate(100,180)">
      <line x1="10" y1="0" x2="10" y2="20" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <line x1="0" y1="10" x2="20" y2="10" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
      <line x1="3" y1="3" x2="17" y2="17" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="17" y1="3" x2="3" y2="17" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
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
