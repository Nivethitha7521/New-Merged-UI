import { useEffect, useRef, useState } from 'react';
import purchaseApi from '@/utils/api';

export interface SearchRecordResult {
  id: string;
  label: string;
  randomId?: string;
  status?: string;
  module: string;
  path: string;
}

const MIN_QUERY_LENGTH = 2;

/**
 * Calls GET /globalsearch/records?q=... (one aggregated request across
 * every Purchase Master collection — see purchase/globalsearch/routes.py).
 *
 * Deliberately separate from the static module/page search: this one
 * touches the network, so it gets its own loading state and its own
 * failure handling. If the backend is slow or errors out, `records`
 * just stays empty — it never throws, never blocks the UI, and never
 * affects the always-instant static results sitting above it.
 */
export function useRecordSearch(debouncedQuery: string) {
  const [records, setRecords] = useState<SearchRecordResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [settledForQuery, setSettledForQuery] = useState('');
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (abortRef.current) abortRef.current.abort();

    if (debouncedQuery.trim().length < MIN_QUERY_LENGTH) {
      setRecords([]);
      setLoading(false);
      setSettledForQuery(debouncedQuery);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    purchaseApi
      .get('/globalsearch/records', {
        params: { q: debouncedQuery.trim() },
        signal: controller.signal,
      })
      .then((res) => {
        if (controller.signal.aborted) return;
        setRecords(Array.isArray(res.data) ? res.data : []);
      })
      .catch(() => {
        // Silent on purpose: a record-search failure should never surface
        // as an error to the person, and should never block module/page
        // results, which already answered instantly above this.
        if (!controller.signal.aborted) setRecords([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setSettledForQuery(debouncedQuery);
        }
      });

    return () => controller.abort();
  }, [debouncedQuery]);

  const isSettled = settledForQuery === debouncedQuery;

  return { records, loading: loading || !isSettled, isSettled };
}
