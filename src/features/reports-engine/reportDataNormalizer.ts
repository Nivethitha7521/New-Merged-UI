'use client';

import { ColumnConfig, PaginatedResponse, ReportConfig } from './types';

export const safeArray = <T,>(value: unknown): T[] => (Array.isArray(value) ? value as T[] : []);

export const safeNumber = (value: unknown, fallback = 0) => {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
};

export const safeText = (value: unknown, fallback = '-') => {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
};

const looksNumericColumn = (column: ColumnConfig) => {
  const source = `${column.label ?? ''} ${String(column.dataKey ?? '')}`.toLowerCase();
  return ['total', 'amount', 'price', 'qty', 'quantity', 'cost', 'value', 'balance', 'tax', 'amt', 'count'].some(
    (keyword) => source.includes(keyword),
  );
};

export const normalizeReportRows = <T extends Record<string, unknown>>(
  rows: unknown,
  config: ReportConfig<T>,
): T[] => {
  return safeArray<Record<string, unknown>>(rows).map((row) => {
    const normalized = { ...row };

    safeArray<ColumnConfig<T>>(config.columns).forEach((column) => {
      const key = column.dataKey as string;
      if (normalized[key] !== null && normalized[key] !== undefined && normalized[key] !== '') return;
      normalized[key] = looksNumericColumn(column as ColumnConfig) ? 0 : '-';
    });

    return normalized as T;
  });
};

export const normalizePaginatedReport = <T extends Record<string, unknown>>(
  response: Partial<PaginatedResponse<T>> | null | undefined,
  config: ReportConfig<T>,
  page: number,
  limit: number,
): PaginatedResponse<T> => {
  const totalItems = safeNumber(response?.totalItems ?? response?.totalrecords, 0);

  return {
    page: safeNumber(response?.page, page),
    limit: safeNumber(response?.limit, limit),
    totalrecords: safeNumber(response?.totalrecords ?? totalItems, totalItems),
    totalItems,
    totalPages: Math.max(1, safeNumber(response?.totalPages, 1)),
    items: normalizeReportRows<T>(response?.items, config),
  };
};

