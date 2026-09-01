'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineArrowRightOnRectangle } from 'react-icons/hi2';

interface LogoutConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutConfirmDialog: React.FC<LogoutConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[120] flex items-end justify-center p-4 transition-all duration-200 sm:items-center ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close logout confirmation"
        className={`absolute inset-0 bg-slate-950/45 backdrop-blur-md transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        className={`relative z-10 w-full max-w-md rounded-[28px] border border-white/50 bg-white/90 p-6 shadow-2xl shadow-slate-900/20 transition-all duration-200 sm:p-7 ${
          open ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-6 opacity-0 sm:scale-95'
        }`}
      >
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <HiOutlineArrowRightOnRectangle size={22} />
          </div>

          <div>
            <h2 id="logout-dialog-title" className="text-lg font-semibold text-slate-900">
              Are you sure you want to logout?
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Your current session will end and you will be redirected to the login page.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white shadow-lg shadow-rose-600/20 transition hover:bg-rose-700"
          >
            Logout
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default LogoutConfirmDialog;
