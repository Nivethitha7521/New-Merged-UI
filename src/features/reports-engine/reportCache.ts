interface CacheEntry<T> {
  expiresAt: number;
  lastAccessedAt: number;
  value: T;
}

interface CacheOptions {
  namespace: string;
  key: string;
  ttlMs: number;
  maxEntries: number;
}

const STORAGE_PREFIX = 'erp-report-cache:v1';
const memoryCache = new Map<string, CacheEntry<unknown>>();
const inFlightRequests = new Map<string, Promise<unknown>>();

const isBrowser = () => typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';

const buildStorageKey = (namespace: string, key: string) => `${STORAGE_PREFIX}:${namespace}:${key}`;

const readFromSession = <T>(storageKey: string): CacheEntry<T> | null => {
  if (!isBrowser()) return null;

  try {
    const raw = window.sessionStorage.getItem(storageKey);
    if (!raw) return null;

    return JSON.parse(raw) as CacheEntry<T>;
  } catch {
    window.sessionStorage.removeItem(storageKey);
    return null;
  }
};

const writeToSession = <T>(storageKey: string, entry: CacheEntry<T>) => {
  if (!isBrowser()) return;

  try {
    window.sessionStorage.setItem(storageKey, JSON.stringify(entry));
  } catch {
    // Ignore storage quota failures and keep the in-memory cache alive.
  }
};

const removeFromSession = (storageKey: string) => {
  if (!isBrowser()) return;
  window.sessionStorage.removeItem(storageKey);
};

const isExpired = (entry: CacheEntry<unknown>) => entry.expiresAt <= Date.now();

const cleanupNamespace = (namespace: string, maxEntries: number) => {
  const namespacePrefix = `${STORAGE_PREFIX}:${namespace}:`;
  const collected: Array<{ storageKey: string; entry: CacheEntry<unknown> }> = [];

  memoryCache.forEach((entry, storageKey) => {
    if (!storageKey.startsWith(namespacePrefix)) return;

    if (isExpired(entry)) {
      memoryCache.delete(storageKey);
      removeFromSession(storageKey);
      return;
    }

    collected.push({ storageKey, entry });
  });

  if (isBrowser()) {
    for (let index = 0; index < window.sessionStorage.length; index += 1) {
      const storageKey = window.sessionStorage.key(index);
      if (!storageKey || !storageKey.startsWith(namespacePrefix) || memoryCache.has(storageKey)) {
        continue;
      }

      const entry = readFromSession(storageKey);
      if (!entry) continue;

      if (isExpired(entry)) {
        removeFromSession(storageKey);
        continue;
      }

      memoryCache.set(storageKey, entry);
      collected.push({ storageKey, entry });
    }
  }

  if (collected.length <= maxEntries) return;

  collected
    .sort((left, right) => left.entry.lastAccessedAt - right.entry.lastAccessedAt)
    .slice(0, collected.length - maxEntries)
    .forEach(({ storageKey }) => {
      memoryCache.delete(storageKey);
      removeFromSession(storageKey);
    });
};
export const clearAllReportCaches = () => {
  memoryCache.clear();
  inFlightRequests.clear();

  if (typeof window === 'undefined') return;

  const keysToRemove: string[] = [];

  for (let i = 0; i < window.sessionStorage.length; i++) {
    const key = window.sessionStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => window.sessionStorage.removeItem(key));
};
export const getCachedValue = <T>({ namespace, key, maxEntries }: Omit<CacheOptions, 'ttlMs'>) => {
  const storageKey = buildStorageKey(namespace, key);
  const now = Date.now();

  let entry = memoryCache.get(storageKey) as CacheEntry<T> | undefined;
  if (!entry) {
    entry = readFromSession<T>(storageKey) ?? undefined;
    if (entry) {
      memoryCache.set(storageKey, entry);
    }
  }

  if (!entry) return null;

  if (entry.expiresAt <= now) {
    memoryCache.delete(storageKey);
    removeFromSession(storageKey);
    return null;
  }

  const refreshedEntry: CacheEntry<T> = {
    ...entry,
    lastAccessedAt: now,
  };

  memoryCache.set(storageKey, refreshedEntry);
  writeToSession(storageKey, refreshedEntry);
  cleanupNamespace(namespace, maxEntries);
  return refreshedEntry.value;
};

export const setCachedValue = <T>({ namespace, key, ttlMs, maxEntries }: CacheOptions, value: T) => {
  const storageKey = buildStorageKey(namespace, key);
  const entry: CacheEntry<T> = {
    value,
    expiresAt: Date.now() + ttlMs,
    lastAccessedAt: Date.now(),
  };

  memoryCache.set(storageKey, entry);
  writeToSession(storageKey, entry);
  cleanupNamespace(namespace, maxEntries);
};

export const deleteCachedValue = (namespace: string, key: string) => {
  const storageKey = buildStorageKey(namespace, key);
  memoryCache.delete(storageKey);
  removeFromSession(storageKey);
};

export const clearCacheNamespace = (namespace: string) => {
  const namespacePrefix = `${STORAGE_PREFIX}:${namespace}:`;

  Array.from(memoryCache.keys()).forEach((storageKey) => {
    if (storageKey.startsWith(namespacePrefix)) {
      memoryCache.delete(storageKey);
    }
  });

  if (!isBrowser()) return;

  const keysToRemove: string[] = [];
  for (let index = 0; index < window.sessionStorage.length; index += 1) {
    const storageKey = window.sessionStorage.key(index);
    if (storageKey?.startsWith(namespacePrefix)) {
      keysToRemove.push(storageKey);
    }
  }

  keysToRemove.forEach((storageKey) => window.sessionStorage.removeItem(storageKey));
};

export const runWithInFlightDedup = async <T>(cacheKey: string, requestFactory: () => Promise<T>) => {
  const existing = inFlightRequests.get(cacheKey) as Promise<T> | undefined;
  if (existing) return existing;

  const request = requestFactory().finally(() => {
    inFlightRequests.delete(cacheKey);
  });

  inFlightRequests.set(cacheKey, request);
  return request;
};
