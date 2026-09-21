'use client';

import { AppPreferences, CURRENCY_OPTIONS, DateFormatOption } from '@/components/preferences/PreferencesContext';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (value: number) => String(value).padStart(2, '0');

const normalizeDate = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  const looksDateLike =
    /^\d{4}-\d{2}-\d{2}/.test(trimmed) ||
    /^\d{2}\/\d{2}\/\d{4}/.test(trimmed) ||
    /^\d{2}-[A-Za-z]{3}-\d{4}/.test(trimmed) ||
    trimmed.includes('T');

  if (!looksDateLike) return null;

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const formatReportDate = (
  value: unknown,
  format: DateFormatOption = 'DD/MM/YYYY',
) => {
  const date = normalizeDate(value);
  if (!date) return value == null ? '-' : String(value);

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = String(date.getFullYear());
  const monthName = MONTH_NAMES[date.getMonth()];

  switch (format) {
    case 'MM/DD/YYYY':
      return `${month}/${day}/${year}`;
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;
    case 'DD-MMM-YYYY':
      return `${day}-${monthName}-${year}`;
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`;
  }
};

export const formatReportCurrency = (
  value: unknown,
  preferences: Pick<AppPreferences, 'formats'>,
) => {
  if (value === null || value === undefined || value === '') return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);

  const currencyMeta = CURRENCY_OPTIONS.find(
    (option) => option.code === preferences.formats.currencyCode,
  );

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: preferences.formats.decimalPlaces,
    maximumFractionDigits: preferences.formats.decimalPlaces,
    useGrouping: preferences.formats.thousandSeparator,
  });

  return `${currencyMeta?.symbol || preferences.formats.currencySymbol} ${formatted}`;
};
