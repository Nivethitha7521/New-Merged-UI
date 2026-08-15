'use client';
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";

const RESEND_COOLDOWN_SECONDS = 45;

export default function VerifyOtp() {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();
  const [identifier, setIdentifier] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const storedIdentifier = sessionStorage.getItem("fp_identifier");

    if (!storedIdentifier) {
      toast.error("Please enter your email or mobile number first");
      router.replace("/forgot-password");
      return;
    }
    setIdentifier(storedIdentifier);

    const sentAt = Number(sessionStorage.getItem("fp_otp_sent_at") || 0);
    const elapsed = Math.floor((Date.now() - sentAt) / 1000);
    const remaining = RESEND_COOLDOWN_SECONDS - elapsed;
    if (remaining > 0) setCooldown(remaining);
  }, [router]);

  useEffect(() => {
    if (cooldown <= 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setCooldown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [cooldown]);

  const verifyOtp = async () => {
    if (!identifier) {
      toast.error("Session expired. Please start again.");
      router.replace("/forgot-password");
      return;
    }
    if (!otp.trim()) {
      toast.error("OTP required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `https://yenerp.com/purchasetestapi/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier, otp: otp.trim() }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.detail || "OTP verification failed");
        return;
      }

      toast.success(data.message || "OTP verified");
      sessionStorage.setItem("fp_otp_verified", otp.trim());
      router.push("/forgot-password/new-password");
    } catch {
      toast.error("Server error");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (!identifier || cooldown > 0) return;

    setResending(true);
    try {
      const res = await fetch(
        `https://yenerp.com/purchasetestapi/auth/resend-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.detail || "Could not resend OTP");
        return;
      }

      toast.success(data.message || "OTP resent successfully");
      sessionStorage.setItem("fp_otp_sent_at", Date.now().toString());
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch {
      toast.error("Server error");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT BLUE PANEL */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center text-white p-10">
        <div className="text-center max-w-md">
          <Image
            src="/images/purchaseimage.jpg"
            alt="Verify OTP"
            width={400}
            height={300}
            className="rounded-xl shadow-xl mx-auto mb-8"
          />
          <h2 className="text-3xl font-bold mb-3">Streamline Your Business</h2>
          <p className="opacity-90">
            Manage your operations efficiently with our comprehensive ERP solution
          </p>
        </div>
      </div>

      {/* RIGHT FORM PANEL */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md">

          {/* STEP INDICATOR */}
          <div className="flex items-center justify-center mb-5">
            <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div className="w-12 h-[2px] bg-green-500 mx-2"></div>
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div className="w-12 h-[2px] bg-gray-200 mx-2"></div>
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
              3
            </div>
          </div>

          {/* ICON */}
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
              <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.343 3-3V6a3 3 0 10-6 0v2c0 1.657 1.343 3 3 3z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 11h14v8a2 2 0 01-2 2H7a2 2 0 01-2-2v-8z" />
              </svg>
            </div>
          </div>

          {/* TITLE */}
          <div className="text-center mb-4">
            <h1 className="text-2xl font-bold text-gray-800">Verify OTP</h1>
            <p className="text-gray-500 mt-1">
              OTP sent to your registered email or mobile number
            </p>
          </div>

          {/* ENTER OTP */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter OTP
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                className="flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none tracking-widest text-center"
                placeholder="6-digit OTP"
              />
              <button
                type="button"
                onClick={resendOtp}
                disabled={resending || cooldown > 0}
                className="flex items-center gap-2 px-3 py-2 border border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent whitespace-nowrap"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 15a7 7 0 0011 2l3-3M19 9a7 7 0 00-11-2L5 10" />
                </svg>
                {cooldown > 0 ? `Resend (${cooldown}s)` : "Resend"}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              OTP is valid for 5 minutes and can be used only once.
            </p>
          </div>

          {/* VERIFY BUTTON */}
          <button
            onClick={verifyOtp}
            disabled={loading || !identifier || !otp.trim()}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </button>

          {/* FOOTER */}
          <div className="text-center mt-4">
            <button
              onClick={() => router.push("/")}
              className="text-sm text-gray-500 hover:underline"
            >
              ← Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
