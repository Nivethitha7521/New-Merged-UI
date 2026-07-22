'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import Image from 'next/image';

interface Country {
  name: string;
  code: string;
  iso_code: string;
}

const BACKEND_BASE = 'http://127.0.0.1:8000/yenerpapi/public';

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
  const [imageExists, setImageExists] = useState(true);
  const [checkingImage, setCheckingImage] = useState(false);

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
  // Check if image exists
  useEffect(() => {
    const checkImage = async () => {
      setCheckingImage(true);
      try {
        const response = await fetch('/images/purchaseimage.jpg');
        setImageExists(response.ok);
      } catch (error) {
        setImageExists(false);
      } finally {
        setCheckingImage(false);
      }
    };
    checkImage();
  }, []);

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

    // Auto-verify the moment all 4 digits are filled — no button click needed
// Auto-verify the moment all 4 digits are filled — no button click needed
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

  // Common input class
  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-800 placeholder-gray-400";

  // Common select class
  const selectClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm text-gray-800 bg-white appearance-none cursor-pointer";

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Left Side - Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-black bg-opacity-20"></div>
        <div className="relative z-10 flex flex-col justify-center items-center text-white p-12 w-full">
          <div className="flex justify-center items-center mb-8">
            {!checkingImage && imageExists ? (
              <Image
                alt="Purchase Image"
                className="max-w-md w-full h-auto rounded-lg shadow-2xl object-cover"
                style={{ maxHeight: '400px' }}
                width={500}
                height={400}
                src="/images/purchaseimage.jpg"
                priority
              />
            ) : (
              <div className="max-w-md w-full h-80 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-white bg-opacity-30 rounded-full flex items-center justify-center">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <p className="text-lg font-medium">Welcome to YEN ERP</p>
                  <p className="text-sm opacity-90">Your business management solution</p>
                </div>
              </div>
            )}
          </div>
          <div className="text-center max-w-md">
            <h2 className="text-3xl font-bold mb-4">Streamline Your Business</h2>
            <p className="text-lg opacity-90">Manage your operations efficiently with our comprehensive ERP solution</p>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gray-50 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="bg-white p-8 rounded-xl shadow-lg">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Create Account</h1>
              <p className="text-gray-500 text-sm">Fill in your details to get started</p>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              {/* First Name & Last Name */}
              <div className="grid grid-cols-2 gap-3">
                <input className={inputClass} type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                <input className={inputClass} type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>

              {/* Email */}
              <input className={inputClass} type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />

              {/* Company Name */}
              <input className={inputClass} type="text" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required />

              {/* Country (small) & Mobile (big) - Side by Side */}
              <div className="grid grid-cols-[35%_1fr] gap-3">
                {/* Country - Small width, just name */}
                <div className="relative">
                  <select
                    className={selectClass}
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
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                      <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Mobile - Big width, with "IN +91" prefix */}
                <div className="relative">
                  <input
                    className={`${inputClass} !pl-[85px]`}
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
                  {/* Prefix: "IN +91" */}
                  {selectedCountry && (
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium pointer-events-none select-none">
                      {selectedCountry.iso_code} {selectedCountry.code}
                    </span>
                  )}
                </div>
              </div>

              {/* Send OTP - Appears when mobile typed */}
              {mobile.trim().length > 0 && !otpSent && !otpVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {sendingOtp ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Sending OTP...
                    </span>
                  ) : 'Send OTP'}
                </button>
              )}

              {/* OTP Input + Verify */}
             {/* OTP Input + Verify */}
            {/* OTP Input + Verify */}
              {otpSent && !otpVerified && (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-2">
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
                          className="w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleVerifyOtp()}
                      disabled={verifyingOtp || otp.length < 4}
                      className="flex-1 px-6 h-12 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {verifyingOtp ? (
                        <svg className="animate-spin h-4 w-4 mx-auto" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                      ) : 'Verify'}
                    </button>
                  </div>
                  <div className="text-center">
                    <button type="button" onClick={handleResendOtp} disabled={resendingOtp} className="text-sm text-blue-600 hover:underline disabled:opacity-50">
                      {resendingOtp ? 'Resending...' : "Didn't receive OTP? Resend"}
                    </button>
                  </div>
                </div>
              )}

              {/* Verified */}
              {otpVerified && (
                <div className="flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 px-4 py-2 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  Mobile number verified successfully
                </div>
              )}

              {/* Password */}
              {/* <div className="relative">
                <input className={`${inputClass} pr-12`} type={showPassword ? 'text' : 'password'} placeholder="Create a strong password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div> */}

              {/* Confirm Password */}
              {/* <div className="relative"> */}
                {/* <input className={`${inputClass} pr-12`} type={showConfirmPassword ? 'text' : 'password'} placeholder="Re-enter your password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                  {showConfirmPassword ? <FaEyeSlash size={18} /> : <FaEye size={18} />}
                </button>
              </div> */}

              {/* Create Account */}
              <button type="submit" disabled={signingUp} className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-lg font-semibold text-sm hover:from-blue-600 hover:to-blue-700 disabled:opacity-50">
                {signingUp ? <span className="flex items-center justify-center gap-2"><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Creating Account...</span> : 'Create Account'}
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-600">Already have an account? <button type="button" onClick={() => router.push('/')} className="text-blue-600 font-semibold hover:underline">Sign In</button></p>
            </div>
          </div>
        </div>
      </div>

     {showSuccessDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-8 max-w-md w-full text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-3">Almost There! 🎉</h2>
            <p className="text-gray-600 mb-2">We&apos;ve received your details.</p>
            <p className="text-gray-600 mb-1">To activate your account, please verify your email at:</p>
            <p className="text-blue-600 font-semibold mb-4">{registeredEmail}</p>
            <p className="text-gray-600 text-sm mb-6">
              Click the link in that email to set your password and complete your registration. Your account is not active until this step is done.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={handleResendVerificationEmail}
                disabled={resendingEmail}
                className="w-full border border-blue-600 text-blue-600 py-2.5 rounded-lg font-medium hover:bg-blue-50 disabled:opacity-50"
              >
                {resendingEmail ? 'Resending...' : 'Resend Verification Email'}
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Signup;