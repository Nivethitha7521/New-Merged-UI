'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type DisplayTheme = 'light' | 'dark';
export type DisplayStyle = 'classic' | 'modern' | 'glass';
export type DisplayFont =
  | 'Inter'
  | 'Poppins'
  | 'Roboto'
  | 'Source Sans 3'
  | 'IBM Plex Sans'
  | 'Open Sans';
export type DisplayFontSize = 'small' | 'medium' | 'large';
export type DisplayLanguage = 'en';
export type DisplayCurrency = 'INR' | 'USD' | 'EUR' | 'GBP';
export type NavigationLayout = 'sidebar' | 'tabs';

export interface DisplaySettings {
  theme: DisplayTheme;
  accentColor: string;
  uiStyle: DisplayStyle;
  fontFamily: DisplayFont;
  fontSize: DisplayFontSize;
  language: DisplayLanguage;
  currency: DisplayCurrency;
  navigationLayout: NavigationLayout;
}

export const DEFAULT_DISPLAY_SETTINGS: DisplaySettings = {
  theme: 'light',
 accentColor: '#155eef',
  uiStyle: 'modern',
  fontFamily: 'Inter',
  fontSize: 'medium',
  language: 'en',
  currency: 'INR',
  navigationLayout: 'sidebar',
};

interface DisplaySettingsContextValue {
  settings: DisplaySettings;
  previewSettings: (next: DisplaySettings) => void;
  saveSettings: (next: DisplaySettings) => void;
  resetSettings: () => void;
  formatCurrency: (amount: number) => string;
}

const DisplaySettingsContext = createContext<DisplaySettingsContextValue | null>(null);

const FONT_STACKS: Record<DisplayFont, string> = {
  Inter: 'Inter, Arial, sans-serif',
  Poppins: 'Poppins, Arial, sans-serif',
  Roboto: 'Roboto, Arial, sans-serif',
  'Source Sans 3': '"Source Sans 3", Arial, sans-serif',
  'IBM Plex Sans': '"IBM Plex Sans", Arial, sans-serif',
  'Open Sans': '"Open Sans", Arial, sans-serif',
};

const FONT_SCALES: Record<DisplayFontSize, string> = {
  small: '0.92',
  medium: '1',
  large: '1.08',
};

const getStorageKey = () => {
  if (typeof window === 'undefined') return 'erp:display-settings:anonymous';
  const tenant = sessionStorage.getItem('tenant_id') || 'default';
  const user = sessionStorage.getItem('username') || localStorage.getItem('username') || 'anonymous';
  return `erp:display-settings:${tenant}:${user}`;
};

const normaliseSettings = (value: Partial<DisplaySettings> | null): DisplaySettings => ({
  ...DEFAULT_DISPLAY_SETTINGS,
  ...(value || {}),
});
const getPersistedNavigationLayout = (): NavigationLayout | null => {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem('erp:navigation-layout');
  return value === 'sidebar' || value === 'tabs' ? value : null;
};
const normalizeHex = (value: string) => {
  const hex = value.replace('#', '').trim();

  if (hex.length === 3) {
    return `#${hex
      .split('')
      .map((character) => character + character)
      .join('')}`;
  }

  return `#${hex.padEnd(6, '0').slice(0, 6)}`;
};

const hexToRgb = (value: string) => {
  const hex = normalizeHex(value).replace('#', '');

  return {
    r: parseInt(hex.slice(0, 2), 16),
    g: parseInt(hex.slice(2, 4), 16),
    b: parseInt(hex.slice(4, 6), 16),
  };
};

const getReadableTextColor = (value: string) => {
  const { r, g, b } = hexToRgb(value);

  const luminance =
    (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.63 ? '#101828' : '#ffffff';
};
// const PREMIUM_COLOR_PRESETS: Record<string, { light: string; hover: string; text: string }> = {
//   '#2563EB': { light: '#93C5FD', hover: '#1D4ED8', text: '#FFFFFF' },
//   '#059669': { light: '#6EE7B7', hover: '#047857', text: '#FFFFFF' },
//   '#1F2937': { light: '#4B5563', hover: '#111827', text: '#FFFFFF' },
//   '#4F46E5': { light: '#A5B4FC', hover: '#4338CA', text: '#FFFFFF' },
// };
const applySettingsToDocument = (
  settings: DisplaySettings,
) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const accent = normalizeHex(
    settings.accentColor,
  );

  const { r, g, b } = hexToRgb(accent);
  //  const preset = PREMIUM_COLOR_PRESETS[accent.toUpperCase()];
  // const accentText = preset?.text ?? getReadableTextColor(accent);
  // const accentHover = preset?.hover ?? `color-mix(in srgb, ${accent} 86%, black)`;
  // const accentLight = preset?.light ?? `color-mix(in srgb, ${accent} 14%, white)`;

  root.dataset.erpTheme = settings.theme;
  root.dataset.erpStyle = settings.uiStyle;
  root.dataset.erpFontSize = settings.fontSize;
  root.dataset.erpNavigationLayout = settings.navigationLayout;

  root.style.setProperty(
    '--erp-accent',
    accent,
  );

  root.style.setProperty(
    '--erp-accent-rgb',
    `${r}, ${g}, ${b}`,
  );

  root.style.setProperty(
    '--erp-accent-contrast',
   getReadableTextColor(accent),
  );

  root.style.setProperty(
    '--erp-accent-hover',
  `color-mix(in srgb, ${accent} 86%, black)`,
  );

  root.style.setProperty(
    '--erp-accent-soft',
    `color-mix(in srgb, ${accent} 14%, white)`,
  );

  root.style.setProperty(
    '--erp-accent-soft-hover',
    `color-mix(in srgb, ${accent} 22%, white)`,
  );

  root.style.setProperty(
    '--erp-accent-border',
    `color-mix(in srgb, ${accent} 38%, white)`,
  );

  root.style.setProperty(
    '--erp-accent-ring',
    `rgba(${r}, ${g}, ${b}, 0.16)`,
  );

  /*
    Compatibility variables used by existing CSS.
  */
  root.style.setProperty(
    '--erp-blue',
    accent,
  );

  root.style.setProperty(
    '--erp-primary',
    accent,
  );

  root.style.setProperty(
    '--erp-blue-soft',
     `color-mix(in srgb, ${accent} 14%, white)`,
  );

  root.style.setProperty(
    '--erp-font-family',
    FONT_STACKS[settings.fontFamily],
  );

  root.style.setProperty(
    '--erp-font-scale',
    FONT_SCALES[settings.fontSize],
  );

  root.style.colorScheme = settings.theme;
  root.lang = settings.language;

  window.localStorage.setItem(
    'erp:display-settings:active',
    JSON.stringify(settings),
  );

  window.dispatchEvent(
    new CustomEvent(
      'erp-display-settings-change',
      {
        detail: settings,
      },
    ),
  );
};

export const DisplaySettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<DisplaySettings>(DEFAULT_DISPLAY_SETTINGS);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(getStorageKey());
      const parsed = raw ? JSON.parse(raw) as Partial<DisplaySettings> : null;
      const persistedNavigationLayout = getPersistedNavigationLayout();
      const restored = normaliseSettings({
        ...(parsed || {}),
        ...(parsed?.navigationLayout
          ? {}
         : persistedNavigationLayout
            ? { navigationLayout: persistedNavigationLayout }
            : {}),
      });
      setSettings(restored);
      applySettingsToDocument(restored);
    } catch {
      setSettings(DEFAULT_DISPLAY_SETTINGS);
      applySettingsToDocument(DEFAULT_DISPLAY_SETTINGS);
    }
  }, []);

  const previewSettings = useCallback((next: DisplaySettings) => {
    const safe = normaliseSettings(next);
    setSettings(safe);
    applySettingsToDocument(safe);
  }, []);

  const saveSettings = useCallback((next: DisplaySettings) => {
    const safe = normaliseSettings(next);
    localStorage.setItem(getStorageKey(), JSON.stringify(safe));
    localStorage.setItem('erp:navigation-layout', safe.navigationLayout);
    setSettings(safe);
    applySettingsToDocument(safe);
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(getStorageKey());
    localStorage.removeItem('erp:navigation-layout');
    setSettings(DEFAULT_DISPLAY_SETTINGS);
    applySettingsToDocument(DEFAULT_DISPLAY_SETTINGS);
  }, []);

  const formatCurrency = useCallback((amount: number) => {
    const locale = settings.currency === 'INR' ? 'en-IN' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: settings.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number.isFinite(amount) ? amount : 0);
  }, [settings.currency]);

  const value = useMemo(() => ({
    settings,
    previewSettings,
    saveSettings,
    resetSettings,
    formatCurrency,
  }), [settings, previewSettings, saveSettings, resetSettings, formatCurrency]);

  return (
    <DisplaySettingsContext.Provider value={value}>
      {children}
    </DisplaySettingsContext.Provider>
  );
};

export const useDisplaySettings = () => {
  const context = useContext(DisplaySettingsContext);
  if (!context) throw new Error('useDisplaySettings must be used within DisplaySettingsProvider');
  return context;
};
