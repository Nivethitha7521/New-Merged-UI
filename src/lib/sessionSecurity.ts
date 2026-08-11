'use client';

export const SESSION_TOKEN_KEY = 'erp_session_token';
export const SESSION_USERNAME_KEY = 'erp_session_username';
export const SESSION_EXPIRY_KEY = 'erp_session_expiry';
export const SESSION_TAB_ID_KEY = 'erp_session_tab_id';
export const ACTIVE_LOCK_KEY = 'erp_active_tab_lock';

export const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
export const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000;
export const INACTIVITY_WARNING_MS = 2 * 60 * 1000;
export const LOCK_STALE_MS = 45 * 1000;
export const HEARTBEAT_MS = 15 * 1000;

type Severity = 'success' | 'error' | 'warning' | 'info';

export interface ActiveLock {
  tabId: string;
  username: string;
  lastSeen: number;
}

interface FlashMessage {
  message: string;
  severity: Severity;
}

const FLASH_KEY = 'erp_flash_message';

const canUseDOM = () => typeof window !== 'undefined';

const safeParse = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

export const getOrCreateTabId = () => {
  if (!canUseDOM()) return '';

  const existing = window.sessionStorage.getItem(SESSION_TAB_ID_KEY);
  if (existing) return existing;

  const tabId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  window.sessionStorage.setItem(SESSION_TAB_ID_KEY, tabId);
  return tabId;
};

export const readSessionAuth = () => {
  if (!canUseDOM()) return { token: null, username: '', expiresAt: null };

  return {
    token: window.sessionStorage.getItem(SESSION_TOKEN_KEY),
    username: window.sessionStorage.getItem(SESSION_USERNAME_KEY) || '',
    expiresAt: Number(window.sessionStorage.getItem(SESSION_EXPIRY_KEY) || 0) || null,
  };
};

export const writeSessionAuth = (token: string, username: string, expiresAt = Date.now() + SESSION_TTL_MS) => {
  if (!canUseDOM()) return;

  window.sessionStorage.setItem(SESSION_TOKEN_KEY, token);
  window.sessionStorage.setItem(SESSION_USERNAME_KEY, username);
  window.sessionStorage.setItem(SESSION_EXPIRY_KEY, String(expiresAt));
  getOrCreateTabId();
}
  ;

export const clearSessionAuth = () => {
  if (!canUseDOM()) return;

  window.sessionStorage.removeItem(SESSION_TOKEN_KEY);
  window.sessionStorage.removeItem(SESSION_USERNAME_KEY);
  window.sessionStorage.removeItem(SESSION_EXPIRY_KEY);
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('username');
};

export const readActiveLock = () => {
  if (!canUseDOM()) return null;
  return safeParse<ActiveLock>(window.localStorage.getItem(ACTIVE_LOCK_KEY));
};

export const isLockFresh = (lock: ActiveLock | null) => Boolean(lock && Date.now() - lock.lastSeen < LOCK_STALE_MS);

export const claimActiveLock = (username: string) => {
  if (!canUseDOM()) return;

  const lock: ActiveLock = {
    tabId: getOrCreateTabId(),
    username,
    lastSeen: Date.now(),
  };

  window.localStorage.setItem(ACTIVE_LOCK_KEY, JSON.stringify(lock));
};

export const refreshActiveLock = (username: string) => {
  if (!canUseDOM()) return;

  const currentTabId = getOrCreateTabId();
  const currentLock = readActiveLock();

  if (!currentLock || currentLock.tabId === currentTabId || !isLockFresh(currentLock)) {
    claimActiveLock(username);
  }
};

export const releaseActiveLock = () => {
  if (!canUseDOM()) return;

  const currentTabId = getOrCreateTabId();
  const currentLock = readActiveLock();

  if (currentLock?.tabId === currentTabId) {
    window.localStorage.removeItem(ACTIVE_LOCK_KEY);
  }
};

export const hasFreshForeignLock = () => {
  if (!canUseDOM()) return false;

  const currentTabId = getOrCreateTabId();
  const lock = readActiveLock();
  return Boolean(lock && lock.tabId !== currentTabId && isLockFresh(lock));
};

export const getForeignLockForUsername = (username: string) => {
  if (!canUseDOM() || !username.trim()) return null;

  const currentTabId = getOrCreateTabId();
  const lock = readActiveLock();

  if (!lock || lock.tabId === currentTabId || !isLockFresh(lock)) return null;

  return lock.username.trim().toLowerCase() === username.trim().toLowerCase() ? lock : null;
};

export const canStartProtectedSession = (username?: string) => {
  if (!username?.trim()) return !hasFreshForeignLock();
  return !getForeignLockForUsername(username);
};

export const isSessionExpired = () => {
  const { token, expiresAt } = readSessionAuth();
  if (!token || !expiresAt) return true;
  return Date.now() >= expiresAt;
};

export const extendSessionExpiry = () => {
  if (!canUseDOM()) return;
  const { token } = readSessionAuth();
  if (!token) return;
  window.sessionStorage.setItem(SESSION_EXPIRY_KEY, String(Date.now() + SESSION_TTL_MS));
};

export const setFlashMessage = (message: string, severity: Severity = 'info') => {
  if (!canUseDOM()) return;
  const payload: FlashMessage = { message, severity };
  window.sessionStorage.setItem(FLASH_KEY, JSON.stringify(payload));
};

export const consumeFlashMessage = (): FlashMessage | null => {
  if (!canUseDOM()) return null;

  const payload = safeParse<FlashMessage>(window.sessionStorage.getItem(FLASH_KEY));
  window.sessionStorage.removeItem(FLASH_KEY);
  return payload;
};
