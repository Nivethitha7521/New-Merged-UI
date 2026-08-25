'use client';

import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type DensityMode = 'comfortable' | 'compact';
export type TopbarMode = 'auto' | 'compact' | 'normal';
export type FontStyle = 'default' | 'compact' | 'professional';
export type FontSize = 'small' | 'medium' | 'large';
export type TableTextSize = 'small' | 'medium' | 'large';
export type CardStyle = 'solid' | 'tinted' | 'elevated';
export type TableStyle = 'plain' | 'striped' | 'grid';
export type DefaultDateRange = 'today' | 'current-month' | 'current-year';
export type ClearFiltersBehavior = 'reset-to-defaults' | 'clear-all';
export type ExportType = 'excel' | 'pdf';
export type PdfPageSize = 'a4' | 'a3';
export type PdfOrientation = 'auto' | 'portrait' | 'landscape';
export type TimeFormat = '12-hour' | '24-hour';
export type DateFormatOption = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD' | 'DD-MMM-YYYY';
export type CurrencyOption = 'INR' | 'USD' | 'EUR' | 'GBP' | 'AED';
export type DecimalPlaces = 0 | 2;

export interface AppPreferences {
  branding: {
    clientLogoUrl: string;
    companyName: string;
    reportName: string;
    headerTitle: string;
    exportLogoEnabled: boolean;
  };
  theme: {
    mode: ThemeMode;
    primaryColor: string;
    accentColor: string;
    cardStyle: CardStyle;
    tableStyle: TableStyle;
  };
  layout: {
    sidebarDefaultCollapsed: boolean;
    topbarMode: TopbarMode;
    pageDensity: DensityMode;
    fullscreenDefault: boolean;
  };
  typography: {
    fontStyle: FontStyle;
    fontSize: FontSize;
    tableTextSize: TableTextSize;
  };
  reportTable: {
    defaultRowsPerPage: number;
    stickyTableHeader: boolean;
    compactTableRows: boolean;
    showSerialNumberColumn: boolean;
    defaultColumnVisibility: Record<string, string[]>;
    rememberSelectedColumns: boolean;
  };
  filters: {
    rememberLastUsed: boolean;
    autoApply: boolean;
    defaultDateRange: DefaultDateRange;
    defaultLocation: string;
    showActiveFilterChips: boolean;
    clearFiltersBehavior: ClearFiltersBehavior;
  };
  export: {
    defaultExportType: ExportType;
    pdfPageSize: PdfPageSize;
    pdfOrientation: PdfOrientation;
    includeLogoInExport: boolean;
    includeFiltersInExportHeader: boolean;
    includeGeneratedDateTime: boolean;
    exportSelectedColumnsOnly: boolean;
  };
  dashboard: {
    autoRefresh: boolean;
    autoRefreshInterval: number;
    showSummaryCards: boolean;
    showCharts: boolean;
    defaultLandingPage: string;
  };
  formats: {
    dateFormat: DateFormatOption;
    timeFormat: TimeFormat;
    currencyCode: CurrencyOption;
    currencySymbol: string;
    decimalPlaces: DecimalPlaces;
    thousandSeparator: boolean;
  };
}

interface PreferencesContextValue {
  preferences: AppPreferences;
  /** 'light' | 'dark' — theme.mode resolved to an actual value ('system' resolved via the OS preference). Use this for conditional styling instead of comparing preferences.theme.mode directly. */
  resolvedThemeMode: 'light' | 'dark';
  isReady: boolean;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  setPreferences: React.Dispatch<React.SetStateAction<AppPreferences>>;
  resetPreferences: () => void;
  importPreferences: (json: string) => { ok: boolean; message: string };
  exportPreferences: () => string;
  setDefaultColumnsForReport: (reportKey: string, columns: string[]) => void;
}

export const DATE_FORMAT_OPTIONS: DateFormatOption[] = [
  'DD/MM/YYYY',
  'MM/DD/YYYY',
  'YYYY-MM-DD',
  'DD-MMM-YYYY',
];

export const CURRENCY_OPTIONS: Array<{ code: CurrencyOption; label: string; symbol: string }> = [
  { code: 'INR', label: '₹ INR', symbol: '₹' },
  { code: 'USD', label: '$ USD', symbol: '$' },
  { code: 'EUR', label: '€ EUR', symbol: '€' },
  { code: 'GBP', label: '£ GBP', symbol: '£' },
  { code: 'AED', label: 'د.إ AED', symbol: 'د.إ' },
];

const DEFAULT_PREFERENCES: AppPreferences = {
  branding: {
    clientLogoUrl: '',
    companyName: 'Yen ERP',
    reportName: 'Reports UI',
    headerTitle: '',
    exportLogoEnabled: true,
  },
  theme: {
    mode: 'system',
    primaryColor: '#1E3A5F',
    accentColor: '#1A4D7C',
    cardStyle: 'solid',
    tableStyle: 'striped',
  },
  layout: {
    sidebarDefaultCollapsed: true,
    topbarMode: 'auto',
    pageDensity: 'compact',
    fullscreenDefault: false,
  },
  typography: {
    fontStyle: 'default',
    fontSize: 'medium',
    tableTextSize: 'medium',
  },
  reportTable: {
    defaultRowsPerPage: 30,
    stickyTableHeader: true,
    compactTableRows: false,
    showSerialNumberColumn: false,
    defaultColumnVisibility: {},
    rememberSelectedColumns: true,
  },
  filters: {
    rememberLastUsed: true,
    autoApply: true,
    defaultDateRange: 'today',
    defaultLocation: '',
    showActiveFilterChips: true,
    clearFiltersBehavior: 'reset-to-defaults',
  },
  export: {
    defaultExportType: 'excel',
    pdfPageSize: 'a4',
    pdfOrientation: 'auto',
    includeLogoInExport: true,
    includeFiltersInExportHeader: true,
    includeGeneratedDateTime: true,
    exportSelectedColumnsOnly: true,
  },
  dashboard: {
    autoRefresh: false,
    autoRefreshInterval: 300,
    showSummaryCards: true,
    showCharts: true,
    defaultLandingPage: '/QlikReport/PurchaseOrder/Purchaseorder',
  },
  formats: {
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    currencyCode: 'INR',
    currencySymbol: '₹',
    decimalPlaces: 2,
    thousandSeparator: true,
  },
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const canUseDOM = () => typeof window !== 'undefined';

const getStorageKey = (username: string) =>
  `yenerp:user-preferences:${(username || 'guest').trim().toLowerCase()}`;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]';

const deepMerge = <T,>(base: T, incoming: unknown): T => {
  if (!isPlainObject(base) || !isPlainObject(incoming)) {
    return (incoming ?? base) as T;
  }

  const output: Record<string, unknown> = { ...base };

  Object.entries(incoming).forEach(([key, value]) => {
    const current = output[key];
    if (Array.isArray(current) || Array.isArray(value)) {
      output[key] = value;
      return;
    }

    if (isPlainObject(current) && isPlainObject(value)) {
      output[key] = deepMerge(current, value);
      return;
    }

    output[key] = value;
  });

  return output as T;
};

const hexToRgb = (hex: string) => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { r: 30, g: 58, b: 95 };
  return {
    r: Number.parseInt(clean.slice(0, 2), 16),
    g: Number.parseInt(clean.slice(2, 4), 16),
    b: Number.parseInt(clean.slice(4, 6), 16),
  };
};

const fontSizeScale: Record<FontSize, string> = {
  small: '0.8125rem',
  medium: '0.875rem',
  large: '0.9375rem',
};

const fontFamilyByStyle: Record<FontStyle, string> = {
  default: "'Poppins', system-ui, sans-serif",
  compact: "'Segoe UI', 'Roboto', system-ui, sans-serif",
  professional: "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif",
};

const normalizePreferences = (value: unknown) => {
  const merged = deepMerge(DEFAULT_PREFERENCES, value);
  const currency = CURRENCY_OPTIONS.find((option) => option.code === merged.formats.currencyCode);

  return {
    ...merged,
    formats: {
      ...merged.formats,
      currencySymbol: currency?.symbol || merged.formats.currencySymbol,
    },
  };
};

export const sanitizePreferences = (value: unknown) => normalizePreferences(value);

export function PreferencesProvider({
  children,
  username,
}: {
  children: React.ReactNode;
  username: string;
}) {
  const [preferences, setPreferences] = useState<AppPreferences>(DEFAULT_PREFERENCES);
  const [isReady, setIsReady] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);
  const activeKeyRef = useRef('');

  /**
   * Live OS color-scheme tracking, so 'system' mode updates immediately
   * if the user flips their OS theme while the app is open.
   */
  useEffect(() => {
    if (!canUseDOM() || !window.matchMedia) return;

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(mql.matches);

    const handleChange = (event: MediaQueryListEvent) => setSystemPrefersDark(event.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  const resolvedThemeMode: 'light' | 'dark' =
    preferences.theme.mode === 'system'
      ? (systemPrefersDark ? 'dark' : 'light')
      : preferences.theme.mode;

  useEffect(() => {
    if (!canUseDOM()) return;

    const storageKey = getStorageKey(username);
    activeKeyRef.current = storageKey;

    try {
      const raw = window.localStorage.getItem(storageKey);
      setPreferences(raw ? sanitizePreferences(JSON.parse(raw)) : DEFAULT_PREFERENCES);
    } catch {
      setPreferences(DEFAULT_PREFERENCES);
    } finally {
      setIsReady(true);
    }
  }, [username]);

  useEffect(() => {
    if (!canUseDOM() || !isReady || !activeKeyRef.current) return;
    window.localStorage.setItem(activeKeyRef.current, JSON.stringify(preferences));
  }, [isReady, preferences]);

  useEffect(() => {
    if (!canUseDOM()) return;

    const root = document.documentElement;
    const body = document.body;
    const primaryRgb = hexToRgb(preferences.theme.primaryColor);
    const accentRgb = hexToRgb(preferences.theme.accentColor);
    const darkMode = resolvedThemeMode === 'dark';

    const bg = darkMode ? '#0F172A' : '#F1F5F9';
    const card = darkMode ? '#1E293B' : '#FFFFFF';
    const text = darkMode ? '#E2E8F0' : '#0F172A';
    const textMuted = darkMode ? '#94A3B8' : '#64748B';
    const border = darkMode ? '#334155' : '#E2E8F0';
    const header = darkMode ? '#102033' : '#FFFFFF';
    const surface = darkMode ? '#162334' : '#F8FAFC';
    const surfaceStrong = darkMode ? '#1D2A3B' : '#FFFFFF';
    const chip = darkMode ? 'rgba(30, 41, 59, 0.92)' : '#FFFFFF';
    const input = darkMode ? '#0F1A2A' : '#FFFFFF';

    root.style.setProperty('--app-bg', bg);
    root.style.setProperty('--app-card', card);
    root.style.setProperty('--app-header', header);
    root.style.setProperty('--app-surface', surface);
    root.style.setProperty('--app-surface-strong', surfaceStrong);
    root.style.setProperty('--app-chip', chip);
    root.style.setProperty('--app-input-bg', input);
    root.style.setProperty('--app-navy', preferences.theme.primaryColor || '#1E3A5F');
    root.style.setProperty('--app-accent', preferences.theme.accentColor || '#1A4D7C');
    root.style.setProperty('--app-border', border);
    root.style.setProperty('--app-text', text);
    root.style.setProperty('--app-text-muted', textMuted);
    root.style.setProperty('--app-font-family', fontFamilyByStyle[preferences.typography.fontStyle]);
    root.style.setProperty('--app-font-size', fontSizeScale[preferences.typography.fontSize]);
    root.style.setProperty('--app-primary-rgb', `${primaryRgb.r} ${primaryRgb.g} ${primaryRgb.b}`);
    root.style.setProperty('--app-accent-rgb', `${accentRgb.r} ${accentRgb.g} ${accentRgb.b}`);
    root.style.setProperty(
      '--app-table-font-size',
      preferences.typography.tableTextSize === 'small'
        ? '0.75rem'
        : preferences.typography.tableTextSize === 'large'
          ? '0.875rem'
          : '0.8125rem',
    );

    body.dataset.theme = resolvedThemeMode;
    body.dataset.density = preferences.layout.pageDensity;
    body.dataset.fontStyle = preferences.typography.fontStyle;
    body.style.colorScheme = darkMode ? 'dark' : 'light';
  }, [preferences, resolvedThemeMode]);

  const resetPreferences = () => setPreferences(DEFAULT_PREFERENCES);

  const exportPreferences = () => JSON.stringify(preferences, null, 2);

  const importPreferences = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      setPreferences(sanitizePreferences(parsed));
      return { ok: true, message: 'Preferences imported successfully.' };
    } catch {
      return { ok: false, message: 'Invalid JSON. Preferences were not changed.' };
    }
  };

  const setDefaultColumnsForReport = (reportKey: string, columns: string[]) => {
    setPreferences((prev) => ({
      ...prev,
      reportTable: {
        ...prev.reportTable,
        defaultColumnVisibility: {
          ...prev.reportTable.defaultColumnVisibility,
          [reportKey]: columns,
        },
      },
    }));
  };

  const value = useMemo(
    () => ({
      preferences,
      resolvedThemeMode,
      isReady,
      isDrawerOpen,
      openDrawer: () => setIsDrawerOpen(true),
      closeDrawer: () => setIsDrawerOpen(false),
      setPreferences,
      resetPreferences,
      importPreferences,
      exportPreferences,
      setDefaultColumnsForReport,
    }),
    [isDrawerOpen, isReady, preferences, resolvedThemeMode],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export const usePreferences = () => {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider');
  return ctx;
};

export const defaultPreferences = DEFAULT_PREFERENCES;
