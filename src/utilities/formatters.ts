
type GlobalDisplaySettings = {
  timezone?: string;
  dateFormat?: string;
  timeFormat?: '12h' | '24h';
  showSeconds?: boolean;
  currency?: string;
  // Value of 1 INR expressed in each currency. All amounts are stored and
  // calculated in INR everywhere else in the app -- these rates are used
  // ONLY to convert for on-screen display, never to change stored data.
  exchangeRates?: Record<string, number>;
};

const DEFAULT_GLOBAL_DISPLAY_SETTINGS: GlobalDisplaySettings = {
  timezone: 'Asia/Kolkata',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12h',
  showSeconds: false,
  currency: 'INR',
  exchangeRates: { INR: 1, USD: 0.010531, EUR: 0.0090, GBP: 0.00779 },
};

const getGlobalDisplaySettings = (): GlobalDisplaySettings => {
  if (typeof window === 'undefined') {
    return DEFAULT_GLOBAL_DISPLAY_SETTINGS;
  }

  try {
    const raw = localStorage.getItem(
      'erp:display-settings:active'
    );

    if (!raw) {
      return DEFAULT_GLOBAL_DISPLAY_SETTINGS;
    }

    return {
      ...DEFAULT_GLOBAL_DISPLAY_SETTINGS,
      ...JSON.parse(raw),
    };
  } catch {
    return DEFAULT_GLOBAL_DISPLAY_SETTINGS;
  }
};

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const buildFormattedDate = (
  day: string,
  month: string,
  year: string,
  format: string
) => {
  const monthName =
    MONTHS[Number(month) - 1] || month;

  switch (format) {
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;

    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`;

    case 'DD MMM YYYY':
      return `${day} ${monthName} ${year}`;

    case 'MMM DD, YYYY':
      return `${monthName} ${day}, ${year}`;

    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`;
  }
};
// utils/formatters.ts
export const roundPrice = (price: number): number => {
  return Math.round(price * 100) / 100;
};

export const formatCurrency = (
  amount: number
): string => {
  const settings =
    getGlobalDisplaySettings();

  const currency =
    settings.currency || 'INR';

  const locale =
    currency === 'INR'
      ? 'en-IN'
      : 'en-US';

  const safeAmount =
    Number.isFinite(amount)
      ? amount
      : 0;

  // All amounts are stored/calculated in INR. Convert to the selected
  // display currency using the cached rate from localStorage -- synchronous,
  // no network call, so this stays fast even called many times per render.
  const rate =
    (settings.exchangeRates &&
      settings.exchangeRates[currency]) ??
    1;

  const convertedAmount =
    currency === 'INR'
      ? safeAmount
      : safeAmount * rate;

  return new Intl.NumberFormat(
    locale,
    {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  ).format(convertedAmount);
};

export const formatDate = (
  value: string | Date | null | undefined
): string => {
  if (!value) return '-';

  const settings =
    getGlobalDisplaySettings();

  /*
    Date-only value.
    Example:
    2026-09-01

    இதுக்கு timezone conversion செய்யக்கூடாது.
  */
  if (
    typeof value === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    const [year, month, day] =
      value.split('-');

    return buildFormattedDate(
      day,
      month,
      year,
      settings.dateFormat ||
        'DD/MM/YYYY'
    );
  }

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const timezone =
    settings.timezone ||
    'Asia/Kolkata';

  const parts =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone: timezone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    ).formatToParts(date);

  const getPart = (type: string) =>
    parts.find(
      (part) =>
        part.type === type
    )?.value || '';

  return buildFormattedDate(
    getPart('day'),
    getPart('month'),
    getPart('year'),
    settings.dateFormat ||
      'DD/MM/YYYY'
  );
};

export const formatDateTime = (
  value: string | Date | null | undefined
): string => {
  if (!value) return '-';

  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const settings =
    getGlobalDisplaySettings();

  const timezone =
    settings.timezone ||
    'Asia/Kolkata';

  const dateParts =
    new Intl.DateTimeFormat(
      'en-US',
      {
        timeZone: timezone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }
    ).formatToParts(date);

  const getPart = (type: string) =>
    dateParts.find(
      (part) =>
        part.type === type
    )?.value || '';

  const formattedDate =
    buildFormattedDate(
      getPart('day'),
      getPart('month'),
      getPart('year'),
      settings.dateFormat ||
        'DD/MM/YYYY'
    );

  const timeOptions:
    Intl.DateTimeFormatOptions = {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12:
        settings.timeFormat !== '24h',
    };

  if (settings.showSeconds) {
    timeOptions.second = '2-digit';
  }

  const formattedTime =
    new Intl.DateTimeFormat(
      'en-US',
      timeOptions
    ).format(date);

  return `${formattedDate} ${formattedTime}`;
};

export const safeToISOString = (date: Date | string | null): string => {
  if (!date) return '';
  try {
    const dateObj = date instanceof Date ? date : new Date(date);
    return dateObj.toISOString();
  } catch {
    return '';
  }
};

export const parseDateString = (dateString: string | null): Date | null => {
  if (!dateString) return null;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
};