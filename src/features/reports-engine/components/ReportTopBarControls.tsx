'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { FaFileExcel, FaFilePdf } from 'react-icons/fa';
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineArrowPath,
  HiOutlineArrowsPointingOut,
  HiXMark,
} from 'react-icons/hi2';
import { usePreferences } from '@/components/preferences/PreferencesContext';
import GenericFilterSection from './GenericFilterSection';
import { ReportConfig, ReportState } from '../types';

interface ReportTopBarControlsProps<T extends Record<string, unknown>> {
  config: ReportConfig<T>;
  state: ReportState<T>;
  isLoading: boolean;
  onFilterChange: (apiParam: string, values: string[]) => void;
  onClear: (apiParam: string) => void;
  onDropdownSearch?: (filterType: string, query: string) => void;
  onLoadMoreDropdown?: (filterType: string) => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onRefresh: () => void;
  onClearAll: () => void;
  onToggleColumns: () => void;
  onEnterFullscreen?: () => void;
  isColumnsOpen?: boolean;
  pdfColumnLimit?: number;
  variant?: 'desktop' | 'mobile';
}

function ReportTopBarControls<T extends Record<string, unknown>>({
  config,
  state,
  isLoading,
  onFilterChange,
  onClear,
  onDropdownSearch,
  onLoadMoreDropdown,
  onExportExcel,
  onExportPdf,
  onRefresh,
  onClearAll,
  onToggleColumns,
  onEnterFullscreen,
  isColumnsOpen = false,
  pdfColumnLimit = 12,
  variant = 'desktop',
}: ReportTopBarControlsProps<T>) {
  const { preferences, resolvedThemeMode } = usePreferences();
  const [isCompact, setIsCompact] = useState(false);

  const dark = resolvedThemeMode === 'dark';
  const isMobile = variant === 'mobile';

  useEffect(() => {
    const syncViewportMode = () => {
      if (typeof window === 'undefined') return;

      setIsCompact(
        preferences.layout.topbarMode === 'compact' ||
          (preferences.layout.topbarMode === 'auto' &&
            (window.innerHeight < 800 || window.innerWidth < 1024)),
      );
    };

    syncViewportMode();
    window.addEventListener('resize', syncViewportMode, { passive: true });

    return () => window.removeEventListener('resize', syncViewportMode);
  }, [preferences.layout.topbarMode]);

  const btnBase = useMemo(
    () =>
      [
        'inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-xl border font-bold shadow-sm outline-none transition-all duration-150',
        'focus-visible:ring-2 focus-visible:ring-[rgb(var(--app-primary-rgb)/0.28)]',
        isCompact || isMobile ? 'h-8 gap-1.5 px-2 text-[10.5px]' : 'h-9 gap-1.5 px-3 text-[11px]',
      ].join(' '),
    [isCompact, isMobile],
  );

  const normalBtn =
    `${btnBase} ` +
    (dark
      ? 'border-slate-700 bg-slate-900 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-white'
      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900');

  const activeBtn =
    `${btnBase} border-[var(--app-accent)] bg-[var(--app-accent)] text-white hover:bg-[var(--app-navy)]`;

  return (
    <div
      className={[
        'w-full min-w-0 rounded-2xl border transition-colors',
        dark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/80',
        isMobile ? 'p-2.5' : 'p-2',
      ].join(' ')}
      style={{
        fontFamily: 'var(--app-font-family, system-ui, sans-serif)',
        fontSize: 'var(--app-font-size, 0.875rem)',
        color: 'var(--app-text)',
      }}
    >
      <div
        className={[
          'flex w-full min-w-0 gap-2',
          isMobile
            ? 'flex-col'
            : 'flex-col xl:flex-row xl:items-start xl:justify-between',
        ].join(' ')}
      >
        <div className="min-w-0 flex-1 overflow-visible">
          <GenericFilterSection
            config={config}
            state={state}
            onFilterChange={onFilterChange}
            onClear={onClear}
            onDropdownSearch={onDropdownSearch}
            onLoadMoreDropdown={onLoadMoreDropdown}
            variant={isMobile ? 'drawer' : 'toolbar'}
            compact={isCompact}
          />
        </div>

        <div
          className={[
            'flex shrink-0 flex-wrap gap-1.5',
            isMobile ? 'justify-start' : 'justify-start xl:justify-end',
          ].join(' ')}
        >
          <button
            type="button"
            onClick={onClearAll}
            className={normalBtn}
            title="Clear all filters"
          >
            <HiXMark size={14} />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className={`${normalBtn} disabled:cursor-not-allowed disabled:opacity-50`}
            title="Refresh"
          >
            <HiOutlineArrowPath size={14} className={isLoading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={onToggleColumns}
            className={isColumnsOpen ? activeBtn : normalBtn}
            title="Toggle columns"
          >
            <HiOutlineAdjustmentsHorizontal size={14} />
            <span>Columns</span>
          </button>

          {onEnterFullscreen ? (
            <button
              type="button"
              onClick={onEnterFullscreen}
              className={normalBtn}
              title="Fullscreen"
            >
              <HiOutlineArrowsPointingOut size={14} />
              <span>Full</span>
            </button>
          ) : null}

          <button
            type="button"
            onClick={onExportExcel}
            disabled={state.exporting}
            className={[
              btnBase,
              dark
                ? 'border-emerald-800 bg-emerald-700 text-white hover:bg-emerald-600'
                : 'border-emerald-200 bg-emerald-600 text-white hover:bg-emerald-700',
              'disabled:cursor-not-allowed disabled:opacity-60',
            ].join(' ')}
            title="Export Excel"
          >
            <FaFileExcel size={14} />
            <span>Excel</span>
          </button>

          <button
            type="button"
            onClick={onExportPdf}
            disabled={state.exporting}
            className={[
              btnBase,
              dark
                ? 'border-rose-800 bg-rose-700 text-white hover:bg-rose-600'
                : 'border-rose-200 bg-rose-600 text-white hover:bg-rose-700',
              'disabled:cursor-not-allowed disabled:opacity-60',
            ].join(' ')}
            title={`Export PDF, up to ${pdfColumnLimit} columns`}
          >
            <FaFilePdf size={14} />
            <span>PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default React.memo(ReportTopBarControls) as typeof ReportTopBarControls;