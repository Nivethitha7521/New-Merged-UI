import { buildDateRange } from '@/features/reports-engine/dateRangeUtils';
import { ReportConfig } from './types';

type FilterMap = Record<string, string[]>;

const DATE_FILTER_TYPES = new Set(['year', 'month', 'day']);

const trimValue = (value: string) => value.trim();

const unique = (values: string[]) => Array.from(new Set(values));

const sortValues = (values: string[]) =>
  [...values].sort((left, right) =>
    left.localeCompare(right, undefined, { numeric: true, sensitivity: 'base' })
  );

export const normalizeFilterValues = (values: string[] = []) =>
  sortValues(unique(values.map(trimValue).filter(Boolean)));

export const normalizeFilters = (filters: FilterMap): FilterMap =>
  Object.fromEntries(
    Object.entries(filters).map(([key, values]) => [key, normalizeFilterValues(values)])
  );

export const buildDateContext = (filters: FilterMap, config: ReportConfig) => {
  const yearParam = config.filters.find((filter) => filter.type === 'year')?.apiParam;
  const monthParam = config.filters.find((filter) => filter.type === 'month')?.apiParam;
  const dayParam = config.filters.find((filter) => filter.type === 'day')?.apiParam;

  const years = yearParam ? normalizeFilterValues(filters[yearParam] ?? []) : [];
  const months = monthParam ? normalizeFilterValues(filters[monthParam] ?? []) : [];
  const days = dayParam ? normalizeFilterValues(filters[dayParam] ?? []).map(Number) : [];

  return buildDateRange(years, months, days);
};

interface BuildQueryParamsOptions {
  filters: FilterMap;
  config: ReportConfig;
  page?: number;
  limit?: number;
  includePagination?: boolean;
  excludeApiParam?: string;
  refresh?: boolean; 
}

export const buildQueryParams = ({
  filters,
  config,
  page,
  limit,
  includePagination = true,
  excludeApiParam,
  refresh,
}: BuildQueryParamsOptions) => {
  const normalizedFilters = normalizeFilters(filters);
  const params = new URLSearchParams();

  if (includePagination && typeof page === 'number') {
    params.set('page', String(page));
  }
  if (includePagination && typeof limit === 'number') {
    params.set('limit', String(limit));
  }

  const dateRange = buildDateContext(normalizedFilters, config);
  if (dateRange.start_date) params.set('startDate', dateRange.start_date);
  if (dateRange.end_date) params.set('endDate', dateRange.end_date);

  config.filters.forEach((filter) => {
    if (DATE_FILTER_TYPES.has(filter.type)) return;
    if (filter.apiParam === excludeApiParam) return;

    const values = normalizedFilters[filter.apiParam] ?? [];
    values.forEach((value) => params.append(filter.apiParam, value));
  });

  /**
   * Only appended when the refresh button is clicked (force=true in the thunk).
   * Normal loads never send this param so backend caches them as usual.
   */
  if (refresh === true) {
    params.set('refresh', 'true');
  }

  return params;
};

interface BuildDropdownParamsOptions {
  filters: FilterMap;
  config: ReportConfig;
  filterType: string;
  search?: string;
  page?: number;
  limit?: number;
   refresh?: boolean;
}

export const buildDropdownParams = ({
  filters,
  config,
  filterType,
  search,
  page = 1,
  limit = 50,
  refresh,
}: BuildDropdownParamsOptions) => {
  const filterConfig = config.filters.find((filter) => filter.type === filterType);

  const params = buildQueryParams({
    filters,
    config,
    page,
    limit,
    includePagination: true,
    excludeApiParam: filterConfig?.apiParam,
    refresh, // Pass refresh to buildQueryParams
  });

  params.set('type', filterType);

  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    params.set('search', trimmedSearch);
  }

  return params;
};

const stableValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((accumulator, key) => {
        accumulator[key] = stableValue((value as Record<string, unknown>)[key]);
        return accumulator;
      }, {});
  }

  return value;
};

/**
 * Cache key for report data.
 * Deliberately does NOT include refresh — so a force-fetched result
 * writes back to the same cache key that normal loads read from.
 */
export const buildReportCacheKey = (
  config: ReportConfig,
  filters: FilterMap,
  page: number,
  limit: number,
) =>
  JSON.stringify(
    stableValue({
      apiBase: config.apiBase,
      page,
      limit,
      params: Array.from(buildQueryParams({ filters, config, page, limit }).entries()),
    }),
  );

export const buildDropdownCacheKey = (
  config: ReportConfig,
  filters: FilterMap,
  filterType: string,
  page: number,
  limit: number,
  search?: string,
) =>
  JSON.stringify(
    stableValue({
      endpoint: config.globalDropdownEndpoint || `${config.apiBase}/global-dropdowns`,
      filterType,
      page,
      limit,
      params: Array.from(
        buildDropdownParams({ filters, config, filterType, page, limit, search }).entries(),
      ),
    }),
  );

export const buildDateFilterCacheKey = (config: ReportConfig) =>
  JSON.stringify({
    endpoint: config.dateEndpoint || `${config.apiBase}/dates`,
  });

export const hasAllDateFiltersSelected = (filters: FilterMap, config: ReportConfig) =>
  config.filters
    .filter((filter) => DATE_FILTER_TYPES.has(filter.type))
    .every((filter) => (filters[filter.apiParam] ?? []).length > 0);

export const hasFiscalYearSelected = (filters: FilterMap, config: ReportConfig) => {
  const yearParam = config.filters.find((filter) => filter.type === 'year')?.apiParam;
  return !yearParam || (filters[yearParam] ?? []).length > 0;
};

export const getDateFilterSignature = (filters: FilterMap, config: ReportConfig) => {
  const yearParam = config.filters.find((filter) => filter.type === 'year')?.apiParam;
  const monthParam = config.filters.find((filter) => filter.type === 'month')?.apiParam;
  const dayParam = config.filters.find((filter) => filter.type === 'day')?.apiParam;

  return JSON.stringify({
    year: yearParam ? normalizeFilterValues(filters[yearParam] ?? []) : [],
    month: monthParam ? normalizeFilterValues(filters[monthParam] ?? []) : [],
    day: dayParam ? normalizeFilterValues(filters[dayParam] ?? []) : [],
  });
};
