'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface Country {
  name: string;
  code: string;
  iso_code: string;
}

const BACKEND_BASE = 'http://127.0.0.1:8000/purchasetestapi/public';

const Signup: React.FC = () => {
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [mobile, setMobile] = useState('');
  const [countries, setCountries] = useState<Country[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  // const [password, setPassword] = useState('');
  // const [confirmPassword, setConfirmPassword] = useState('');
  // const [showPassword, setShowPassword] = useState(false);
  // const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // OTP flow states
  const [otp, setOtp] = useState('');
   const [otpDigits, setOtpDigits] = useState(['', '', '', '']);
  const otpRefs = [useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null), useRef<HTMLInputElement>(null)];
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [signingUp, setSigningUp] = useState(false);

  // Default countries fallback
  const defaultCountries: Country[] = [
    { name: 'India', code: '+91', iso_code: 'IN' },
    { name: 'United States', code: '+1', iso_code: 'US' },
    { name: 'United Kingdom', code: '+44', iso_code: 'UK' },
    { name: 'Canada', code: '+1', iso_code: 'CA' },
    { name: 'Australia', code: '+61', iso_code: 'AU' },
    { name: 'Singapore', code: '+65', iso_code: 'SG' },
    { name: 'UAE', code: '+971', iso_code: 'AE' },
    { name: 'Germany', code: '+49', iso_code: 'DE' },
    { name: 'France', code: '+33', iso_code: 'FR' },
    { name: 'Japan', code: '+81', iso_code: 'JP' },
  ];
const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [resendingEmail, setResendingEmail] = useState(false);

  const handleResendVerificationEmail = async () => {
    setResendingEmail(true);
    try {
      const body = new URLSearchParams();
      body.append('email', registeredEmail);
      const res = await fetch(`${BACKEND_BASE}/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || 'Failed to resend email');
        return;
      }
      toast.success(data.message);
    } catch {
      toast.error('Network error while resending email');
    } finally {
      setResendingEmail(false);
    }
  };

  // Load country list from backend
  useEffect(() => {
    const loadCountries = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/countries`);
        if (!res.ok) {
          setCountries(defaultCountries);
          const india = defaultCountries.find((c) => c.iso_code === 'IN');
          if (india) setSelectedCountry(india);
          return;
        }
        const data = await res.json();
        if (!Array.isArray(data)) {
          setCountries(defaultCountries);
          const india = defaultCountries.find((c) => c.iso_code === 'IN');
          if (india) setSelectedCountry(india);
          return;
        }
        setCountries(data);
        const india = data.find((c: Country) => c.iso_code === 'IN');
        if (india) setSelectedCountry(india);
      } catch (err) {
        setCountries(defaultCountries);
        const india = defaultCountries.find((c) => c.iso_code === 'IN');
        if (india) setSelectedCountry(india);
      }
    };
    loadCountries();
  }, []);

  const fullPhone = () => `${selectedCountry?.code || ''}${mobile}`;

  const handleSendOtp = async () => {
    if (!mobile.trim() || mobile.trim().length < 6) {
      toast.error('Please enter a valid mobile number');
      return;
    }
    if (!selectedCountry) {
      toast.error('Please select a country first');
      return;
    }
    setSendingOtp(true);
    try {
      const body = new URLSearchParams();
      body.append('phone', fullPhone());

      const res = await fetch(`${BACKEND_BASE}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Failed to send OTP');
        return;
      }

      setOtpSent(true);
      setOtpDigits(['', '', '', '']);
      setOtp('');
      toast.success('OTP sent successfully!');
    } catch (err) {
      toast.error('Network error while sending OTP');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    setResendingOtp(true);
    try {
      const body = new URLSearchParams();
      body.append('phone', fullPhone());

      const res = await fetch(`${BACKEND_BASE}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Failed to resend OTP');
        return;
      }
      setOtpDigits(['', '', '', '']);
      setOtp('');
      toast.success('OTP resent successfully!');
    } catch (err) {
      toast.error('Network error while resending OTP');
    } finally {
      setResendingOtp(false);
    }
  };
const handleOtpDigitChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return; // only single digit allowed

    const newDigits = [...otpDigits];
    newDigits[index] = value;
    setOtpDigits(newDigits);
    const joined = newDigits.join('');
    setOtp(joined);

    // Auto-move to next box
    if (value && index < 3) {
      otpRefs[index + 1].current?.focus();
    }

    // Auto-verify the moment all 4 digits are filled â€” no button click needed
// Auto-verify the moment all 4 digits are filled â€” no button click needed
    if (newDigits.every((d) => d !== '')) {
      otpRefs[index]?.current?.blur();
      handleVerifyOtp(joined);
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (pasted.length === 4) {
      const newDigits = pasted.split('');
      setOtpDigits(newDigits);
      setOtp(pasted);
      otpRefs[3].current?.focus();
      e.preventDefault();
      handleVerifyOtp(pasted);
    }
  };
const handleVerifyOtp = async (otpValue?: string) => {
    const otpToVerify = (otpValue ?? otp).trim();
    if (!otpToVerify) {
      toast.error('Please enter the OTP');
      return;
    }
    setVerifyingOtp(true);
    try {
      const body = new URLSearchParams();
      body.append('phone', fullPhone());
      body.append('otp', otpToVerify);

      const res = await fetch(`${BACKEND_BASE}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Invalid OTP');
        return;
      }

      setOtpVerified(true);
      toast.success('Mobile number verified!');
    } catch (err) {
      toast.error('Network error while verifying OTP');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !companyName.trim()) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!otpVerified) {
      toast.error('Please verify your mobile number first');
      return;
    }
    // if (password !== confirmPassword) {
    //   toast.error('Passwords do not match');
    //   return;
    // }
    // if (password.length < 6) {
    //   toast.error('Password must be at least 6 characters');
    //   return;
    // }

    setSigningUp(true);
    try {
      const body = new URLSearchParams();
      body.append('firstName', firstName.trim());
      body.append('lastName', lastName.trim());
      body.append('companyName', companyName.trim());
      body.append('email', email.trim());
      body.append('countryCode', selectedCountry?.code || '');
      body.append('mobile', mobile.trim());
      // body.append('password', password);

      const res = await fetch(`${BACKEND_BASE}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        toast.error(err.detail || 'Signup failed');
        return;
      }

      const result = await res.json();
      setRegisteredEmail(email.trim());
      setShowSuccessDialog(true);
    } catch (err) {
      toast.error('Network error. Please check if backend is running on port 8000.');
    } finally {
      setSigningUp(false);
    }
  };

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
            <p className="yl-subline">Purchase, inventory, recipe kits, master data and reports â€” all connected, all in real time.</p>

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

        {/* RIGHT: SIGNUP FORM PANEL */}
        <div className="yl-form-panel">
          <div className="yl-form-head">
            <h1>Create Account</h1>
            <p>Fill in your details to get started</p>
          </div>

          <form onSubmit={handleCreateAccount} noValidate>
            <div className="yl-field yl-row-2">
              <div>
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  type="text"
                  placeholder="First Name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  type="text"
                  placeholder="Last Name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="yl-field">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                placeholder="you@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="yl-field">
              <label htmlFor="companyName">Company Name</label>
              <input
                id="companyName"
                type="text"
                placeholder="Vmasoft"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>

            <div className="yl-field">
              <label htmlFor="mobile">Mobile Number</label>
              <div className="yl-row-country-mobile">
                <div className="yl-select-wrap">
                  <select
                    className="yl-select"
                    value={selectedCountry?.iso_code || ''}
                    onChange={(e) => {
                      const country = countries.find((c) => c.iso_code === e.target.value);
                      setSelectedCountry(country || null);
                      setMobile('');
                      setOtpSent(false);
                      setOtpVerified(false);
                      setOtp('');
                    }}
                    disabled={otpVerified}
                    required
                  >
                    <option value="" disabled>Country</option>
                    {countries.map((c) => (
                      <option key={c.iso_code} value={c.iso_code}>
                        {c.name} {c.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="yl-mobile-wrap">
                  <input
                    id="mobile"
                    className="yl-mobile-input"
                    type="tel"
                    placeholder="Mobile Number"
                    value={mobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 15);
                      setMobile(val);
                    }}
                    disabled={otpVerified}
                    required
                  />
                  {selectedCountry && (
                    <span className="yl-mobile-prefix">
                      {selectedCountry.iso_code} {selectedCountry.code}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Send OTP - Appears when mobile typed */}
            {mobile.trim().length > 0 && !otpSent && !otpVerified && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={sendingOtp}
                className="yl-btn-secondary"
              >
                {sendingOtp ? (
                  <span className="yl-btn-loading">
                    <svg className="yl-spinner-icon" viewBox="0 0 24 24">
                      <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none"/>
                      <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Sending OTP...
                  </span>
                ) : 'Send OTP'}
              </button>
            )}

            {/* OTP Input + Verify */}
            {otpSent && !otpVerified && (
              <div className="yl-otp-block">
                <div className="yl-otp-row">
                  <div className="yl-otp-digits">
                    {otpDigits.map((digit, i) => (
                      <input
                        key={i}
                        ref={otpRefs[i]}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpDigitChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        onPaste={handleOtpPaste}
                        className="yl-otp-digit"
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyOtp()}
                    disabled={verifyingOtp || otp.length < 4}
                    className="yl-btn-verify"
                  >
                    {verifyingOtp ? (
                      <svg className="yl-spinner-icon" viewBox="0 0 24 24"><circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none"/><path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                    ) : 'Verify'}
                  </button>
                </div>
                <div className="yl-otp-resend">
                  <button type="button" onClick={handleResendOtp} disabled={resendingOtp} className="yl-link-btn">
                    {resendingOtp ? 'Resending...' : "Didn't receive OTP? Resend"}
                  </button>
                </div>
              </div>
            )}

            {/* Verified */}
            {otpVerified && (
              <div className="yl-verified-banner">
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                Mobile number verified successfully
              </div>
            )}

            <button type="submit" className="yl-btn-primary" disabled={signingUp}>
              {signingUp ? (
                <span className="yl-btn-loading">
                  <svg className="yl-spinner-icon" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4} fill="none"/>
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Creating Account...
                </span>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="yl-helpdesk" style={{ marginTop: 14 }}>
            Already have an account?{' '}
            <button type="button" onClick={() => router.push('/')}>Sign In</button>
          </p>

          <p className="yl-foot-note">Secured workspace · YenERP by Vmasoft</p>
        </div>

      </div>

      {showSuccessDialog && (
        <div className="yl-modal-overlay">
          <div className="yl-modal">
            <h2>Almost There! 🎉</h2>
            <p className="yl-modal-line">We&apos;ve received your details.</p>
            <p className="yl-modal-line">To activate your account, please verify your email at:</p>
            <p className="yl-modal-email">{registeredEmail}</p>
            <p className="yl-modal-note">
              Click the link in that email to set your password and complete your registration. Your account is not active until this step is done.
            </p>
            <div className="yl-modal-actions">
              <button
                onClick={handleResendVerificationEmail}
                disabled={resendingEmail}
                className="yl-btn-outline"
              >
                {resendingEmail ? 'Resending...' : 'Resend Verification Email'}
              </button>
              <button
                onClick={() => router.push('/')}
                className="yl-btn-primary"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .yl-page{
          height:100vh;
          width:100%;
          display:flex;
          align-items:center;
          justify-content:center;
          padding:16px;
          background-color:#F4F6F7;
          background-image: radial-gradient(circle, rgba(100,116,139,0.14) 1.4px, transparent 1.4px);
          background-size:24px 24px;
          box-sizing:border-box;
          overflow:auto;
        }
        .yl-shell{
          width:100%;
          max-width:960px;
          background:#FFFFFF;
          border-radius:18px;
          box-shadow:0 30px 60px -25px rgba(23,60,80,0.25), 0 2px 8px rgba(23,60,80,0.06);
          display:grid;
          grid-template-columns: 1fr 1fr;
          overflow:hidden;
          margin:auto;
        }
        .yl-brand{
          position:relative;
          background: linear-gradient(155deg, #0F7FA0 0%, #17A9C9 38%, #3BC97D 78%, #4EC94B 100%);
          color:#fff;
          padding:28px 32px;
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
          border-radius:10px;
          padding:7px 14px;
          margin-bottom:20px;
          box-shadow:0 6px 16px -6px rgba(0,0,0,0.25);
        }
        .yl-logo-badge img{ height:24px; width:auto; display:block; }
        .yl-headline{
          font-family:'Manrope','Inter',sans-serif;
          font-weight:800;
          font-size:21px;
          line-height:1.25;
          max-width:340px;
          margin:0 0 8px;
          color:#ffffff !important;
        }
        .yl-subline{
          font-size:12.5px;
          line-height:1.5;
          color:rgba(255,255,255,0.88) !important;
          max-width:320px;
          margin:0 0 18px;
        }
        .yl-modules{
          display:grid;
          grid-template-columns: 1fr 1fr;
          gap:7px;
        }
        .yl-module-chip{
          display:flex;
          align-items:center;
          gap:8px;
          background:rgba(255,255,255,0.12);
          border:1px solid rgba(255,255,255,0.20);
          border-radius:8px;
          padding:8px 10px;
          font-size:11.5px;
          font-weight:600;
          color:#ffffff !important;
        }
        .yl-module-chip :global(svg){
          width:14px; height:14px; flex-shrink:0; opacity:0.95;
        }
        .yl-brand-bottom{
          position:relative; z-index:2;
          padding-top:14px;
          margin-top:14px;
          border-top:1px solid rgba(255,255,255,0.18);
          font-size:11px;
          color:rgba(255,255,255,0.85) !important;
        }
        .yl-form-panel{
          padding:28px 34px;
          display:flex;
          flex-direction:column;
          justify-content:center;
          overflow-y:auto;
          max-height:100%;
        }
        .yl-form-head{ margin-bottom:14px; }
        .yl-form-head h1{
          font-family:'Manrope','Inter',sans-serif;
          font-size:20px;
          font-weight:800;
          color:#25303F;
          margin:0 0 4px;
        }
        .yl-form-head p{ font-size:12.5px; color:#6B7684; margin:0; }
        .yl-field{ margin-bottom:9px; }
        .yl-row-2{ display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:9px; }
        .yl-field label, .yl-row-2 label{
          display:block;
          font-size:11.5px;
          font-weight:600;
          color:#25303F;
          margin-bottom:4px;
        }
        .yl-field :global(input), .yl-row-2 :global(input), .yl-select, .yl-mobile-input{
          width:100%;
          padding:9px 12px;
          font-size:13px;
          border:1.5px solid #E5E9ED;
          border-radius:9px;
          outline:none;
          color:#25303F;
          background:#FCFDFD;
          transition:border-color .15s, box-shadow .15s;
          box-sizing:border-box;
          font-family:inherit;
        }
        .yl-field :global(input::placeholder), .yl-row-2 :global(input::placeholder){ color:#A7B0BA; }
        .yl-field :global(input:focus), .yl-row-2 :global(input:focus), .yl-select:focus, .yl-mobile-input:focus{
          border-color:#38BDF8 !important;
          box-shadow:0 0 0 4px rgba(56,189,248,0.18) !important;
          background:#fff !important;
          outline:none !important;
        }
        .yl-field :global(input:disabled), .yl-select:disabled, .yl-mobile-input:disabled{ opacity:0.6; cursor:not-allowed; }

        .yl-row-country-mobile{ display:grid; grid-template-columns:36% 1fr; gap:10px; }
        .yl-select-wrap{ position:relative; }
        .yl-select{
          appearance:none; -webkit-appearance:none; cursor:pointer;
          background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B7684' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>");
          background-repeat:no-repeat;
          background-position:right 10px center;
          background-size:14px;
          padding-right:28px;
        }
        .yl-mobile-wrap{ position:relative; }
        .yl-mobile-input{ padding-left:66px !important; }
        .yl-mobile-prefix{
          position:absolute; left:12px; top:50%; transform:translateY(-50%);
          color:#6B7684; font-size:12.5px; font-weight:600;
          pointer-events:none; user-select:none;
        }

        .yl-btn-secondary{
          width:100%;
          background:#17A9C9;
          color:#fff;
          padding:9px;
          border:none;
          border-radius:9px;
          font-weight:600;
          font-size:12.5px;
          cursor:pointer;
          transition:background-color .15s;
          font-family:inherit;
          margin-bottom:9px;
        }
        .yl-btn-secondary:hover:not(:disabled){ filter:brightness(1.05); }
        .yl-btn-secondary:disabled{ opacity:0.5; cursor:not-allowed; }

        .yl-btn-loading{ display:flex; align-items:center; justify-content:center; gap:8px; }
        .yl-spinner-icon{ width:16px; height:16px; animation:yl-spin2 0.8s linear infinite; }
        @keyframes yl-spin2{ to{ transform:rotate(360deg); } }

        .yl-otp-block{ display:flex; flex-direction:column; gap:8px; margin-bottom:9px; }
        .yl-otp-row{ display:flex; align-items:center; gap:10px; }
        .yl-otp-digits{ display:flex; gap:7px; }
        .yl-otp-digit{
          width:38px; height:38px;
          text-align:center;
          font-size:16px; font-weight:700;
          border:1.5px solid #E5E9ED;
          border-radius:9px;
          outline:none;
          font-family:inherit;
          color:#25303F;
        }
        .yl-otp-digit:focus{
          border-color:#38BDF8 !important;
          box-shadow:0 0 0 4px rgba(56,189,248,0.18) !important;
        }
        .yl-btn-verify{
          flex:1;
          padding:0 18px;
          height:38px;
          background:#17A9C9;
          color:#fff;
          border:none;
          border-radius:9px;
          font-weight:600;
          font-size:12.5px;
          white-space:nowrap;
          cursor:pointer;
          font-family:inherit;
        }
        .yl-btn-verify:hover:not(:disabled){ filter:brightness(1.05); }
        .yl-btn-verify:disabled{ opacity:0.5; cursor:not-allowed; }
        .yl-otp-resend{ text-align:center; }

        .yl-link-btn{
          background:none; border:none; padding:0; cursor:pointer;
          font-size:12px; color:#17A9C9; font-family:inherit; font-weight:600;
        }
        .yl-link-btn:hover:not(:disabled){ text-decoration:underline; }
        .yl-link-btn:disabled{ opacity:0.5; cursor:not-allowed; }

        .yl-verified-banner{
          display:flex; align-items:center; gap:8px;
          color:#15803D;
          font-size:12.5px; font-weight:600;
          background:#EFFDF4;
          padding:8px 12px;
          border-radius:9px;
          margin-bottom:9px;
        }

        .yl-btn-primary{
          width:100%;
          padding:10px;
          border:none;
          border-radius:9px;
          background:linear-gradient(95deg, #17A9C9, #4EC94B);
          color:#fff;
          font-size:13.5px;
          font-weight:700;
          font-family:inherit;
          cursor:pointer;
          box-shadow:0 8px 18px -8px rgba(23,169,201,0.55);
          transition:filter .12s ease, box-shadow .12s ease, transform .12s ease;
          margin-top:2px;
        }
        .yl-btn-primary:hover:not(:disabled){ filter:brightness(1.04); box-shadow:0 10px 22px -8px rgba(23,169,201,0.65); }
        .yl-btn-primary:active:not(:disabled){ transform:translateY(1px); }
        .yl-btn-primary:disabled{ opacity:0.6; cursor:not-allowed; }

        .yl-helpdesk{ text-align:center; font-size:12px; color:#6B7684; margin:0; }
        .yl-helpdesk :global(button){
          background:none; border:none; padding:0; cursor:pointer;
          color:#17A9C9; font-weight:600; font-size:12px; font-family:inherit;
        }
        .yl-helpdesk :global(button):hover{ text-decoration:underline; }
        .yl-foot-note{ text-align:center; font-size:10.5px; color:#B6BEC7; margin:14px 0 0; }

        .yl-modal-overlay{
          position:fixed; inset:0;
          background:rgba(0,0,0,0.5);
          display:flex; align-items:center; justify-content:center;
          z-index:50;
          padding:16px;
        }
        .yl-modal{
          background:#fff;
          border-radius:16px;
          padding:32px;
          max-width:28rem;
          width:100%;
          text-align:center;
        }
        .yl-modal h2{ font-size:22px; font-weight:800; color:#25303F; margin:0 0 12px; font-family:'Manrope','Inter',sans-serif; }
        .yl-modal-line{ color:#6B7684; margin:0 0 8px; font-size:14px; }
        .yl-modal-email{ color:#17A9C9; font-weight:700; margin:0 0 16px; }
        .yl-modal-note{ color:#6B7684; font-size:13px; margin:0 0 24px; }
        .yl-modal-actions{ display:flex; flex-direction:column; gap:8px; }
        .yl-btn-outline{
          width:100%;
          border:1.5px solid #17A9C9;
          color:#17A9C9;
          background:#fff;
          padding:10px;
          border-radius:9px;
          font-weight:600;
          font-size:13.5px;
          cursor:pointer;
          transition:background-color .15s;
          font-family:inherit;
        }
        .yl-btn-outline:hover:not(:disabled){ background:#EFF7F9; }
        .yl-btn-outline:disabled{ opacity:0.5; cursor:not-allowed; }

        @media (max-width: 880px){
          .yl-page{ height:auto; min-height:100vh; overflow:auto; }
          .yl-shell{ grid-template-columns:1fr; max-height:none; }
          .yl-brand{ padding:28px 28px; order:1; }
          .yl-form-panel{ padding:28px 28px; order:2; }
        }
        @media (max-width:480px){
          .yl-modules{ grid-template-columns:1fr; }
          .yl-row-2{ grid-template-columns:1fr; }
          .yl-row-country-mobile{ grid-template-columns:1fr; }
          .yl-page{ padding:0; }
          .yl-shell{ border-radius:0; box-shadow:none; }
        }
      `}</style>
    </div>
  );
};

export default Signup;
