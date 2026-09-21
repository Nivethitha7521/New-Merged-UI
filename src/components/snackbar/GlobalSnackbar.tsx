'use client';

import React, { useEffect, useState } from 'react';
import {
  FaCheckCircle,
  FaExclamationCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimes,
} from 'react-icons/fa';

interface GlobalSnackbarProps {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
}

const GlobalSnackbar: React.FC<GlobalSnackbarProps> = ({
  open,
  message,
  severity,
  onClose,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!open) return;

    setMounted(true);

    const timer = window.setTimeout(() => {
      setMounted(false);
      window.setTimeout(onClose, 250);
    }, 3200);

    return () => window.clearTimeout(timer);
  }, [open, onClose]);

  const handleClose = () => {
    setMounted(false);
    window.setTimeout(onClose, 250);
  };

  if (!open && !mounted) return null;

  const iconMap = {
    success: <FaCheckCircle className="text-emerald-400" size={15} />,
    error: <FaExclamationCircle className="text-red-400" size={15} />,
    warning: <FaExclamationTriangle className="text-amber-400" size={15} />,
    info: <FaInfoCircle className="text-sky-300" size={15} />,
  };

  return (
    <div
      className="
        fixed z-[99999]
        left-3 right-3 bottom-[calc(env(safe-area-inset-bottom)+14px)]
        sm:left-auto sm:right-5 sm:bottom-5
        flex justify-center sm:justify-end
        pointer-events-none
      "
    >
      <div
        className={`
          pointer-events-auto
          flex w-full max-w-[min(92vw,420px)] items-start gap-3
          rounded-2xl border border-white/10
          bg-slate-950/90 px-4 py-3
          text-white shadow-2xl shadow-black/30 backdrop-blur-xl
          transition-all duration-300 ease-out
          ${mounted ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-3 opacity-0 scale-95'}
        `}
      >
        <div className="mt-0.5 flex-shrink-0">{iconMap[severity]}</div>

        <p className="min-w-0 flex-1 break-words text-[13px] font-medium leading-5 text-white/90 sm:text-sm">
          {message}
        </p>

        <button
          type="button"
          onClick={handleClose}
          className="flex-shrink-0 rounded-lg p-1 text-white/45 transition hover:bg-white/10 hover:text-white"
          aria-label="Close notification"
        >
          <FaTimes size={11} />
        </button>
      </div>
    </div>
  );
};

export default GlobalSnackbar;