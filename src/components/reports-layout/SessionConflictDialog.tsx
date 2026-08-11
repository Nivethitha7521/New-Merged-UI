'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { HiOutlineExclamationTriangle } from 'react-icons/hi2';

interface SessionConflictDialogProps {
  open: boolean;
  username: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const SessionConflictDialog: React.FC<SessionConflictDialogProps> = ({
  open,
  username,
  onCancel,
  onConfirm,
}) => {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onCancel]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={`fixed inset-0 z-[130] flex items-end justify-center p-4 transition-all duration-200 sm:items-center ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close session conflict dialog"
        className={`absolute inset-0 bg-slate-950/45 backdrop-blur-md transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onCancel}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="session-conflict-title"
        className={`relative z-10 w-full max-w-lg rounded-[28px] border border-white/50 bg-white/95 p-6 shadow-2xl shadow-slate-900/20 transition-all duration-200 sm:p-7 ${
          open ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-6 opacity-0 sm:scale-95'
        }`}
      >
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <HiOutlineExclamationTriangle size={22} />
          </div>

          <div>
            <h2 id="session-conflict-title" className="text-lg font-semibold text-slate-900">
              This account is already active in another session.
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              <span className="font-semibold text-slate-700">{username}</span> is already logged in
              elsewhere. Do you want to end the previous session and continue here?
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/15 transition hover:bg-slate-800"
          >
            Logout Previous Session
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default SessionConflictDialog;
