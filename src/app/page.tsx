'use client';
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { jwtLoginSuccess, initializeAuth } from '../features/authSlice';
import { useRouter } from 'next/navigation';
import { AppDispatch, RootState } from '@/redux/store';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { setSnackbarMessage, setSnackbarOpen } from "../features/authSlice";

const Login: React.FC = () => {

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [rememberMe, setRememberMe] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const { isLoggedIn } = useSelector((state: RootState) => state.auth);
  const router = useRouter();

  useEffect(() => {
    setIsCheckingSession(false);
  }, []);

  // In your login/page.tsx - SIMPLIFIED
  const handleLogin = async () => {
    if (isLoggingIn) return;

    const trimmedUsername = username.trim();
    const loginPassword = password;
    if (!trimmedUsername || !loginPassword) {
      toast.error("Please enter email or phone number and password");
      return;
    }

    setIsLoggingIn(true);
    // ⭐ ONE browser = ONE session id
    let browserSessionId = localStorage.getItem("browserSessionId");

    if (!browserSessionId) {
      browserSessionId = crypto.randomUUID();
      localStorage.setItem("browserSessionId", browserSessionId);
    }
    try {
      // ✅ CORRECT URL - Call your FastAPI backend on port 8000
      console.log("LOGIN DEBUG", {
        username: trimmedUsername,
        passwordLength: loginPassword.length,
        passwordValue: JSON.stringify(loginPassword),
      });
      const response = await fetch('http://127.0.0.1:8000/purchasetestapi/login', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${trimmedUsername}:${loginPassword}`)}`,
          'x-browser-session-id': browserSessionId,
        },
      });

      if (!response.ok) {
        let msg = "Login failed";

        try {
          const errJson = await response.json();
          msg = errJson.detail || msg;
        } catch {
          msg = await response.text();
        }

        toast.error(msg);
        return;
      }

      const result = await response.json();

      // Save token
      sessionStorage.setItem("accessToken", result.access_token);
      localStorage.setItem("username", result.username);

      localStorage.setItem("userPermissions", JSON.stringify(result.permissions));

      sessionStorage.setItem("accessToken", result.access_token);
      sessionStorage.setItem("username", result.username);
      sessionStorage.setItem("tenant_id", result.tenant_id);
      sessionStorage.setItem("tenantName", result.tenantName || '');
      localStorage.setItem("userRole", result.role_name);
      // 🔥 NEW — TELL REDUX LOGIN SUCCESS
      dispatch(jwtLoginSuccess({
        username: result.username,
        permissions: result.permissions,
        role: result.role_name,
        token: result.access_token,
      }));

      toast.success(
        `${result.role_name || "User"} logged in successfully!`
      );

      window.location.href = "/yen-purchase";

    } catch (error) {
      console.error('Login error:', error);
      toast.error('Network error. Please check if backend is running on port 8000.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleLogin();
  };

  if (isCheckingSession) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="yl-spinner" />
          <p style={{ marginTop: 16, color: '#6B7280' }}>Checking existing sessions...</p>
        </div>
        <style jsx>{`
          .yl-spinner{
            width:48px; height:48px; margin:0 auto;
            border-radius:50%;
            border:4px solid #E5E9ED;
            border-bottom-color:#17A9C9;
            animation:yl-spin 0.8s linear infinite;
          }
          @keyframes yl-spin{ to{ transform:rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  const moduleChips: { label: string; icon: React.ReactNode }[] = [
    {
      label: 'Purchase',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M3 3h2l2.4 12.4a2 2 0 002 1.6h8.2a2 2 0 002-1.6L21 8H6" />
          <circle cx="9" cy="20" r="1" />
          <circle cx="17" cy="20" r="1" />
        </svg>
      ),
    },
    {
      label: 'Inventory',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M21 8l-9-5-9 5 9 5 9-5z" />
          <path d="M3 8v8l9 5 9-5V8" />
          <path d="M12 13v8" />
        </svg>
      ),
    },
    {
      label: 'Recipe Kit',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M4 19h16" />
          <path d="M6 19V9l6-5 6 5v10" />
          <path d="M10 19v-6h4v6" />
        </svg>
      ),
    },
    {
      label: 'Master Admin',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 00.3 1.9l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.9-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.6 1.7 1.7 0 00-1.9.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.9 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.9l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.9.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.9-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.9V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
        </svg>
      ),
    },
    {
      label: 'Reports',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="12" width="4" height="9" />
          <rect x="10" y="6" width="4" height="15" />
          <rect x="17" y="3" width="4" height="18" />
        </svg>
      ),
    },
    {
      label: 'Warehouse',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M4 21V9l8-6 8 6v12" />
          <path d="M9 21v-6h6v6" />
        </svg>
      ),
    },
  ];

  return (
    <div className="yl-page">
      <div className="yl-shell">

        {/* LEFT: BRAND PANEL */}
        <div className="yl-brand">
          <div className="yl-brand-glow-1" />
          <div className="yl-brand-glow-2" />

          <div className="yl-brand-top">
            <div className="yl-logo-badge">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/vmasoft-logo.png" alt="Vmasoft" />
            </div>

            <h1 className="yl-headline">One ERP to run your entire distribution business</h1>
            <p className="yl-subline">Purchase, inventory, recipe kits, master data and reports — all connected, all in real time.</p>

            <div className="yl-modules">
              {moduleChips.map((m) => (
                <div className="yl-module-chip" key={m.label}>
                  {m.icon}
                  <span>{m.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="yl-brand-bottom">© 2026 YenERP. All rights reserved.</div>
        </div>

        {/* RIGHT: FORM PANEL */}
        <div className="yl-form-panel">
          <div className="yl-form-head">
            <h1>Welcome back</h1>
            <p>Sign in to your YenERP workspace to continue.</p>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            <div className="yl-field">
              <label htmlFor="username">Email or Username</label>
              <input
                autoComplete="off"
                type="text"
                id="username"
                placeholder="you@gmail.com"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoggingIn}
              />
            </div>

            <div className="yl-field">
              <label htmlFor="password">Password</label>
              <div className="yl-input-wrap">
                <input
                  autoComplete="off"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoggingIn}
                />
                <button
                  type="button"
                  className="yl-icon-btn"
                  onClick={togglePasswordVisibility}
                  disabled={isLoggingIn}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            </div>

            <div className="yl-row-between">
              <label className="yl-remember">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoggingIn}
                />
                Remember me
              </label>
              <button type="button" className="yl-forgot" onClick={() => router.push("/forgot-password")}>
                Forgot password?
              </button>
            </div>

            <button type="submit" className="yl-btn-primary" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg className="yl-btn-spinner" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing In...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="yl-divider">OR</div>

          <p className="yl-helpdesk">
            Don&apos;t have an account?{' '}
            <button type="button" onClick={() => router.push("/signup")}>Create Account</button>
          </p>

          <p className="yl-foot-note">Secured workspace · YenERP by Vmasoft</p>
        </div>

      </div>

      <style jsx>{`
        .yl-page{
          min-height:100vh;
          width:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:24px;
          background-color:#F4F6F7;
          background-image: radial-gradient(circle, rgba(100,116,139,0.14) 1.4px, transparent 1.4px);
          background-size:24px 24px;
        }
        .yl-shell{
          width:100%;
          max-width:1040px;
          min-height:640px;
          background:#FFFFFF;
          border-radius:20px;
          box-shadow:0 30px 60px -25px rgba(23,60,80,0.25), 0 2px 8px rgba(23,60,80,0.06);
          display:grid;
          grid-template-columns: 1.05fr 1fr;
          overflow:hidden;
        }
        .yl-brand{
          position:relative;
          background: linear-gradient(155deg, #0F7FA0 0%, #17A9C9 38%, #3BC97D 78%, #4EC94B 100%);
          color:#fff;
          padding:44px;
          display:flex;
          flex-direction:column;
          justify-content:space-between;
          overflow:hidden;
        }
        .yl-brand-glow-1{
          position:absolute; right:-120px; top:-120px; width:360px; height:360px; border-radius:50%;
          background:radial-gradient(circle, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 70%);
          pointer-events:none;
        }
        .yl-brand-glow-2{
          position:absolute; left:-100px; bottom:-140px; width:320px; height:320px; border-radius:50%;
          background:radial-gradient(circle, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0) 70%);
          pointer-events:none;
        }
        .yl-brand-top{ position:relative; z-index:2; }
        .yl-logo-badge{
          display:inline-flex; align-items:center;
          background:rgba(255,255,255,0.94);
          border-radius:12px;
          padding:10px 18px;
          margin-bottom:38px;
          box-shadow:0 6px 16px -6px rgba(0,0,0,0.25);
        }
        .yl-logo-badge img{ height:34px; width:auto; display:block; }
        .yl-headline{
          font-family:'Manrope','Inter',sans-serif;
          font-weight:800;
          font-size:31px;
          line-height:1.28;
          max-width:380px;
          margin:0 0 14px;
          color:#ffffff !important;
        }
        .yl-subline{
          font-size:15px;
          line-height:1.6;
          color:rgba(255,255,255,0.88) !important;
          max-width:360px;
          margin:0 0 34px;
        }
        .yl-modules{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:10px;
        }
        .yl-module-chip{
          display:flex;
          align-items:center;
          gap:10px;
          background:rgba(255,255,255,0.12);
          border:1px solid rgba(255,255,255,0.20);
          border-radius:10px;
          padding:11px 12px;
          font-size:13px;
          font-weight:600;
          color:#ffffff !important;
        }
        .yl-module-chip :global(svg){
          width:16px; height:16px; flex-shrink:0; opacity:0.95;
        }
        .yl-brand-bottom{
          position:relative; z-index:2;
          padding-top:28px;
          border-top:1px solid rgba(255,255,255,0.18);
          font-size:12.5px;
          color:rgba(255,255,255,0.85) !important;
        }
        .yl-form-panel{
          padding:52px 56px;
          display:flex;
          flex-direction:column;
          justify-content:center;
        }
        .yl-form-head{ margin-bottom:30px; }
        .yl-form-head h1{
          font-family:'Manrope','Inter',sans-serif;
          font-size:26px;
          font-weight:800;
          color:#25303F;
          margin:0 0 8px;
        }
        .yl-form-head p{ font-size:14px; color:#6B7684; margin:0; }
        .yl-field{ margin-bottom:16px; }
        .yl-field label{
          display:block;
          font-size:12.5px;
          font-weight:600;
          color:#25303F;
          margin-bottom:7px;
        }
        .yl-field :global(input){
          width:100%;
          padding:12.5px 14px;
          font-size:14.5px;
          border:1.5px solid #E5E9ED;
          border-radius:10px;
          outline:none;
          color:#25303F;
          background:#FCFDFD;
          transition:border-color .15s, box-shadow .15s;
          box-sizing:border-box;
          font-family:inherit;
        }
        .yl-field :global(input::placeholder){ color:#A7B0BA; }
        .yl-field :global(input:focus){
          border-color:#38BDF8 !important;
          box-shadow:0 0 0 4px rgba(56,189,248,0.18) !important;
          background:#fff !important;
          outline:none !important;
        }
        .yl-input-wrap{ position:relative; }
        .yl-input-wrap :global(input){ padding-right:44px; }
        .yl-icon-btn{
          position:absolute;
          right:10px; top:50%; transform:translateY(-50%);
          width:28px; height:28px;
          display:flex; align-items:center; justify-content:center;
          background:none; border:none; cursor:pointer;
          color:#9AA4AF;
          border-radius:6px;
          padding:0;
        }
        .yl-icon-btn:hover{ color:#17A9C9; background:#EFF7F9; }
        .yl-icon-btn :global(svg){ width:18px; height:18px; }
        .yl-row-between{
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:24px;
        }
        .yl-remember{
          display:flex; align-items:center; gap:8px;
          font-size:13.5px; color:#6B7684; cursor:pointer;
          user-select:none;
        }
        .yl-remember :global(input){ width:15px; height:15px; accent-color:#17A9C9; cursor:pointer; }
        .yl-forgot{
          background:none; border:none; padding:0; cursor:pointer;
          font-size:13.5px; font-weight:600; color:#17A9C9;
          font-family:inherit;
        }
        .yl-forgot:hover{ text-decoration:underline; }
        .yl-btn-primary{
          width:100%;
          padding:13.5px;
          border:none;
          border-radius:10px;
          background:linear-gradient(95deg, #17A9C9, #4EC94B);
          color:#fff;
          font-size:15px;
          font-weight:700;
          font-family:inherit;
          cursor:pointer;
          box-shadow:0 8px 18px -8px rgba(23,169,201,0.55);
          transition:filter .12s ease, box-shadow .12s ease, transform .12s ease;
          margin-top:4px;
        }
        .yl-btn-primary:hover:not(:disabled){ filter:brightness(1.04); box-shadow:0 10px 22px -8px rgba(23,169,201,0.65); }
        .yl-btn-primary:active:not(:disabled){ transform:translateY(1px); }
        .yl-btn-primary:disabled{ opacity:0.6; cursor:not-allowed; }
        .yl-btn-spinner{ width:20px; height:20px; margin-right:10px; animation:yl-spin2 0.8s linear infinite; }
        .yl-divider{
          display:flex; align-items:center; gap:14px;
          margin:22px 0 18px;
          color:#B6BEC7; font-size:12px; font-weight:600; letter-spacing:0.3px;
        }
        .yl-divider::before, .yl-divider::after{ content:""; flex:1; height:1px; background:#E5E9ED; }
        .yl-helpdesk{ text-align:center; font-size:13px; color:#6B7684; margin:0; }
        .yl-helpdesk :global(button){
          background:none; border:none; padding:0; cursor:pointer;
          color:#17A9C9; font-weight:600; font-size:13px; font-family:inherit;
        }
        .yl-helpdesk :global(button):hover{ text-decoration:underline; }
        .yl-foot-note{ text-align:center; font-size:11.5px; color:#B6BEC7; margin:24px 0 0; }
        @keyframes yl-spin2{ to{ transform:rotate(360deg); } }

        @media (max-width: 880px){
          .yl-shell{ grid-template-columns:1fr; min-height:auto; }
          .yl-brand{ padding:36px 32px; order:1; }
          .yl-headline{ font-size:24px; }
          .yl-form-panel{ padding:40px 32px; order:2; }
        }
        @media (max-width:480px){
          .yl-modules{ grid-template-columns:1fr; }
          .yl-page{ padding:0; }
          .yl-shell{ border-radius:0; box-shadow:none; }
        }
      `}</style>
    </div>
  );
};

export default Login;
