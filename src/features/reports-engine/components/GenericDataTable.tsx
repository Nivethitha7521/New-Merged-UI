'use client';

import React, {
  forwardRef,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { HiDocumentSearch } from 'react-icons/hi';
import { usePreferences } from '@/components/preferences/PreferencesContext';
import { formatReportCurrency, formatReportDate } from '@/lib/reportFormatters';
import { ReportConfig } from '../types';


/**
 * Row windowing kicks in only past this size — small/typical result sets
 * render exactly as before, with zero behavior change.
 */
const VIRTUALIZE_THRESHOLD = 150;
const VIRTUALIZE_OVERSCAN = 10;

interface GenericDataTableProps<T extends Record<string, unknown>> {
  config: ReportConfig<T>;
  data: T[];
  visibleColumns: string[];
  onSelectionChange?: (selectedRows: T[]) => void;
  isLoading?: boolean;
  compact?: boolean;
}

export const formatValue = (value: unknown): string => {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
};

const isNumericColumn = (colLabel?: string, dataKey?: string): boolean => {
  const numKeywords = ['total', 'amount', 'price', 'qty', 'quantity', 'cost', 'value', 'balance', 'tax', 'amt'];
  const check = (str: string) => numKeywords.some((kw) => str.toLowerCase().includes(kw));
  return Boolean((colLabel && check(colLabel)) || (dataKey && check(dataKey)));
};

const isCurrencyColumn = (colLabel?: string, dataKey?: string): boolean => {
  const currencyKeywords = ['amount', 'price', 'cost', 'value', 'balance', 'tax', 'total', 'invoice', 'payable'];
  const check = (str: string) => currencyKeywords.some((kw) => str.toLowerCase().includes(kw));
  return Boolean((colLabel && check(colLabel)) || (dataKey && check(dataKey)));
};

const isDateColumn = (colLabel?: string, dataKey?: string): boolean => {
  const dateKeywords = ['date', 'day', 'month', 'year', 'time'];
  const check = (str: string) => dateKeywords.some((kw) => str.toLowerCase().includes(kw));
  return Boolean((colLabel && check(colLabel)) || (dataKey && check(dataKey)));
};

const GenericDataTable = forwardRef(
  <T extends Record<string, unknown>>(
    {
      config,
      data,
      visibleColumns,
      onSelectionChange,
      isLoading,
      compact = false,
    }: GenericDataTableProps<T>,
    ref: React.Ref<HTMLDivElement>,
  ) => {
    const { preferences } = usePreferences();
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    const safeConfig = config ?? { columns: [] };
    const safeData = Array.isArray(data) ? data : [];
    const safeCols = Array.isArray(visibleColumns) ? visibleColumns : [];

    const isInitialLoading = Boolean(isLoading && safeData.length === 0);
    const isLazyLoading = Boolean(isLoading && safeData.length > 0);
    const effectiveCompact = compact || preferences.reportTable.compactTableRows;
    const headerOffset = effectiveCompact ? 42 : 45;

    // Row windowing: bounds DOM size for large result sets by only rendering
    // rows near the viewport, tracked off the same scroll container the
    // caller's infinite-scroll listener already observes.
    const scrollElRef = useRef<HTMLDivElement | null>(null);
    const setScrollRef = useCallback(
      (node: HTMLDivElement | null) => {
        scrollElRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      },
      [ref],
    );

    const [scrollTop, setScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(0);
    const rowHeight = effectiveCompact ? 39 : 45;
    const shouldVirtualize = safeData.length > VIRTUALIZE_THRESHOLD;

    useEffect(() => {
      if (!shouldVirtualize) return;
      const el = scrollElRef.current;
      if (!el) return;

      const onScroll = () => setScrollTop(el.scrollTop);
      onScroll();
      setViewportHeight(el.clientHeight);

      el.addEventListener('scroll', onScroll, { passive: true });
      const resizeObserver = new ResizeObserver(() => setViewportHeight(el.clientHeight));
      resizeObserver.observe(el);

      return () => {
        el.removeEventListener('scroll', onScroll);
        resizeObserver.disconnect();
      };
    }, [shouldVirtualize]);

    const { startIndex, endIndex, topSpacerHeight, bottomSpacerHeight } = useMemo(() => {
      if (!shouldVirtualize) {
        return { startIndex: 0, endIndex: safeData.length, topSpacerHeight: 0, bottomSpacerHeight: 0 };
      }

      const visibleCount = Math.ceil((viewportHeight || 0) / rowHeight) + VIRTUALIZE_OVERSCAN * 2;
      const start = Math.max(0, Math.floor(scrollTop / rowHeight) - VIRTUALIZE_OVERSCAN);
      const end = Math.min(safeData.length, start + Math.max(visibleCount, VIRTUALIZE_OVERSCAN));

      return {
        startIndex: start,
        endIndex: end,
        topSpacerHeight: start * rowHeight,
        bottomSpacerHeight: (safeData.length - end) * rowHeight,
      };
    }, [shouldVirtualize, scrollTop, viewportHeight, rowHeight, safeData.length]);

    const visibleData = shouldVirtualize ? safeData.slice(startIndex, endIndex) : safeData;

    useEffect(() => {
      setSelectedIndices(new Set());
    }, [safeData]);

    useEffect(() => {
      onSelectionChange?.(Array.from(selectedIndices).map((i) => safeData[i]));
    }, [onSelectionChange, safeData, selectedIndices]);

    const toggleRow = (index: number) => {
      setSelectedIndices((prev) => {
        const next = new Set(prev);
        if (next.has(index)) next.delete(index);
        else next.add(index);
        return next;
      });
    };

    const toggleAll = () => {
      if (selectedIndices.size === safeData.length && safeData.length > 0) {
        setSelectedIndices(new Set());
        return;
      }
      setSelectedIndices(new Set(safeData.map((_, i) => i)));
    };

    const gridTemplate = useMemo(() => {
      const serialCol = preferences.reportTable.showSerialNumberColumn ? '64px ' : '';
      const responsiveCols = Array(safeCols.length).fill('minmax(160px, 1fr)').join(' ');
      return `44px ${serialCol}${responsiveCols}`;
    }, [preferences.reportTable.showSerialNumberColumn, safeCols.length]);

    const formatDisplayValue = (
      value: unknown,
      columnLabel?: string,
      dataKey?: string,
      isNum?: boolean,
    ) => {
      if (isDateColumn(columnLabel, dataKey)) {
        return formatReportDate(value, preferences.formats.dateFormat);
      }

      if (isCurrencyColumn(columnLabel, dataKey)) {
        return formatReportCurrency(value, preferences);
      }

      if (isNum) {
        if (value === null || value === undefined || value === '') return '-';
        const num = Number(value);
        if (Number.isNaN(num)) return String(value);

        return num.toLocaleString('en-US', {
          minimumFractionDigits: preferences.formats.decimalPlaces,
          maximumFractionDigits: preferences.formats.decimalPlaces,
          useGrouping: preferences.formats.thousandSeparator,
        });
      }

      return formatValue(value);
    };

    return (
      <div
        className="relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-[var(--app-card)] text-[var(--app-text)]"
        style={{
          fontFamily: 'var(--app-font-family, system-ui, sans-serif)',
          fontSize: 'var(--app-table-font-size, 0.8125rem)',
        }}
      >
        {isInitialLoading ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-[var(--app-card)]/70 backdrop-blur-sm"
            style={{ top: `${headerOffset}px` }}
          >
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{ display: 'grid', gridTemplateColumns: gridTemplate }}
                className="border-b border-[var(--app-border)]"
              >
                <div className="flex items-center justify-center border-r border-[var(--app-border)] px-3 py-3">
                  <div className="h-4 w-4 rounded skeleton-shimmer" />
                </div>

                {safeCols.map((key, ci) => {
                  const col = safeConfig.columns.find((column) => column?.displayKey === key);
                  const isNum = col?.align === 'right' || isNumericColumn(col?.label, col?.dataKey as string);

                  return (
                    <div
                      key={key}
                      className={`flex items-center border-r border-[var(--app-border)] px-3 py-3 ${
                        isNum ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className="h-3 rounded skeleton-shimmer"
                        style={{ width: `${45 + ((ci * 17 + i * 11) % 40)}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        ) : null}

        <div ref={setScrollRef} className="table-scroll-container h-full min-h-0 w-full select-text overflow-auto">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: gridTemplate,
              minWidth: `${44 + (preferences.reportTable.showSerialNumberColumn ? 64 : 0) + safeCols.length * 160}px`,
              width: '100%',
            }}
          >
            <div
              className={`${preferences.reportTable.stickyTableHeader ? 'sticky top-0' : ''} z-20 border-b border-[var(--app-border)] bg-[var(--app-surface)] shadow-sm`}
              style={{
                display: 'grid',
                gridTemplateColumns: 'subgrid',
                gridColumn: '1 / -1',
                backdropFilter: 'blur(8px)',
              }}
            >
              <div className="flex items-center justify-center border-r border-[var(--app-border)] bg-[var(--app-surface)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 cursor-pointer rounded border-[var(--app-border)]"
                  style={{ accentColor: 'var(--app-accent)' }}
                  checked={safeData.length > 0 && selectedIndices.size === safeData.length}
                  onChange={toggleAll}
                  disabled={Boolean(isLoading && safeData.length === 0)}
                />
              </div>

              {preferences.reportTable.showSerialNumberColumn ? (
                <div
                  className={[
                    'border-r border-[var(--app-border)] text-center text-[var(--app-text-muted)]',
                    effectiveCompact ? 'px-2 py-2.5' : 'px-3 py-3',
                  ].join(' ')}
                  style={{
                    fontSize: effectiveCompact ? '0.625rem' : '0.6875rem',
                    fontWeight: 800,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    lineHeight: 1.2,
                  }}
                >
                  Sr.
                </div>
              ) : null}

              {safeCols.map((key) => {
                const col = safeConfig.columns.find((column) => column?.displayKey === key);
                const isNum = col?.align === 'right' || isNumericColumn(col?.label, col?.dataKey as string);
                const headerAlignment =
                  col?.align === 'center' ? 'text-center' : isNum ? 'text-right' : 'text-left';

                return (
                  <div
                    key={key}
                    className={[
                      `truncate overflow-hidden border-r border-[var(--app-border)] text-ellipsis text-[var(--app-text-muted)] ${headerAlignment}`,
                      effectiveCompact ? 'px-3 py-2.5' : 'px-4 py-3',
                    ].join(' ')}
                    style={{
                      fontSize: effectiveCompact ? '0.625rem' : '0.6875rem',
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      lineHeight: 1.2,
                    }}
                    title={col?.label ?? key}
                  >
                    {col?.label ?? key}
                  </div>
                );
              })}
            </div>

            <div className="contents">
              {safeData.length === 0 && !isLoading ? (
                <div
                  className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
                  style={{ marginTop: `${headerOffset}px`, height: `calc(100% - ${headerOffset}px)` }}
                >
                  <div className="pointer-events-auto flex flex-col items-center p-8 text-center">
                    <div className="mb-4 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-sm">
                      <HiDocumentSearch className="text-5xl text-[var(--app-text-muted)]" />
                    </div>

                    <h3
                      className="font-semibold uppercase tracking-wide text-[var(--app-text)]"
                      style={{
                        fontSize: '0.875rem',
                        letterSpacing: '0.025em',
                        fontWeight: 700,
                      }}
                    >
                      No data for selected filters
                    </h3>

                    <p
                      className="mt-2 text-[var(--app-text-muted)]"
                      style={{ fontSize: '0.75rem', lineHeight: 1.5 }}
                    >
                      Try another date, branch, item, or status selection.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {topSpacerHeight > 0 ? (
                    <div style={{ height: topSpacerHeight, gridColumn: '1 / -1' }} />
                  ) : null}

                  {visibleData.map((row, localIndex) => {
                  const i = startIndex + localIndex;
                  const isSelected = selectedIndices.has(i);

                  return (
                    <div
                      key={i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'subgrid',
                        gridColumn: '1 / -1',
                      }}
                      className={[
                        'group border-b border-[var(--app-border)] transition-all duration-150 ease-out',
                        isSelected
                          ? 'bg-[rgb(var(--app-primary-rgb)/0.12)]'
                          : preferences.theme.tableStyle === 'plain'
                            ? 'bg-[var(--app-card)]'
                            : i % 2 === 0
                              ? 'bg-[var(--app-card)]'
                              : 'bg-[var(--app-surface)]',
                        'hover:bg-[rgb(var(--app-primary-rgb)/0.06)]',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'flex items-center justify-center border-r border-[var(--app-border)] transition-colors duration-150',
                          isSelected ? 'bg-[rgb(var(--app-primary-rgb)/0.18)]' : 'bg-inherit',
                          'group-hover:bg-[rgb(var(--app-primary-rgb)/0.08)]',
                        ].join(' ')}
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer rounded border-[var(--app-border)]"
                          style={{ accentColor: 'var(--app-accent)' }}
                          checked={isSelected}
                          onChange={() => toggleRow(i)}
                        />
                      </div>

                      {preferences.reportTable.showSerialNumberColumn ? (
                        <div
                          className={[
                            'border-r border-[var(--app-border)] text-center font-semibold text-[var(--app-text-muted)]',
                            effectiveCompact ? 'px-2 py-2.5 text-xs' : 'px-3 py-3 text-sm',
                          ].join(' ')}
                        >
                          {i + 1}
                        </div>
                      ) : null}

                      {safeCols.map((key) => {
                        const col = safeConfig.columns.find((column) => column?.displayKey === key);
                        const isNum = col?.align === 'right' || isNumericColumn(col?.label, col?.dataKey as string);
                        const rawVal = row?.[col?.dataKey as string];

                        const formatted = formatDisplayValue(
                          rawVal,
                          col?.label,
                          String(col?.dataKey ?? ''),
                          isNum,
                        );

                        const isZero = isNum && (rawVal === 0 || rawVal === '0');
                        const cellAlignment =
                          col?.align === 'center' ? 'text-center' : isNum ? 'text-right' : 'text-left';

                        return (
                          <div
                            key={key}
                            className={[
                              'group/cell relative border-r border-[var(--app-border)] transition-colors duration-150',
                              cellAlignment,
                              isZero ? 'text-[var(--app-text-muted)]' : 'text-[var(--app-text)]',
                              isSelected ? 'font-semibold' : '',
                            ].join(' ')}
                            style={{
                              fontSize:
                                preferences.typography.tableTextSize === 'small'
                                  ? '0.75rem'
                                  : preferences.typography.tableTextSize === 'large'
                                    ? '0.875rem'
                                    : effectiveCompact
                                      ? '0.75rem'
                                      : '0.8125rem',
                              lineHeight: 1.5,
                              letterSpacing: '-0.01em',
                              fontFamily: isNum
                                ? "'JetBrains Mono', 'Fira Code', Consolas, monospace"
                                : 'inherit',
                              fontWeight: isNum ? 500 : isSelected ? 700 : 400,
                              fontVariantNumeric: isNum ? 'tabular-nums' : 'normal',
                            }}
                          >
                            <div className={effectiveCompact ? 'px-3 py-2.5' : 'px-4 py-3'}>
                              <div className="block w-full truncate">{formatted}</div>

                              <div className="pointer-events-none invisible absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 scale-95 opacity-0 transition-all duration-200 group-hover/cell:visible group-hover/cell:scale-100 group-hover/cell:opacity-100">
                                <div
                                  className="whitespace-nowrap rounded-lg border px-3 py-2 shadow-xl"
                                  style={{
                                    background: 'var(--app-navy)',
                                    color: '#ffffff',
                                    fontSize: '0.6875rem',
                                    fontWeight: 600,
                                    letterSpacing: '0.03em',
                                    boxShadow:
                                      '0 10px 25px -5px rgba(0, 0, 0, 0.35), 0 8px 10px -6px rgba(0, 0, 0, 0.2)',
                                    borderColor: 'rgb(var(--app-primary-rgb) / 0.35)',
                                  }}
                                >
                                  {formatted}
                                  <div
                                    className="absolute left-1/2 top-full -translate-x-1/2"
                                    style={{
                                      width: 0,
                                      height: 0,
                                      borderLeft: '6px solid transparent',
                                      borderRight: '6px solid transparent',
                                      borderTop: '6px solid var(--app-navy)',
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                  })}

                  {bottomSpacerHeight > 0 ? (
                    <div style={{ height: bottomSpacerHeight, gridColumn: '1 / -1' }} />
                  ) : null}
                </>
              )}
            </div>
          </div>

          {isLazyLoading ? (
            <div className="flex w-full flex-col items-center justify-center border-t border-[var(--app-border)] bg-[var(--app-surface)] py-8">
              <div className="mb-3 flex h-5 items-end gap-1.5">
                <div className="h-full w-1.5 animate-bounce rounded-full bg-[var(--app-accent)] [animation-delay:-0.3s]" />
                <div className="h-3 w-1.5 animate-bounce rounded-full bg-[var(--app-accent)] [animation-delay:-0.15s]" />
                <div className="h-4 w-1.5 animate-bounce rounded-full bg-[var(--app-accent)]" />
              </div>

              <span
                className="font-semibold uppercase text-[var(--app-text-muted)]"
                style={{
                  fontSize: '0.6875rem',
                  letterSpacing: '0.1em',
                }}
              >
                Loading more records...
              </span>
            </div>
          ) : null}
        </div>
      </div>
    );
  },
);

GenericDataTable.displayName = 'GenericDataTable';

export default GenericDataTable;
