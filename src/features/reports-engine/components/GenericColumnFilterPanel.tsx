'use client';

import React, { useMemo, useState } from 'react';
import {
  HiCheck,
  HiListBullet,
  HiMagnifyingGlass,
  HiSquares2X2,
  HiXMark,
} from 'react-icons/hi2';
import { ReportConfig } from '../types';

interface GenericColumnFilterPanelProps {
  config: ReportConfig<any>;
  visibleColumns: string[];
  defaultVisibleColumns: string[];
  pdfSupportedColumnKeys?: string[];
  onToggleColumn: (key: string) => void;
  onSelectOnly: (keys: string[]) => void;
  minVisibleColumns?: number;
}

const panelButton =
  'inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border px-3 text-[11px] font-bold transition disabled:cursor-not-allowed disabled:opacity-45';

const GenericColumnFilterPanel: React.FC<GenericColumnFilterPanelProps> = ({
  config,
  visibleColumns,
  defaultVisibleColumns,
  pdfSupportedColumnKeys = [],
  onToggleColumn,
  onSelectOnly,
  minVisibleColumns = 1,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const columns = Array.isArray(config.columns) ? config.columns : [];
  const filteredColumns = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return columns;
    return columns.filter((col) =>
      `${col.label} ${String(col.dataKey)} ${col.displayKey}`.toLowerCase().includes(query),
    );
  }, [columns, searchTerm]);

  const isAllSelected =
    filteredColumns.length > 0 && filteredColumns.every((col) => visibleColumns.includes(col.displayKey));
  const hasSelectedInFilter = filteredColumns.some((col) => visibleColumns.includes(col.displayKey));
  const pdfSet = useMemo(() => new Set(pdfSupportedColumnKeys), [pdfSupportedColumnKeys]);

  const handleSelectAll = () => {
    const merged = Array.from(new Set([...visibleColumns, ...filteredColumns.map((col) => col.displayKey)]));
    onSelectOnly(merged);
  };

  const handleDeselectAll = () => {
    const next = visibleColumns.filter((key) => !filteredColumns.some((col) => col.displayKey === key));
    onSelectOnly(next.length >= minVisibleColumns ? next : defaultVisibleColumns.slice(0, minVisibleColumns));
  };

  const toggleColumn = (displayKey: string) => {
    if (visibleColumns.length <= minVisibleColumns && visibleColumns.includes(displayKey)) return;
    onToggleColumn(displayKey);
  };

  return (
    <section className="border-b border-[var(--app-border)] bg-[var(--app-card)]">
      <div className="flex flex-col gap-3 px-3 py-3 lg:flex-row lg:items-center lg:px-4">
        <div className="flex min-w-fit items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-bold text-[var(--app-text)]">
            {visibleColumns.length}
            <span className="font-medium text-[var(--app-text-muted)]"> / {columns.length} columns visible</span>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSelectAll}
            disabled={isAllSelected || filteredColumns.length === 0}
            className={`${panelButton} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
          >
            <HiCheck size={13} />
            Select All
          </button>
          <button
            type="button"
            onClick={handleDeselectAll}
            disabled={!hasSelectedInFilter}
            className={`${panelButton} border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100`}
          >
            <HiXMark size={13} />
            Clear
          </button>
          <button
            type="button"
            onClick={() => onSelectOnly(defaultVisibleColumns)}
            className={`${panelButton} border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)] hover:text-[var(--app-text)]`}
          >
            Reset
          </button>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
          <div className="inline-flex h-8 w-fit items-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-0.5">
            {(['grid', 'list'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={[
                  'inline-flex h-7 w-8 items-center justify-center rounded-md transition',
                  viewMode === mode
                    ? 'bg-[var(--app-card)] text-[var(--app-text)] shadow-sm'
                    : 'text-[var(--app-text-muted)] hover:text-[var(--app-text)]',
                ].join(' ')}
                title={mode === 'grid' ? 'Grid view' : 'List view'}
              >
                {mode === 'grid' ? <HiSquares2X2 size={15} /> : <HiListBullet size={15} />}
              </button>
            ))}
          </div>

          <div className="relative min-w-0 sm:w-64">
            <HiMagnifyingGlass
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--app-text-muted)]"
            />
            <input
              type="text"
              placeholder="Search columns"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-8 w-full rounded-lg border border-[var(--app-border)] bg-[var(--app-input-bg)] pl-9 pr-8 text-xs font-medium text-[var(--app-text)] outline-none transition focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[rgb(var(--app-accent-rgb)/0.14)]"
            />
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md text-[var(--app-text-muted)] hover:bg-[var(--app-surface)] hover:text-[var(--app-text)]"
                aria-label="Clear column search"
              >
                <HiXMark size={13} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      <div className="max-h-60 overflow-y-auto px-3 pb-3 lg:px-4">
        {filteredColumns.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[var(--app-border)] bg-[var(--app-surface)] py-8 text-center">
            <HiMagnifyingGlass size={22} className="text-[var(--app-text-muted)]" />
          <p className="mt-2 text-xs font-semibold text-[var(--app-text-muted)]">No columns match &quot;{searchTerm}&quot;</p>          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-5'
                : 'flex flex-col gap-1'
            }
          >
            {filteredColumns.map((col) => {
              const isActive = visibleColumns.includes(col.displayKey);
              const isPdf = pdfSet.has(col.displayKey);

              return (
                <button
                  key={col.displayKey}
                  type="button"
                  onClick={() => toggleColumn(col.displayKey)}
                  className={[
                    'group flex min-w-0 items-center gap-2 rounded-lg border px-3 text-left transition',
                    viewMode === 'grid' ? 'h-10' : 'h-9',
                    isActive
                      ? 'border-[var(--app-accent)] bg-[rgb(var(--app-accent-rgb)/0.10)] text-[var(--app-text)]'
                      : 'border-[var(--app-border)] bg-[var(--app-card)] text-[var(--app-text-muted)] hover:border-[var(--app-accent)] hover:bg-[var(--app-surface)]',
                  ].join(' ')}
                  title={col.label}
                >
                  <span
                    className={[
                      'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                      isActive
                        ? 'border-[var(--app-accent)] bg-[var(--app-accent)] text-white'
                        : 'border-[var(--app-border)] bg-[var(--app-input-bg)]',
                    ].join(' ')}
                  >
                    {isActive ? <HiCheck size={11} /> : null}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">{col.label}</span>
                  {isPdf ? (
                    <span className="shrink-0 rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-emerald-700">
                      PDF
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between border-t border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-[11px] font-medium text-[var(--app-text-muted)] lg:px-4">
        <span>{filteredColumns.length} shown</span>
        <span>Minimum {minVisibleColumns} column required</span>
      </div>
    </section>
  );
};

export default GenericColumnFilterPanel;
export { GenericColumnFilterPanel };
