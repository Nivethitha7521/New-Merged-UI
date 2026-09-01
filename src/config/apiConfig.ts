// ============================================================
// Centralized API host configuration.
//
// All backend base URLs used across the app are read from env vars
// (with the current production values as fallback defaults) instead
// of being hardcoded per-file. To point the app at a different
// environment (staging, local backend, etc.), set the corresponding
// NEXT_PUBLIC_* variable in .env.local — no source changes needed.
// ============================================================

export const REPORTS_API_BASE =
  process.env.NEXT_PUBLIC_REPORTS_API_BASE || 'https://yenerp.com/reportstestapi';

export const MASTER_ADMIN_API_BASE =
  process.env.NEXT_PUBLIC_MASTER_ADMIN_API_BASE || 'http://127.0.0.1:8000/yenerpapi';

export const FAST_API_BASE =
  process.env.NEXT_PUBLIC_FAST_API_BASE || 'http://127.0.0.1:8000/yenerpapi';

export const LIVE_API_BASE =
  process.env.NEXT_PUBLIC_LIVE_API_BASE || 'https://yenerp.com/liveapi';
