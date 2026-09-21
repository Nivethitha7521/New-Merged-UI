/**
 * YEN ERP — global feedback bus (toasts + confirm dialogs)
 * ---------------------------------------------------------
 * A tiny framework-agnostic bridge so ANY code (React components, Redux thunks,
 * axios interceptors, plain helpers) can call:
 *
 *     notify.success('Vehicle saved');
 *     notify.error(error);                       // Error | string | { message }
 *     const ok = await confirmAction({ message: 'Delete this vehicle?', tone: 'danger' });
 *
 * <FeedbackProvider> (mounted once in app/layout.tsx) registers itself here.
 * Calls made before the provider mounts are queued, and calls made on the
 * server are ignored, so nothing can crash during SSR / tests.
 */
import React from 'react';

export type NotifyType = 'success' | 'error' | 'warning' | 'info';
export type ConfirmTone = 'primary' | 'danger' | 'warning' | 'success';

export interface NotifyAction {
  label: string;
  onClick: () => void;
}

export interface NotifyOptions {
  /** Optional bold heading above the message. */
  title?: string;
  /** Milliseconds. 0 = stays until the user closes it. Defaults per type. */
  duration?: number;
  /** Re-using an id updates the existing toast instead of stacking a new one. */
  id?: string;
  /** Optional inline action button (e.g. "Undo"). */
  action?: NotifyAction;
}

export interface ConfirmOptions {
  title?: React.ReactNode;
  message: React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
  /** Alert-style dialog with a single button. */
  hideCancel?: boolean;
  /**
   * Optional work to run while the dialog shows a spinner (e.g. the API call).
   * The promise from confirmAction() resolves true after it finishes.
   * If it throws, the dialog closes, an error toast is shown and false is returned.
   */
  onConfirm?: () => void | Promise<void>;
}

export interface FeedbackHost {
  notify: (message: React.ReactNode, type: NotifyType, options?: NotifyOptions) => string;
  dismiss: (id?: string) => void;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

let host: FeedbackHost | null = null;
const pending: Array<(h: FeedbackHost) => void> = [];
let seq = 0;

export const nextFeedbackId = (): string => `yen-fb-${Date.now().toString(36)}-${++seq}`;

export function registerFeedbackHost(h: FeedbackHost): void {
  host = h;
  while (pending.length) {
    const job = pending.shift();
    job?.(h);
  }
}

export function unregisterFeedbackHost(h: FeedbackHost): void {
  if (host === h) host = null;
}

const isBrowser = (): boolean => typeof window !== 'undefined';

/** Turns Error | string | { message } | unknown into something printable. */
export function toMessage(input: unknown, fallback = 'Something went wrong. Please try again.'): React.ReactNode {
  if (input === null || input === undefined || input === '') return fallback;
  if (typeof input === 'string' || typeof input === 'number') return String(input);
  if (React.isValidElement(input)) return input;
  if (input instanceof Error) return input.message || fallback;
  if (typeof input === 'object') {
    const o = input as Record<string, unknown>;
    const nested = (o.response as Record<string, unknown> | undefined)?.data as
      | Record<string, unknown>
      | undefined;
    const candidates = [nested?.detail, nested?.message, o.detail, o.message, o.error];
    for (const c of candidates) {
      if (typeof c === 'string' && c.trim()) return c;
    }
  }
  return fallback;
}

function send(message: unknown, type: NotifyType, options?: NotifyOptions): string {
  if (!isBrowser()) return options?.id ?? nextFeedbackId();
  const node = toMessage(message);
  // Host mounted: let it assign the id (so duplicate-suppression still applies).
  if (host) return host.notify(node, type, options);
  // Host not mounted yet: queue, and hand the caller a stable id right away.
  const id = options?.id ?? nextFeedbackId();
  const opts: NotifyOptions = { ...options, id };
  pending.push((h) => h.notify(node, type, opts));
  return id;
}

export interface NotifyFn {
  (message: unknown, type?: NotifyType, options?: NotifyOptions): string;
  success: (message: unknown, options?: NotifyOptions) => string;
  error: (message: unknown, options?: NotifyOptions) => string;
  warning: (message: unknown, options?: NotifyOptions) => string;
  info: (message: unknown, options?: NotifyOptions) => string;
  dismiss: (id?: string) => void;
}

export const notify: NotifyFn = Object.assign(
  (message: unknown, type: NotifyType = 'info', options?: NotifyOptions) => send(message, type, options),
  {
    success: (message: unknown, options?: NotifyOptions) => send(message, 'success', options),
    error: (message: unknown, options?: NotifyOptions) => send(message, 'error', options),
    warning: (message: unknown, options?: NotifyOptions) => send(message, 'warning', options),
    info: (message: unknown, options?: NotifyOptions) => send(message, 'info', options),
    dismiss: (id?: string) => {
      if (host) host.dismiss(id);
    },
  },
);

/** Promise-based confirmation. Resolves true (confirmed) / false (cancelled). */
export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  if (!isBrowser()) return Promise.resolve(false);
  if (host) return host.confirm(options);
  return new Promise<boolean>((resolve) => {
    pending.push((h) => {
      h.confirm(options).then(resolve);
    });
  });
}
