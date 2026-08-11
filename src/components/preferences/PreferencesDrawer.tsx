'use client';

import React, { useMemo, useRef } from 'react';
import {
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineCog6Tooth,
  HiOutlineXMark,
} from 'react-icons/hi2';
import {
  CURRENCY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  usePreferences,
} from './PreferencesContext';

const sectionTitleClass =
  'text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--app-text-muted)]';

const labelClass = 'text-[12px] font-semibold text-[var(--app-text)]';

const inputClass =
  'h-10 w-full rounded-xl border border-[var(--app-border)] bg-[var(--app-input-bg)] px-3 text-sm text-[var(--app-text)] outline-none transition focus:border-[var(--app-accent)] focus:ring-2 focus:ring-[color:rgba(var(--app-accent-rgb),0.14)]';

const readonlyInputClass =
  'h-10 w-full cursor-not-allowed rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 text-sm text-[var(--app-text-muted)] outline-none opacity-90';

const checkboxClass =
  'h-4 w-4 rounded border-[var(--app-border)] bg-[var(--app-input-bg)] text-[var(--app-accent)] focus:ring-[var(--app-accent)]';

function SettingCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-2xl border border-[var(--app-border)] bg-[var(--app-surface-strong)] p-4 shadow-sm">
      <h3 className={sectionTitleClass}>{title}</h3>
      {children}
    </section>
  );
}

export default function PreferencesDrawer() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    preferences,
    resolvedThemeMode,
    isDrawerOpen,
    closeDrawer,
    setPreferences,
    resetPreferences,
    importPreferences,
    exportPreferences,
  } = usePreferences();

  const isAdminUser = useMemo(() => {
    if (typeof window === 'undefined') return false;

    const username =
      localStorage.getItem('username') ||
      localStorage.getItem('userName') ||
      localStorage.getItem('operatorName') ||
      sessionStorage.getItem('username') ||
      '';

    const role =
      localStorage.getItem('role') ||
      localStorage.getItem('userRole') ||
      sessionStorage.getItem('role') ||
      '';

    const normalizedUsername = username.trim().toLowerCase();
    const normalizedRole = role.trim().toLowerCase();

    return (
      normalizedUsername === 'admin' ||
      normalizedUsername === 'superadmin' ||
      normalizedRole === 'admin' ||
      normalizedRole === 'superadmin'
    );
  }, []);

  const update = <K extends keyof typeof preferences>(
    section: K,
    patch: Partial<(typeof preferences)[K]>
  ) => {
    setPreferences((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        ...patch,
      },
    }));
  };

  /**
   * Future use:
   * Import / Export JSON functionality is kept here,
   * but the buttons are hidden from the current settings UI.
   */
  const exportJson = useMemo(() => exportPreferences(), [exportPreferences]);

  const handleDownload = () => {
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'yenerp-preferences.json';
    link.click();

    URL.revokeObjectURL(url);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const text = await file.text();

    importPreferences(text);
    event.target.value = '';
  };

  return (
    <div
      className={`fixed inset-0 z-[120] transition ${
        isDrawerOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      aria-hidden={!isDrawerOpen}
    >
      <button
        type="button"
        className={`absolute inset-0 bg-slate-950/30 backdrop-blur-sm transition-opacity ${
          isDrawerOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={closeDrawer}
      />

      <aside
        className={`absolute right-0 top-0 flex h-full w-full flex-col border-l border-[var(--app-border)] bg-[var(--app-card)] shadow-2xl transition-transform duration-200 sm:max-w-[440px] xl:max-w-[480px] ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-[var(--app-border)] bg-[var(--app-header)] px-4 py-4 sm:px-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--app-accent)] text-white shadow-sm">
              <HiOutlineCog6Tooth size={20} />
            </div>

            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--app-text-muted)]">
                User Preferences
              </p>

              <h2 className="truncate text-lg font-semibold text-[var(--app-text)]">
                ERP Settings Center
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={closeDrawer}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--app-border)] bg-[var(--app-input-bg)] text-[var(--app-text-muted)] transition hover:text-[var(--app-text)]"
            aria-label="Close settings"
          >
            <HiOutlineXMark size={18} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 border-b border-[var(--app-border)] bg-[var(--app-surface)] px-4 py-3 sm:px-5">
          {/*
            Future use only.

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-input-bg)] px-3 text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--app-accent)]"
            >
              <HiOutlineArrowDownTray size={16} />
              Export JSON
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-input-bg)] px-3 text-sm font-semibold text-[var(--app-text)] transition hover:border-[var(--app-accent)]"
            >
              <HiOutlineArrowUpTray size={16} />
              Import JSON
            </button>
          */}

          <button
            type="button"
            onClick={resetPreferences}
            className="inline-flex h-10 items-center rounded-xl bg-[var(--app-accent)] px-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Reset Defaults
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={handleImport}
          />
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-[var(--app-bg)] px-4 py-4 sm:px-5">
          {isAdminUser && (
            <SettingCard title="Branding Settings">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-1 md:col-span-2">
                  <span className={labelClass}>Client logo URL</span>
                  <input
                    className={readonlyInputClass}
                    value={preferences.branding.clientLogoUrl}
                    readOnly
                    disabled
                    title="Branding can be changed only from Admin Control."
                  />
                </label>

                <label className="space-y-1">
                  <span className={labelClass}>Company/report name</span>
                  <input
                    className={readonlyInputClass}
                    value={preferences.branding.companyName}
                    readOnly
                    disabled
                    title="Branding can be changed only from Admin Control."
                  />
                </label>

                <label className="space-y-1">
                  <span className={labelClass}>Report name</span>
                  <input
                    className={readonlyInputClass}
                    value={preferences.branding.reportName}
                    readOnly
                    disabled
                    title="Branding can be changed only from Admin Control."
                  />
                </label>

                <label className="space-y-1 md:col-span-2">
                  <span className={labelClass}>Header title</span>
                  <input
                    className={readonlyInputClass}
                    value={preferences.branding.headerTitle}
                    readOnly
                    disabled
                    title="Branding can be changed only from Admin Control."
                  />
                </label>

                <label className="flex cursor-not-allowed items-center gap-2 text-sm text-[var(--app-text-muted)]">
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={preferences.branding.exportLogoEnabled}
                    readOnly
                    disabled
                  />
                  PDF/Excel logo enable
                </label>

                <p className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-medium text-[var(--app-text-muted)] md:col-span-2">
                  Branding details are display-only here. Edit access will be handled from
                  Admin Control.
                </p>
              </div>
            </SettingCard>
          )}

          <SettingCard title="Theme Settings">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className={labelClass}>Mode</span>
                <select
                  className={inputClass}
                  value={preferences.theme.mode}
                  onChange={(e) =>
                    update('theme', {
                      mode: e.target.value as typeof preferences.theme.mode,
                    })
                  }
                >
                  <option value="system">Match system ({resolvedThemeMode === 'dark' ? 'Dark' : 'Light'} now)</option>
                  <option value="light">Light mode</option>
                  <option value="dark">Dark mode</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className={labelClass}>Card/table style</span>
                <select
                  className={inputClass}
                  value={preferences.theme.tableStyle}
                  onChange={(e) =>
                    update('theme', {
                      tableStyle: e.target.value as typeof preferences.theme.tableStyle,
                    })
                  }
                >
                  <option value="plain">Plain</option>
                  <option value="striped">Striped</option>
                  <option value="grid">Grid</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className={labelClass}>Primary color</span>
                <input
                  className={`${inputClass} p-1`}
                  type="color"
                  value={preferences.theme.primaryColor}
                  onChange={(e) => update('theme', { primaryColor: e.target.value })}
                />
              </label>

              <label className="space-y-1">
                <span className={labelClass}>Accent color</span>
                <input
                  className={`${inputClass} p-1`}
                  type="color"
                  value={preferences.theme.accentColor}
                  onChange={(e) => update('theme', { accentColor: e.target.value })}
                />
              </label>
            </div>
          </SettingCard>

          <SettingCard title="Layout Settings">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-[var(--app-text)]">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={preferences.layout.sidebarDefaultCollapsed}
                  onChange={(e) =>
                    update('layout', { sidebarDefaultCollapsed: e.target.checked })
                  }
                />
                Sidebar open/collapse default
              </label>

              <label className="space-y-1">
                <span className={labelClass}>Topbar compact/normal</span>
                <select
                  className={inputClass}
                  value={preferences.layout.topbarMode}
                  onChange={(e) =>
                    update('layout', {
                      topbarMode: e.target.value as typeof preferences.layout.topbarMode,
                    })
                  }
                >
                  <option value="auto">Auto</option>
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className={labelClass}>Page density</span>
                <select
                  className={inputClass}
                  value={preferences.layout.pageDensity}
                  onChange={(e) =>
                    update('layout', {
                      pageDensity: e.target.value as typeof preferences.layout.pageDensity,
                    })
                  }
                >
                  <option value="comfortable">Comfortable</option>
                  <option value="compact">Compact</option>
                </select>
              </label>

              <label className="flex items-center gap-2 text-sm text-[var(--app-text)]">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={preferences.layout.fullscreenDefault}
                  onChange={(e) => update('layout', { fullscreenDefault: e.target.checked })}
                />
                Fullscreen default ON/OFF
              </label>
            </div>
          </SettingCard>

          <SettingCard title="Typography Settings">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1">
                <span className={labelClass}>Font style</span>
                <select
                  className={inputClass}
                  value={preferences.typography.fontStyle}
                  onChange={(e) =>
                    update('typography', {
                      fontStyle: e.target.value as typeof preferences.typography.fontStyle,
                    })
                  }
                >
                  <option value="default">Default</option>
                  <option value="compact">Compact</option>
                  <option value="professional">Professional</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className={labelClass}>Font size</span>
                <select
                  className={inputClass}
                  value={preferences.typography.fontSize}
                  onChange={(e) =>
                    update('typography', {
                      fontSize: e.target.value as typeof preferences.typography.fontSize,
                    })
                  }
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className={labelClass}>Table text size</span>
                <select
                  className={inputClass}
                  value={preferences.typography.tableTextSize}
                  onChange={(e) =>
                    update('typography', {
                      tableTextSize: e.target.value as typeof preferences.typography.tableTextSize,
                    })
                  }
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </label>
            </div>
          </SettingCard>

          <SettingCard title="Report Table Settings">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className={labelClass}>Default rows per page</span>
                <input
                  className={inputClass}
                  type="number"
                  min={10}
                  max={200}
                  value={preferences.reportTable.defaultRowsPerPage}
                  onChange={(e) =>
                    update('reportTable', {
                      defaultRowsPerPage: Number(e.target.value) || 30,
                    })
                  }
                />
              </label>

              <label className="flex items-center gap-2 text-sm text-[var(--app-text)]">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={preferences.reportTable.stickyTableHeader}
                  onChange={(e) =>
                    update('reportTable', { stickyTableHeader: e.target.checked })
                  }
                />
                Sticky table header
              </label>

              <label className="flex items-center gap-2 text-sm text-[var(--app-text)]">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={preferences.reportTable.compactTableRows}
                  onChange={(e) =>
                    update('reportTable', { compactTableRows: e.target.checked })
                  }
                />
                Compact table rows
              </label>

              <label className="flex items-center gap-2 text-sm text-[var(--app-text)]">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={preferences.reportTable.showSerialNumberColumn}
                  onChange={(e) =>
                    update('reportTable', {
                      showSerialNumberColumn: e.target.checked,
                    })
                  }
                />
                Show serial number column
              </label>

              <label className="flex items-center gap-2 text-sm text-[var(--app-text)] md:col-span-2">
                <input
                  type="checkbox"
                  className={checkboxClass}
                  checked={preferences.reportTable.rememberSelectedColumns}
                  onChange={(e) =>
                    update('reportTable', {
                      rememberSelectedColumns: e.target.checked,
                    })
                  }
                />
                Remember selected columns
              </label>
            </div>
          </SettingCard>

          {/*
            Future use only.

            <SettingCard title="Filter Settings">
              Filter Settings UI removed for now.
            </SettingCard>
          */}

          <SettingCard title="Export Settings">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1">
                <span className={labelClass}>Default export type</span>
                <select
                  className={inputClass}
                  value={preferences.export.defaultExportType}
                  onChange={(e) =>
                    update('export', {
                      defaultExportType:
                        e.target.value as typeof preferences.export.defaultExportType,
                    })
                  }
                >
                  <option value="excel">Excel</option>
                  <option value="pdf">PDF</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className={labelClass}>PDF page size</span>
                <select
                  className={inputClass}
                  value={preferences.export.pdfPageSize}
                  onChange={(e) =>
                    update('export', {
                      pdfPageSize: e.target.value as typeof preferences.export.pdfPageSize,
                    })
                  }
                >
                  <option value="a4">A4</option>
                  <option value="a3">A3</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className={labelClass}>PDF orientation</span>
                <select
                  className={inputClass}
                  value={preferences.export.pdfOrientation}
                  onChange={(e) =>
                    update('export', {
                      pdfOrientation:
                        e.target.value as typeof preferences.export.pdfOrientation,
                    })
                  }
                >
                  <option value="auto">Auto</option>
                  <option value="portrait">Portrait</option>
                  <option value="landscape">Landscape</option>
                </select>
              </label>

              {[
                ['includeLogoInExport', 'Include logo in export'],
                ['includeFiltersInExportHeader', 'Include filters in export header'],
                ['includeGeneratedDateTime', 'Include generated date/time'],
                ['exportSelectedColumnsOnly', 'Export selected columns only'],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 text-sm text-[var(--app-text)]"
                >
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={
                      preferences.export[key as keyof typeof preferences.export] as boolean
                    }
                    onChange={(e) =>
                      update('export', {
                        [key]: e.target.checked,
                      } as Partial<typeof preferences.export>)
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </SettingCard>

          {/*
            Future use only.

            <SettingCard title="Dashboard/Report Behavior">
              Dashboard/Report Behavior UI removed for now.
            </SettingCard>
          */}

          <SettingCard title="Number & Date Format">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="space-y-1 md:col-span-2">
                <span className={labelClass}>Currency</span>
                <select
                  className={readonlyInputClass}
                  value="INR"
                  disabled
                  onChange={() => undefined}
                >
                  <option value="INR">₹ INR</option>
                </select>
              </label>

              <p className="rounded-xl border border-[var(--app-border)] bg-[var(--app-surface)] px-3 py-2 text-xs font-medium text-[var(--app-text-muted)] md:col-span-2">
                Currency is currently fixed to ₹ INR. Other number and date options are
                reserved for future settings.
              </p>

              {/*
                Future use only.

                <label className="space-y-1">
                  <span className={labelClass}>Date format</span>
                  <select
                    className={inputClass}
                    value={preferences.formats.dateFormat}
                    onChange={(e) =>
                      update('formats', {
                        dateFormat: e.target.value as typeof preferences.formats.dateFormat,
                      })
                    }
                  >
                    {DATE_FORMAT_OPTIONS.map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className={labelClass}>Time format</span>
                  <select
                    className={inputClass}
                    value={preferences.formats.timeFormat}
                    onChange={(e) =>
                      update('formats', {
                        timeFormat: e.target.value as typeof preferences.formats.timeFormat,
                      })
                    }
                  >
                    <option value="12-hour">12-hour</option>
                    <option value="24-hour">24-hour</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className={labelClass}>Decimal places</span>
                  <select
                    className={inputClass}
                    value={preferences.formats.decimalPlaces}
                    onChange={(e) =>
                      update('formats', {
                        decimalPlaces: Number(e.target.value) as 0 | 2,
                      })
                    }
                  >
                    <option value={0}>0</option>
                    <option value={2}>2</option>
                  </select>
                </label>

                <label className="flex items-center gap-2 text-sm text-[var(--app-text)]">
                  <input
                    type="checkbox"
                    className={checkboxClass}
                    checked={preferences.formats.thousandSeparator}
                    onChange={(e) =>
                      update('formats', { thousandSeparator: e.target.checked })
                    }
                  />
                  Thousand separator
                </label>
              */}
            </div>
          </SettingCard>
        </div>
      </aside>
    </div>
  );
}
