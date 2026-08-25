'use client';
import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import './verify-email.css';

const BACKEND_BASE = 'http://127.0.0.1:8000/purchasetestapi/public';


function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams?.get('token') ?? null;

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const hasVerified = useRef(false);   // 👈 guard against StrictMode double-invoke

  // ── Password step state (shown after successful email verification) ──
  const [passwordSet, setPasswordSet] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
 // ── Live password strength checks ──
  const passwordChecks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\/~`;]/.test(password),
  };
  const isPasswordStrong = Object.values(passwordChecks).every(Boolean);
  const passwordsMatch = password.length > 0 && password === confirmPassword;
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    if (hasVerified.current) return;   // 👈 already ran once, skip
    hasVerified.current = true;

    const verify = async () => {
      try {
        const res = await fetch(`${BACKEND_BASE}/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();
        if (!res.ok) {
          setStatus('error');
          setMessage(data.detail || 'Verification failed');
          return;
        }
        setStatus('success');
        setMessage(data.message);
      } catch {
        setStatus('error');
        setMessage('Network error. Please try again.');
      }
    };
    verify();
  }, [token]);

const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isPasswordStrong) {
      toast.error('Please meet all password requirements');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const body = new URLSearchParams();
      body.append('token', token || '');
      body.append('password', password);
      body.append('confirmPassword', confirmPassword);

      const res = await fetch(`${BACKEND_BASE}/set-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.detail || 'Failed to set password');
        return;
      }

      toast.success('Password set successfully!');
      setPasswordSet(true);
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass = "verify-email-input";

  return (
    <div className="verify-email-page">
      <div className="verify-email-card">
        {status === 'loading' && <p className="verify-email-loading">Verifying your email...</p>}

        {/* ── Step 1: Verified, password not set yet → show password form ── */}
        {status === 'success' && !passwordSet && (
          <>
            <div className="verify-email-success-icon">
              <svg className="verify-email-success-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="verify-email-title">Email Verified!</h1>
            <p className="verify-email-subtitle">Create a password to activate your account</p>

            <form onSubmit={handleSetPassword} className="verify-email-form">
            <div className="verify-email-input-wrap">
                <input
                  className={inputClass}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="verify-email-eye-button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>

              {/* ── Live password strength checklist ── */}
              {password.length > 0 && (
                <div className="verify-email-checklist">
                  <PasswordCheckItem met={passwordChecks.length} label="At least 8 characters" />
                  <PasswordCheckItem met={passwordChecks.uppercase} label="One uppercase letter (A-Z)" />
                  <PasswordCheckItem met={passwordChecks.lowercase} label="One lowercase letter (a-z)" />
                  <PasswordCheckItem met={passwordChecks.number} label="One number (0-9)" />
                  <PasswordCheckItem met={passwordChecks.special} label="One special character (!@#$% etc.)" />
                </div>
              )}

              <div className="verify-email-input-wrap">
                <input
                  className={inputClass}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="verify-email-eye-button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>

              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="verify-email-error-text">Passwords do not match</p>
              )}

              <button
                type="submit"
                disabled={submitting || !isPasswordStrong || !passwordsMatch}
                className="verify-email-primary-button"
              >
                {submitting ? 'Setting Password...' : 'Set Password & Activate'}
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: Password set → final success screen ── */}
        {status === 'success' && passwordSet && (
          <>
            <div className="verify-email-success-icon">
              <svg className="verify-email-success-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="verify-email-title verify-email-title--success">Account Activated 🎉</h1>
            <p className="verify-email-message">
              Your organization is now active. You can sign in with your new password.
            </p>
            <button
              onClick={() => router.push('/')}
              className="verify-email-secondary-button"
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="verify-email-title verify-email-title--error">Verification Failed</h1>
            <p className="verify-email-message">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="verify-email-secondary-button verify-email-secondary-button--gray"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function PasswordCheckItem({ met, label }: { met: boolean; label: string }) {
  return (
    <div className={`verify-email-check-item ${met ? 'met' : 'unmet'}`}>
      {met ? (
        <svg className="verify-email-check-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="verify-email-check-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
        </svg>
      )}
      <span>{label}</span>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="verify-email-fallback">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}