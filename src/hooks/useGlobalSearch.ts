import { useEffect, useMemo, useRef, useState } from 'react';
import { searchIndex, ResolvedSearchItem } from '@/config/searchIndex';

const DEBOUNCE_MS = 150;
const MAX_RESULTS = 8;

function scoreItem(item: ResolvedSearchItem, q: string): number {
  const label = item.label.toLowerCase();

  if (label === q) return 100;
  if (label.startsWith(q)) return 85;

  // any word inside the label starts with the query, e.g. "order" matching "Purchase Order"
  const words = label.split(/\s+/);
  if (words.some((w) => w.startsWith(q))) return 70;

  const haystackIndex = item.haystack.indexOf(q);
  if (haystackIndex === 0) return 65;
  if (haystackIndex > -1) return 45 - Math.min(haystackIndex, 20) * 0.5;

  return -1;
}

const typeWeight = { module: 1.5, submodule: 1, field: 0.5 } as const;

/**
 * Pure in-memory search over the static searchIndex array — no fetch, no
 * API, so there's nothing here that can be "slow" or "go down". The only
 * async-feeling part is the debounce, which exists purely to avoid
 * re-scoring the index on every single keystroke while the person is
 * still typing.
 */
export function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  const results = useMemo<ResolvedSearchItem[]>(() => {
    const q = debouncedQuery.toLowerCase();
    if (!q) return [];

    const scored = searchIndex
      .map((item) => ({ item, score: scoreItem(item, q) * typeWeight[item.type] }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score || a.item.label.length - b.item.label.length);

    return scored.slice(0, MAX_RESULTS).map((s) => s.item);
  }, [debouncedQuery]);

  useEffect(() => {
    setActiveIndex(0);
  }, [results]);

  const isSingleConfidentMatch = results.length === 1 && debouncedQuery.length >= 2;

  return {
    query,
    setQuery,
    debouncedQuery,
    results,
    activeIndex,
    setActiveIndex,
    isSingleConfidentMatch,
    reset: () => {
      setQuery('');
      setDebouncedQuery('');
      setActiveIndex(0);
    },
  };
}
