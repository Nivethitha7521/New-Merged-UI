'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiSearch, FiX, FiLoader } from 'react-icons/fi';
import { useGlobalSearch } from '@/hooks/useGlobalSearch';
import { useRecordSearch, SearchRecordResult } from '@/hooks/useRecordSearch';
import type { ResolvedSearchItem } from '@/config/searchIndex';
import SearchIconColorful from './SearchIconColorful';
import './GlobalSearch.css';

const TYPE_LABEL: Record<ResolvedSearchItem['type'], string> = {
  module: 'Module',
  submodule: 'Page',
  field: 'Field',
};

type CombinedItem =
  | { kind: 'static'; key: string; label: string; module: string; typeLabel: string; navPath: string }
  | { kind: 'record'; key: string; label: string; module: string; typeLabel: string; navPath: string; meta?: string };

const toCombinedStatic = (item: ResolvedSearchItem): CombinedItem => ({
  kind: 'static',
  key: item.id,
  label: item.label,
  module: item.module,
  typeLabel: TYPE_LABEL[item.type],
  navPath: item.focusField ? `${item.path}?focus=${encodeURIComponent(item.focusField)}` : item.path,
});

const toCombinedRecord = (record: SearchRecordResult): CombinedItem => ({
  kind: 'record',
  key: `record:${record.module}:${record.id}`,
  label: record.label,
  module: record.module,
  typeLabel: 'Record',
  // `highlight` carries the visible label text itself (not an id), because
  // SearchHighlightWatcher finds the row by matching visible cell text —
  // that works on every table with zero table-component changes needed.
  navPath: `${record.path}${record.path.includes('?') ? '&' : '?'}highlight=${encodeURIComponent(record.label)}`,
  meta: record.randomId,
});

const GlobalSearch: React.FC = () => {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const navigatedRef = useRef(false);

  const {
    query,
    setQuery,
    debouncedQuery,
    results,
    activeIndex,
    setActiveIndex,
    reset,
  } = useGlobalSearch();

  const { records, loading: recordsLoading, isSettled: recordsSettled } = useRecordSearch(debouncedQuery);

  const combined = useMemo<CombinedItem[]>(
    () => [...results.map(toCombinedStatic), ...records.map(toCombinedRecord)],
    [results, records]
  );

  const goTo = (navPath: string) => {
    navigatedRef.current = true;
    router.push(navPath);
    reset();
    setExpanded(false);
  };

  // Auto-navigate once the query settles on exactly one match across BOTH
  // the instant static results and the (now-loaded) data records — per the
  // "ondru mattum irundha direct navigate aaganum" requirement. Waiting on
  // recordsSettled means we never jump the gun mid-fetch.
  useEffect(() => {
    if (!recordsSettled || navigatedRef.current) return;
    if (debouncedQuery.length >= 2 && combined.length === 1) {
      goTo(combined[0].navPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combined, recordsSettled]);

  useEffect(() => {
    navigatedRef.current = false;
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setExpanded(false);
      reset();
      return;
    }
    if (!combined.length) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % combined.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + combined.length) % combined.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      goTo(combined[activeIndex]?.navPath ?? combined[0].navPath);
    }
  };

  const showDropdown = expanded && debouncedQuery.length > 0;
  const showEmptyState = showDropdown && combined.length === 0 && !recordsLoading;

  return (
    <div className={`global-search ${expanded ? 'is-expanded' : ''}`} ref={containerRef}>
      <button
        type="button"
        className="global-search-trigger"
        aria-label="Search modules, pages, fields, and records"
        title="Search"
        onClick={() => setExpanded((v) => !v)}
      >
        <SearchIconColorful />
      </button>

      {expanded && (
        <div className="global-search-panel">
          <div className="global-search-input-wrap">
            <FiSearch className="global-search-input-icon" />
            <input
              ref={inputRef}
              className="global-search-input"
              type="text"
              value={query}
              placeholder="Search modules, pages, or records..."
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            {recordsLoading && debouncedQuery.length >= 2 && (
              <FiLoader className="global-search-loading-icon" aria-label="Searching records" />
            )}
            {query && (
              <button
                type="button"
                className="global-search-clear"
                aria-label="Clear search"
                onClick={() => {
                  reset();
                  inputRef.current?.focus();
                }}
              >
                <FiX />
              </button>
            )}
          </div>

          {showDropdown && combined.length > 0 && (
            <ul className="global-search-results" role="listbox">
              {combined.map((item, index) => (
                <li key={item.key} role="option" aria-selected={index === activeIndex}>
                  <button
                    type="button"
                    className={`global-search-result ${index === activeIndex ? 'is-active' : ''}`}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => goTo(item.navPath)}
                  >
                    <span className="global-search-result-label">
                      {item.label}
                      {item.kind === 'record' && item.meta && (
                        <span className="global-search-result-id">{item.meta}</span>
                      )}
                    </span>
                    <span className="global-search-result-meta">
                      <span className="global-search-result-module">{item.module}</span>
                      <span className={`global-search-result-type ${item.kind === 'record' ? 'is-record' : ''}`}>
                        {item.typeLabel}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {showDropdown && combined.length === 0 && recordsLoading && (
            <div className="global-search-empty">Searching...</div>
          )}

          {showEmptyState && (
            <div className="global-search-empty">No modules, pages, or records match &quot;{debouncedQuery}&quot;</div>
          )}
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;

