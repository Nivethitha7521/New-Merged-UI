'use client';

import React, { useState } from 'react';
import { ReportConfig, ReportState } from '../types';
import CollapsibleFilter from '@/components/Filter/CollapsibleFilter';

interface GenericFilterSectionProps<T extends Record<string, unknown>> {
  config: ReportConfig<T>;
  state: ReportState<T>;
  onFilterChange: (apiParam: string, values: string[]) => void;
  onClear: (apiParam: string) => void;
  onDropdownSearch?: (filterType: string, query: string) => void;
  onLoadMoreDropdown?: (filterType: string) => void;
  variant?: 'toolbar' | 'drawer';
  compact?: boolean;
}

function GenericFilterSection<T extends Record<string, unknown>>({
  config,
  state,
  onFilterChange,
  onClear,
  onDropdownSearch,
  onLoadMoreDropdown,
  variant = 'toolbar',
  compact = false,
}: GenericFilterSectionProps<T>) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const yearConf = config.filters.find((f) => f.type === 'year');
  const monthConf = config.filters.find((f) => f.type === 'month');
  const dayConf = config.filters.find((f) => f.type === 'day');

  const yearSelected = yearConf ? state.filters[yearConf.apiParam] ?? [] : [];
  const monthSelected = monthConf ? state.filters[monthConf.apiParam] ?? [] : [];
  const daySelected = dayConf ? state.filters[dayConf.apiParam] ?? [] : [];

  const isDrawer = variant === 'drawer';

  return (
    <div
      className={[
        'report-filter-grid w-full min-w-0',
        isDrawer
          ? 'grid grid-cols-1 gap-2.5'
          : 'flex flex-wrap items-center',
        !isDrawer && (compact ? 'gap-1.5' : 'gap-2'),
      ].join(' ')}
      style={{
        fontFamily: 'var(--app-font-family, system-ui, sans-serif)',
        fontSize: 'var(--app-font-size, 0.875rem)',
        color: 'var(--app-text)',
      }}
    >
      {config.filters.map((filterConf) => {
        const rawOptions = state.availableOptions[filterConf.type] ?? [];
        const selected = state.filters[filterConf.apiParam] ?? [];
        const pagination = state.dropdownPagination[filterConf.type];

        const options =
          filterConf.type === 'variance'
            ? rawOptions.filter((opt) => {
                const value = typeof opt === 'string' ? opt : opt.value;
                return !/^\d{1,2}$/.test(String(value));
              })
            : rawOptions;

      const isBlockedByFiscalYear =
  !!yearConf && filterConf.type !== 'year' && yearSelected.length === 0;

const isDisabled =
  isBlockedByFiscalYear ||
  (filterConf.type === 'day' && !!monthConf && monthSelected.length === 0);

        const otherYear = yearConf && filterConf.type !== 'year' ? yearSelected : undefined;
        const otherMonth = monthConf && filterConf.type !== 'month' ? monthSelected : undefined;
        const otherDay = dayConf && filterConf.type !== 'day' ? daySelected : undefined;

        return (
          <div
            key={filterConf.type}
            className={[
              'min-w-0',
              isDrawer
                ? 'w-full'
                : 'min-w-[132px] flex-[1_1_145px] sm:min-w-[145px] md:flex-[1_1_150px] xl:max-w-[185px] 2xl:max-w-[205px]',
              isDisabled ? 'opacity-60' : '',
            ].join(' ')}
            title={
              isDisabled
                ? isBlockedByFiscalYear
                  ? 'Select fiscal year to activate filters'
                  : 'Select a month first'
                : undefined
            }
          >
            <div
              className="rounded-xl transition-colors"
              style={{
                background: 'transparent',
                color: 'var(--app-text)',
              }}
            >
              <CollapsibleFilter
                id={filterConf.label}
                title={filterConf.label}
                type={filterConf.type}
                options={options}
                selectedOptions={selected}
                onChange={(vals) => onFilterChange(filterConf.apiParam, vals)}
                onClear={() => onClear(filterConf.apiParam)}
                active={activeFilter === filterConf.label}
                onActivate={() => setActiveFilter(filterConf.label)}
                onDeactivate={() => setActiveFilter(null)}
                hasMore={pagination?.hasMore}
                loadingMore={pagination?.loading}
                disabled={isDisabled}
                onLoadMore={
                  filterConf.paginated && onLoadMoreDropdown
                    ? () => onLoadMoreDropdown(filterConf.type)
                    : undefined
                }
                onSearch={
                  filterConf.searchable && onDropdownSearch
                    ? (q) => onDropdownSearch(filterConf.type, q)
                    : undefined
                }
                otherYear={otherYear}
                otherMonth={otherMonth}
                otherDay={otherDay}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default GenericFilterSection;
