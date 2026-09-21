'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import ConfirmDialogView from './ConfirmDialogView';
import {
  ConfirmOptions,
  FeedbackHost,
  NotifyFn,
  NotifyOptions,
  NotifyType,
  confirmAction,
  nextFeedbackId,
  notify as globalNotify,
  registerFeedbackHost,
  toMessage,
  unregisterFeedbackHost,
} from './feedbackBus';
import { CloseIcon, ErrorIcon, InfoIcon, SuccessIcon, WarningIcon } from './feedbackIcons';

/* ------------------------------------------------------------------ */
/* Toast model                                                         */
/* ------------------------------------------------------------------ */

interface ToastData {
  id: string;
  type: NotifyType;
  message: React.ReactNode;
  title?: string;
  duration: number;
  action?: NotifyOptions['action'];
  /** Changes every time the toast is (re)shown, restarting timer + progress bar. */
  stamp: number;
}

const DEFAULT_DURATION: Record<NotifyType, number> = {
  success: 3000,
  info: 4000,
  warning: 5000,
  error: 6000, // errors need reading time
};

const MAX_VISIBLE = 4;
const DUPLICATE_WINDOW_MS = 800;

const ToastIcon: React.FC<{ type: NotifyType }> = ({ type }) => {
  if (type === 'success') return <SuccessIcon />;
  if (type === 'error') return <ErrorIcon />;
  if (type === 'warning') return <WarningIcon />;
  return <InfoIcon />;
};

const ToastItem: React.FC<{ toast: ToastData; onDismiss: (id: string) => void }> = ({
  toast,
  onDismiss,
}) => {
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(toast.duration);
  const startedRef = useRef(0);

  // A re-shown toast (same id, new stamp) gets a fresh timer.
  useEffect(() => {
    remainingRef.current = toast.duration;
  }, [toast.stamp, toast.duration]);

  useEffect(() => {
    if (toast.duration <= 0 || paused) return undefined;
    startedRef.current = Date.now();
    const timer = window.setTimeout(() => onDismiss(toast.id), remainingRef.current);
    return () => {
      window.clearTimeout(timer);
      remainingRef.current = Math.max(0, remainingRef.current - (Date.now() - startedRef.current));
    };
  }, [paused, toast.duration, toast.stamp, toast.id, onDismiss]);

  const assertive = toast.type === 'error' || toast.type === 'warning';

  return (
    <div
      className={`yen-fb-toast yen-fb-tone-${toast.type}`}
      role={assertive ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span className="yen-fb-toast-icon" aria-hidden="true">
        <ToastIcon type={toast.type} />
      </span>

      <div className="yen-fb-toast-copy">
        {toast.title ? <div className="yen-fb-toast-title">{toast.title}</div> : null}
        <div className="yen-fb-toast-message">{toast.message}</div>
        {toast.action ? (
          <button
            type="button"
            className="yen-fb-toast-action"
            onClick={() => {
              toast.action?.onClick();
              onDismiss(toast.id);
            }}
          >
            {toast.action.label}
          </button>
        ) : null}
      </div>

      <button
        type="button"
        className="yen-fb-toast-close"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
      >
        <CloseIcon />
      </button>

      {toast.duration > 0 ? (
        <span
          key={toast.stamp}
          className="yen-fb-toast-progress"
          style={{
            animationDuration: `${toast.duration}ms`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        />
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Confirm model                                                       */
/* ------------------------------------------------------------------ */

interface ActiveConfirm {
  options: ConfirmOptions;
  resolve: (result: boolean) => void;
}

/* ------------------------------------------------------------------ */
/* Provider                                                            */
/* ------------------------------------------------------------------ */

export interface FeedbackContextValue {
  notify: NotifyFn;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue>({
  // Safe fallback: components rendered outside the provider (tests, storybook)
  // still work through the global bus instead of crashing.
  notify: globalNotify,
  confirm: confirmAction,
});

export const FeedbackProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  const [mounted, setMounted] = useState(false);
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [activeConfirm, setActiveConfirm] = useState<ActiveConfirm | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const recentRef = useRef<Map<string, number>>(new Map());
  const activeRef = useRef<ActiveConfirm | null>(null);
  const queueRef = useRef<ActiveConfirm[]>([]);

  useEffect(() => setMounted(true), []);

  /* ---- toasts ---- */

  const dismiss = useCallback((id?: string) => {
    setToasts((prev) => (id ? prev.filter((t) => t.id !== id) : []));
  }, []);

  const notifyImpl = useCallback(
    (message: React.ReactNode, type: NotifyType, options?: NotifyOptions): string => {
      const id = options?.id ?? nextFeedbackId();

      // Ignore accidental duplicates (double clicks, React strict-mode, retries).
      if (!options?.id && typeof message === 'string') {
        const key = `${type}:${message}`;
        const now = Date.now();
        const last = recentRef.current.get(key);
        if (last && now - last < DUPLICATE_WINDOW_MS) return id;
        recentRef.current.set(key, now);
        if (recentRef.current.size > 50) recentRef.current.clear();
      }

      const next: ToastData = {
        id,
        type,
        message,
        title: options?.title,
        action: options?.action,
        duration: options?.duration ?? DEFAULT_DURATION[type],
        stamp: Date.now() + Math.random(),
      };

      setToasts((prev) => {
        const exists = prev.some((t) => t.id === id);
        const list = exists ? prev.map((t) => (t.id === id ? next : t)) : [...prev, next];
        return list.length > MAX_VISIBLE ? list.slice(list.length - MAX_VISIBLE) : list;
      });
      return id;
    },
    [],
  );

  /* ---- confirms (queued, one at a time) ---- */

  const showConfirm = useCallback((item: ActiveConfirm | null) => {
    activeRef.current = item;
    setActiveConfirm(item);
  }, []);

  const finishConfirm = useCallback(
    (result: boolean) => {
      const item = activeRef.current;
      if (!item) return;
      item.resolve(result);
      showConfirm(queueRef.current.shift() ?? null);
    },
    [showConfirm],
  );

  const confirmImpl = useCallback(
    (options: ConfirmOptions): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        const item: ActiveConfirm = { options, resolve };
        if (activeRef.current) queueRef.current.push(item);
        else showConfirm(item);
      }),
    [showConfirm],
  );

  const handleConfirm = useCallback(async () => {
    const item = activeRef.current;
    if (!item || confirmBusy) return;
    const work = item.options.onConfirm;
    if (!work) {
      finishConfirm(true);
      return;
    }
    setConfirmBusy(true);
    try {
      await work();
      setConfirmBusy(false);
      finishConfirm(true);
    } catch (err) {
      setConfirmBusy(false);
      notifyImpl(toMessage(err), 'error');
      finishConfirm(false);
    }
  }, [confirmBusy, finishConfirm, notifyImpl]);

  /* ---- register with the global bus ---- */

  useEffect(() => {
    const host: FeedbackHost = { notify: notifyImpl, dismiss, confirm: confirmImpl };
    registerFeedbackHost(host);
    return () => {
      unregisterFeedbackHost(host);
      // Never leave a caller awaiting forever.
      activeRef.current?.resolve(false);
      queueRef.current.forEach((q) => q.resolve(false));
      activeRef.current = null;
      queueRef.current = [];
    };
  }, [notifyImpl, dismiss, confirmImpl]);

  const value = useMemo<FeedbackContextValue>(() => {
    const boundNotify = Object.assign(
      (message: unknown, type: NotifyType = 'info', options?: NotifyOptions) =>
        notifyImpl(toMessage(message), type, options),
      {
        success: (m: unknown, o?: NotifyOptions) => notifyImpl(toMessage(m), 'success', o),
        error: (m: unknown, o?: NotifyOptions) => notifyImpl(toMessage(m), 'error', o),
        warning: (m: unknown, o?: NotifyOptions) => notifyImpl(toMessage(m), 'warning', o),
        info: (m: unknown, o?: NotifyOptions) => notifyImpl(toMessage(m), 'info', o),
        dismiss,
      },
    ) as NotifyFn;
    return { notify: boundNotify, confirm: confirmImpl };
  }, [notifyImpl, dismiss, confirmImpl]);

  const opts = activeConfirm?.options;

  return (
    <FeedbackContext.Provider value={value}>
      {children}

      {mounted
        ? createPortal(
            <div className="yen-fb-toast-host" aria-live="polite" aria-atomic="false">
              {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
              ))}
            </div>,
            document.body,
          )
        : null}

      <ConfirmDialogView
        open={Boolean(activeConfirm)}
        title={opts?.title}
        message={opts?.message}
        confirmText={opts?.confirmText}
        cancelText={opts?.cancelText}
        tone={opts?.tone}
        hideCancel={opts?.hideCancel}
        loading={confirmBusy}
        onConfirm={handleConfirm}
        onCancel={() => finishConfirm(false)}
      />
    </FeedbackContext.Provider>
  );
};

/** const { notify, confirm } = useFeedback(); */
export const useFeedback = (): FeedbackContextValue => useContext(FeedbackContext);
/** const notify = useNotify(); notify.success('Saved'); */
export const useNotify = (): NotifyFn => useContext(FeedbackContext).notify;
/** const confirm = useConfirm(); if (await confirm({ message: '…' })) { … } */
export const useConfirm = (): FeedbackContextValue['confirm'] => useContext(FeedbackContext).confirm;

export default FeedbackProvider;
