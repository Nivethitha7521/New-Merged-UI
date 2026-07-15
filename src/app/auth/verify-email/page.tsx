'use client';
import React, { Suspense, useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

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

  const inputClass = "w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-800 placeholder-gray-400";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
        {status === 'loading' && <p className="text-gray-600">Verifying your email...</p>}

        {/* ── Step 1: Verified, password not set yet → show password form ── */}
        {status === 'success' && !passwordSet && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">Email Verified!</h1>
            <p className="text-gray-500 text-sm mb-6">Create a password to activate your account</p>

            <form onSubmit={handleSetPassword} className="space-y-4 text-left">
            <div className="relative">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>

              {/* ── Live password strength checklist ── */}
              {password.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-1.5">
                  <PasswordCheckItem met={passwordChecks.length} label="At least 8 characters" />
                  <PasswordCheckItem met={passwordChecks.uppercase} label="One uppercase letter (A-Z)" />
                  <PasswordCheckItem met={passwordChecks.lowercase} label="One lowercase letter (a-z)" />
                  <PasswordCheckItem met={passwordChecks.number} label="One number (0-9)" />
                  <PasswordCheckItem met={passwordChecks.special} label="One special character (!@#$% etc.)" />
                </div>
              )}

              <div className="relative">
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div>

              {confirmPassword.length > 0 && !passwordsMatch && (
                <p className="text-xs text-red-600 -mt-2">Passwords do not match</p>
              )}

              <button
                type="submit"
                disabled={submitting || !isPasswordStrong || !passwordsMatch}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-lg font-semibold text-sm hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Setting Password...' : 'Set Password & Activate'}
              </button>
            </form>
          </>
        )}

        {/* ── Step 2: Password set → final success screen ── */}
        {status === 'success' && passwordSet && (
          <>
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-green-600 mb-3">Account Activated 🎉</h1>
            <p className="text-gray-600 mb-6">
              Your organization is now active. You can sign in with your new password.
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700"
            >
              Go to Login
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <h1 className="text-2xl font-bold text-red-600 mb-3">Verification Failed</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-gray-600 text-white py-2.5 rounded-lg font-medium hover:bg-gray-700"
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
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-600' : 'text-gray-400'}`}>
      {met ? (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="9" strokeWidth={2} />
        </svg>
      )}
      <span>{label}</span>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-gray-600">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}