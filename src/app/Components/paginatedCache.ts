
type CacheEntry<T> = {
  data: T;
  timestamp: number;
};

class PaginatedCacheManager {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private ttlMs: number;

  /**
   * @param ttlMs Time-to-live in milliseconds. Default: 5 minutes.
   *              Set to 0 to disable TTL (items never expire).
   */
  constructor(ttlMs = 5 * 60 * 1000) {
    this.ttlMs = ttlMs;
  }

  private buildKey(namespace: string, search: string, page: number): string {
    return `${namespace}::${search}::${page}`;
  }

  /** Returns cached data for this namespace/search/page, or null if missing/expired. */
  get<T>(namespace: string, search: string, page: number): T | null {
    const key = this.buildKey(namespace, search, page);
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    if (this.ttlMs > 0 && Date.now() - entry.timestamp > this.ttlMs) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  /** Stores data for this namespace/search/page. */
  set<T>(namespace: string, search: string, page: number, data: T): void {
    const key = this.buildKey(namespace, search, page);
    this.store.set(key, { data, timestamp: Date.now() });
  }

  /** Returns true if a valid (non-expired) cache entry exists. */
  has(namespace: string, search: string, page: number): boolean {
    return this.get(namespace, search, page) !== null;
  }

  /**
   * Clears cache entries.
   * - clear(namespace)          → clears ALL pages & searches for that namespace
   * - clear(namespace, search)  → clears all pages for that specific search
   */
  clear(namespace: string, search?: string): void {
    const prefix = search !== undefined
      ? `${namespace}::${search}::`
      : `${namespace}::`;

    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  /** Clears everything in the cache. */
  clearAll(): void {
    this.store.clear();
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
// One global instance shared by all slices.
// Each slice uses its own namespace string to avoid collisions.
export const paginatedCache = new PaginatedCacheManager();

// ─── Namespace constants (add one per module) ────────────────────────────────
export const CACHE_NS = {
  MIXBOX_ITEMS: 'mixbox_items',
  // Add more as needed:
  // ADDON_ITEMS:   'addon_items',
  // CATEGORY_ITEMS: 'category_items',
} as const;