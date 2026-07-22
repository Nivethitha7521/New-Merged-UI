'use client';
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";

export default function ForgotPassword() {
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const sendOtp = async () => {
    const trimmed = identifier.trim();

    if (!trimmed) {
      toast.error("Please enter your registered email or mobile number");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/yenerpapi/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ identifier: trimmed }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(data.detail || "Something went wrong. Please try again.");
        return;
      }

      // Security: backend always returns a generic message, whether or not
      // the account exists — never reveal account existence here.
      toast.success(data.message || "If the account exists, an OTP has been sent.");
      sessionStorage.setItem("fp_identifier", trimmed);
      sessionStorage.setItem("fp_otp_sent_at", Date.now().toString());

      router.push("/forgot-password/verify-otp");
    } catch {
      toast.error("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT BLUE PANEL */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-500 to-blue-600 items-center justify-center text-white p-10">
        <div className="text-center max-w-md">
          <Image
            src="/images/purchaseimage.jpg"
            alt="Reset"
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
        <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">

          {/* STEP INDICATOR */}
          <div className="flex items-center justify-center mb-8">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div className="w-12 h-[2px] bg-gray-200 mx-2"></div>
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div className="w-12 h-[2px] bg-gray-200 mx-2"></div>
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
              3
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Reset Password</h1>
            <p className="text-gray-500 mt-1">
              Enter your registered work email or mobile number to receive an OTP
            </p>
          </div>

          {/* EMAIL OR MOBILE */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registered Email or Mobile Number
            </label>
            <input
              type="text"
              placeholder="Enter your email or mobile number"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendOtp()}
              className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* SEND OTP */}
          <button
            onClick={sendOtp}
            disabled={loading || !identifier.trim()}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>

          {/* FOOTER */}
          <div className="text-center mt-6">
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
