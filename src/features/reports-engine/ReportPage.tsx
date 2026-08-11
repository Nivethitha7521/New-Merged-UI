"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box } from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  HiOutlineAdjustmentsHorizontal,
  HiOutlineCheckCircle,
  HiOutlineDocumentText,
  HiOutlineFunnel,
} from "react-icons/hi2";
import { usePreferences } from "@/components/preferences/PreferencesContext";
import { RootState } from "@/redux/store";
import { useTopBarContext } from "@/components/reports-layout/topbar-context";
import { ReportConfig, ReportState } from "./types";
import { createReportSlice } from "./genericReportSlice";
import { useReportLogic } from "./useReportLogic";
import GenericDataTable from "./components/GenericDataTable";
import GenericColumnFilterPanel from "./components/GenericColumnFilterPanel";
import GenericFullscreenView from "./components/GenericFullscreenView";
import GlobalSnackbar from "@/components/snackbar/GlobalSnackbar";
import ReportTopBarControls from "./components/ReportTopBarControls";
import { MetricCardSkeleton } from "./components/ReportSkeleton";
import { normalizeReportRows, safeNumber } from "./reportDataNormalizer";
import { hasFiscalYearSelected } from "./queryUtils";
import { clearAllReportCaches } from "./reportCache";

type ReportSliceReturn = ReturnType<typeof createReportSlice>;

interface ReportPageProps {
  config: ReportConfig;
  thunks: ReportSliceReturn["thunks"];
  actions: ReportSliceReturn["slice"]["actions"];
  selector: (state: RootState) => ReportState;
}

const loadImageAsDataUrl = (src: string) =>
  new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas context unavailable"));

        ctx.drawImage(image, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (error) {
        reject(error);
      }
    };

    image.onerror = () => reject(new Error("Image failed to load"));
    image.src = src;
  });

function MetricCard({
  label,
  value,
  sub,
  icon,
  active,
}: {
  label: string;
  value: string | number;
  sub: string;
  icon: React.ReactElement<{ size?: number }>;
  active?: boolean;
}) {
  return (
    <div
      className={[
        "group relative overflow-hidden rounded-xl border p-2 text-left shadow-sm",
        active
          ? "border-[rgb(var(--app-primary-rgb)/0.55)] bg-[rgb(var(--app-primary-rgb)/0.12)]"
          : "border-[var(--app-border)] bg-[var(--app-card)]",
      ].join(" ")}
    >
      <div className="pointer-events-none absolute -right-5 -top-5 h-14 w-14 rounded-full bg-[rgb(var(--app-primary-rgb)/0.08)]" />

      <div className="relative flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-[9px] font-black uppercase tracking-[0.14em] text-[var(--app-text-muted)]">
            {label}
          </p>

          <p className="mt-0.5 truncate text-base font-black text-[var(--app-text)]">
            {value}
          </p>

          <p className="mt-0.5 truncate text-[10px] text-[var(--app-text-muted)]">
            {sub}
          </p>
        </div>

        <div
          className={[
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border transition",
            active
              ? "border-[rgb(var(--app-primary-rgb)/0.40)] bg-[rgb(var(--app-primary-rgb)/0.18)] text-[var(--app-accent)]"
              : "border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-muted)]",
          ].join(" ")}
        >
          {React.cloneElement(icon, { size: 14 })}
        </div>
      </div>
    </div>
  );
}

function ReportPageInner({
  config,
  thunks,
  actions,
  selector,
}: ReportPageProps) {
  const logic = useReportLogic({
    config,
    thunks,
    selector,
    actions,
  });

  const { state, dispatch, isLoading, isFilterInitialized } = logic;

  // ─── Context ────────────────────────────────────────────────────────────────
  const { setConfig, setOnRefresh } = useTopBarContext();

  // ─── Preferences ────────────────────────────────────────────────────────────
  const {
    preferences,
    isReady: preferencesReady,
    setDefaultColumnsForReport,
  } = usePreferences();

  // ─── Local state ────────────────────────────────────────────────────────────
  const [showColumnFilter, setShowColumnFilter] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const isFiscalYearSelected = useMemo(
    () => hasFiscalYearSelected(state.filters, config),
    [state.filters, config],
  );

  // ─── Derived / memoised ─────────────────────────────────────────────────────
  const defaultVisibleColumns = useMemo(
    () => config?.columns?.map((column) => column.displayKey) || [],
    [config],
  );

  const pdfAllowedColumnKeys = useMemo(
    () => defaultVisibleColumns.slice(0, 12),
    [defaultVisibleColumns],
  );

  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    defaultVisibleColumns,
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  const normalizedItems = useMemo(
    () => normalizeReportRows(state.items, config),
    [config, state.items],
  );

  const activeFilterCount = useMemo(
    () =>
      Object.values(state.filters ?? {}).filter(
        (values) => Array.isArray(values) && values.length > 0,
      ).length,
    [state.filters],
  );

  const isWaitingForCurrentData = Boolean(
    state.loading || (!state.hasLoadedOnce && isFiscalYearSelected),
  );

  const showInitialSkeleton = Boolean(
    !state.hasLoadedOnce && (state.loading || isFiscalYearSelected),
  );

  const showRefreshingOverlay = Boolean(
    state.loading && normalizedItems.length > 0,
  );

  const totalItems = safeNumber(
    state.pagination?.totalItems,
    normalizedItems.length,
  );

  // ─── Effects ─────────────────────────────────────────────────────────────────

  /**
   * Column visibility restore.
   * Safe — only stores table columns, not filters / dates.
   */
  useEffect(() => {
    const storageKey = `report-columns:${config.key}`;

    try {
      const remembered = preferences.reportTable.rememberSelectedColumns
        ? window.localStorage.getItem(storageKey)
        : window.sessionStorage.getItem(storageKey);

      const defaultColumns =
        preferences.reportTable.defaultColumnVisibility[config.key];
      const source =
        remembered ?? (defaultColumns ? JSON.stringify(defaultColumns) : null);

      if (!source) {
        setVisibleColumns(defaultVisibleColumns);
        return;
      }

      const parsed = JSON.parse(source) as string[];
      const allowed = parsed.filter((key) =>
        defaultVisibleColumns.includes(key),
      );
      setVisibleColumns(allowed.length > 0 ? allowed : defaultVisibleColumns);
    } catch {
      setVisibleColumns(defaultVisibleColumns);
    }
  }, [
    config.key,
    defaultVisibleColumns,
    preferences.reportTable.defaultColumnVisibility,
    preferences.reportTable.rememberSelectedColumns,
  ]);

  /**
   * Infinite scroll.
   */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (
        el.scrollTop + el.clientHeight >= el.scrollHeight - 100 &&
        !state.paginationLoading &&
        logic.hasMore
      ) {
        logic.fetchNext();
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [logic.fetchNext, logic.hasMore, state.paginationLoading]);

  /**
   * Responsive compact mode.
   */
  useEffect(() => {
    const syncViewportMode = () => {
      setIsCompact(
        window.innerHeight < 800 ||
          preferences.layout.pageDensity === "compact",
      );
    };

    syncViewportMode();
    window.addEventListener("resize", syncViewportMode, { passive: true });
    return () => window.removeEventListener("resize", syncViewportMode);
  }, [preferences.layout.pageDensity]);

  /**
   * Remove stale filter snapshot from localStorage so useReportLogic always
   * starts fresh with the current date.
   */
  useEffect(() => {
    if (!preferencesReady) return;
    window.localStorage.removeItem(`report-filters:${config.key}`);
  }, [config.key, preferencesReady]);

  useEffect(() => {
    if (preferences.layout.fullscreenDefault) {
      setIsFullscreen(true);
    }
  }, [preferences.layout.fullscreenDefault]);

  /**
   * Auto-refresh timer (skipped when fullscreen to avoid background fetches).
   */
  useEffect(() => {
    if (!preferences.dashboard.autoRefresh || isFullscreen) return;

    const timer = window.setInterval(
      () => {
        logic.handleSearch();
      },
      Math.max(30, preferences.dashboard.autoRefreshInterval) * 1000,
    );

    return () => window.clearInterval(timer);
  }, [
    isFullscreen,
    logic,
    preferences.dashboard.autoRefresh,
    preferences.dashboard.autoRefreshInterval,
  ]);

  // ─── Callbacks ───────────────────────────────────────────────────────────────

  /**
   * HARD REFRESH
   *
   * What this does:
   * 1. Clears ALL frontend caches — both in-memory map and sessionStorage entries
   *    that match the STORAGE_PREFIX in reportCache.ts
   * 2. Dispatches fetchReport with force=true, which buildQueryParams converts
   *    to ?refresh=true on the API URL
   * 3. The backend receives refresh=true and skips its own cache, reading
   *    directly from the database
   *
   * What this does NOT do:
   * - Does not change filters or date selections
   * - Does not reset dropdown selections
   * - Does not navigate away
   */
  const handleRefresh = React.useCallback(async () => {
    if (!isFiscalYearSelected) {
      dispatch(actions.clearReportDataForMissingFiscalYear());
      dispatch(
        actions.setSnackbar({
          message: "Select fiscal year to refresh data.",
          severity: "warning",
        }),
      );
      return;
    }

    try {
      dispatch(
        actions.setSnackbar({
          message: "Refreshing latest data...",
          severity: "info",
        }),
      );

      // Step 1 — wipe all frontend caches (memory + sessionStorage)
      clearAllReportCaches();

      // Step 2 — force fetch; buildQueryParams adds refresh=true to the URL
      await dispatch(
        thunks.fetchReport({
          page: 1,
          limit: state.pagination.limit || config.defaultPageSize || 30,
          force: true,
        }),
      ).unwrap();

      dispatch(
        actions.setSnackbar({
          message: "Latest data loaded successfully.",
          severity: "success",
        }),
      );
    } catch {
      dispatch(
        actions.setSnackbar({
          message: "Refresh failed. Please try again.",
          severity: "error",
        }),
      );
    }
  }, [
    actions,
    config.defaultPageSize,
    dispatch,
    isFiscalYearSelected,
    state.pagination.limit,
    thunks,
  ]);

  /**
   * Register handleRefresh into TopBarContext so Topbar / Sidebar buttons
   * can call it without prop drilling through AppLayout.
   * Cleanup on unmount so non-report pages get no stale handler.
   */
  useEffect(() => {
    setOnRefresh(handleRefresh);
    return () => setOnRefresh(null);
  }, [handleRefresh, setOnRefresh]);

  const persistVisibleColumns = React.useCallback(
    (nextColumns: string[]) => {
      setVisibleColumns(nextColumns);
      const serialized = JSON.stringify(nextColumns);

      if (preferences.reportTable.rememberSelectedColumns) {
        window.localStorage.setItem(`report-columns:${config.key}`, serialized);
        setDefaultColumnsForReport(config.key, nextColumns);
      } else {
        window.sessionStorage.setItem(
          `report-columns:${config.key}`,
          serialized,
        );
      }
    },
    [
      config.key,
      preferences.reportTable.rememberSelectedColumns,
      setDefaultColumnsForReport,
    ],
  );

  const handleToggleColumn = React.useCallback(
    (key: string) => {
      setVisibleColumns((prev) => {
        const next = prev.includes(key)
          ? prev.filter((column) => column !== key)
          : [...prev, key];

        const safeNext = next.length > 0 ? next : [defaultVisibleColumns[0]];
        const serialized = JSON.stringify(safeNext);

        if (preferences.reportTable.rememberSelectedColumns) {
          window.localStorage.setItem(
            `report-columns:${config.key}`,
            serialized,
          );
          setDefaultColumnsForReport(config.key, safeNext);
        } else {
          window.sessionStorage.setItem(
            `report-columns:${config.key}`,
            serialized,
          );
        }

        dispatch(
          actions.setSnackbar({
            message: "Visible columns updated.",
            severity: "success",
          }),
        );

        return safeNext;
      });
    },
    [
      actions,
      config.key,
      defaultVisibleColumns,
      dispatch,
      preferences.reportTable.rememberSelectedColumns,
      setDefaultColumnsForReport,
    ],
  );

  const handleExportPdf = React.useCallback(async () => {
    if (!isFiscalYearSelected) {
      dispatch(actions.clearReportDataForMissingFiscalYear());
      dispatch(
        actions.setSnackbar({
          message: "Select fiscal year to see the data.",
          severity: "warning",
        }),
      );
      return;
    }

    if (!state.items.length) {
      dispatch(
        actions.setSnackbar({
          message: "No data to export",
          severity: "warning",
        }),
      );
      return;
    }

    const eligibleColumns = preferences.export.exportSelectedColumnsOnly
      ? visibleColumns
      : defaultVisibleColumns;

    const columns = config.columns.filter(
      (column) =>
        eligibleColumns.includes(column.displayKey) &&
        pdfAllowedColumnKeys.includes(column.displayKey),
    );

    if (columns.length === 0) {
      dispatch(
        actions.setSnackbar({
          message:
            "PDF export uses only the approved 12 columns. Make at least one PDF-enabled column visible.",
          severity: "warning",
        }),
      );
      return;
    }

    const pdf = new jsPDF({
      orientation:
        preferences.export.pdfOrientation === "auto"
          ? columns.length > 7
            ? "landscape"
            : "portrait"
          : preferences.export.pdfOrientation,
      unit: "pt",
      format: preferences.export.pdfPageSize,
    });

    const now = new Date();
    const pad = (value: number) => value.toString().padStart(2, "0");
    const timestamp = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const prefix = config.exportFilename ?? config.title.replace(/\s+/g, "");

    const activeFilters = Object.entries(state.filters)
      .filter(([, values]) => values.length > 0)
      .map(([key, values]) => `${key}: ${values.join(", ")}`);

    let startY = 40;

    if (
      preferences.branding.exportLogoEnabled &&
      preferences.export.includeLogoInExport &&
      preferences.branding.clientLogoUrl
    ) {
      try {
        const logo = await loadImageAsDataUrl(
          preferences.branding.clientLogoUrl,
        );
        pdf.addImage(logo, "PNG", 40, 24, 36, 36);
      } catch {
        // Ignore logo failure.
      }
    }

    pdf.setFontSize(16);
    pdf.text(preferences.branding.headerTitle || config.title, 88, startY);
    startY += 18;

    if (preferences.export.includeGeneratedDateTime) {
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      pdf.text(`Generated: ${timestamp}`, 88, startY);
      startY += 16;
    }

    if (
      preferences.export.includeFiltersInExportHeader &&
      activeFilters.length > 0
    ) {
      pdf.text(`Filters: ${activeFilters.join(" | ")}`, 40, startY, {
        maxWidth: pdf.internal.pageSize.getWidth() - 80,
      });
      startY += 16;
    }

    autoTable(pdf, {
      startY: startY + 8,
      head: [columns.map((column) => column.label)],
      body: state.items.map((item) =>
        columns.map((column) => {
          const rawValue = item?.[column.dataKey as keyof typeof item];
          return rawValue == null ? "" : String(rawValue);
        }),
      ),
      styles: { fontSize: 8, cellPadding: 5, overflow: "linebreak" },
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { left: 24, right: 24, top: 24, bottom: 24 },
      theme: "grid",
    });

    pdf.save(`${prefix}_YenERP_${timestamp.replace(/[ :]/g, "_")}.pdf`);

    dispatch(
      actions.setSnackbar({
        message: `PDF export completed with ${columns.length} approved columns.`,
        severity: "success",
      }),
    );
  }, [
    actions,
    config.columns,
    config.exportFilename,
    config.title,
    defaultVisibleColumns,
    dispatch,
    pdfAllowedColumnKeys,
    preferences.branding.clientLogoUrl,
    preferences.branding.exportLogoEnabled,
    preferences.branding.headerTitle,
    preferences.export.exportSelectedColumnsOnly,
    preferences.export.includeFiltersInExportHeader,
    preferences.export.includeGeneratedDateTime,
    preferences.export.includeLogoInExport,
    preferences.export.pdfOrientation,
    preferences.export.pdfPageSize,
    state.filters,
    state.items,
    visibleColumns,
    isFiscalYearSelected,
  ]);

  // ─── Top bar content (memoised to avoid re-registering on every render) ─────

  const commonProps = {
    config,
    state,
    visibleColumns,
    isLoading,
    onFilterChange: logic.handleFilterChange,
    onClear: logic.handleClear,
    onSearch: logic.handleSearch,
    onDropdownSearch: logic.handleDropdownSearch,
    onLoadMoreDropdown: logic.handleLoadMoreDropdown,
    onExportExcel: logic.handleExportExcel,
    onRefresh: handleRefresh,
    containerRef,
    exporting: state.exporting,
  };

  const topBarContent = useMemo(
    () => (
      <ReportTopBarControls
        config={config}
        state={state}
        isLoading={isLoading}
        onFilterChange={logic.handleFilterChange}
        onClear={logic.handleClear}
        onDropdownSearch={logic.handleDropdownSearch}
        onLoadMoreDropdown={logic.handleLoadMoreDropdown}
        onExportExcel={logic.handleExportExcel}
        onExportPdf={handleExportPdf}
        onRefresh={handleRefresh}
        onClearAll={logic.handleClearAll}
        onToggleColumns={() => setShowColumnFilter((prev) => !prev)}
        onEnterFullscreen={() => setIsFullscreen(true)}
        isColumnsOpen={showColumnFilter}
        pdfColumnLimit={pdfAllowedColumnKeys.length}
      />
    ),
    [
      config,
      state,
      isLoading,
      logic.handleFilterChange,
      logic.handleClear,
      logic.handleDropdownSearch,
      logic.handleLoadMoreDropdown,
      logic.handleExportExcel,
      handleExportPdf,
      handleRefresh,
      logic.handleClearAll,
      showColumnFilter,
      pdfAllowedColumnKeys.length,
    ],
  );

  useEffect(() => {
    setConfig({
      title: config.title,
      rightContent: topBarContent,
    });

    return () => setConfig(null);
  }, [config.title, setConfig, topBarContent]);

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (!isFilterInitialized) {
    return (
      <Box className="flex h-full min-h-0 flex-col items-center justify-center bg-[var(--app-bg)] text-[var(--app-text)] p-6">
        <div className="flex flex-col items-center max-w-sm text-center">
          <div className="relative mb-6 flex items-center justify-center">
            {/* Outer spinning ring */}
            <div className="absolute h-16 w-16 animate-spin rounded-full border-4 border-[rgb(var(--app-primary-rgb)/0.15)] border-t-[var(--app-accent)]" />
            {/* Inner pulsing circle */}
            <div className="h-10 w-10 animate-pulse rounded-full bg-[rgb(var(--app-primary-rgb)/0.2)] flex items-center justify-center">
              <HiOutlineAdjustmentsHorizontal className="text-xl text-[var(--app-accent)]" />
            </div>
          </div>
          <h3 className="text-sm font-semibold tracking-wider uppercase text-[var(--app-text)] mb-2">
            Loading Report filters & data
          </h3>
          <p className="text-xs text-[var(--app-text-muted)] leading-relaxed">
            Fetching available dates and configuring filters...
          </p>
        </div>
      </Box>
    );
  }

  if (isFullscreen) {
    return (
      <GenericFullscreenView
        {...commonProps}
        onExportPDF={handleExportPdf}
        onExitFullscreen={() => setIsFullscreen(false)}
        snackbarOpen={state.snackbar.open}
        snackbarMessage={state.snackbar.message}
        snackbarSeverity={state.snackbar.severity}
        onSnackbarClose={() => dispatch(actions.clearSnackbar())}
      />
    );
  }

  return (
    <Box className="flex h-full min-h-0 flex-col bg-[var(--app-bg)] text-[var(--app-text)]">
      <Box className="flex min-h-0 flex-1 flex-col">
        {showColumnFilter ? (
          <GenericColumnFilterPanel
            config={config}
            visibleColumns={visibleColumns}
            defaultVisibleColumns={defaultVisibleColumns}
            pdfSupportedColumnKeys={pdfAllowedColumnKeys}
            onToggleColumn={handleToggleColumn}
            onSelectOnly={(keys) => {
              persistVisibleColumns(keys);
              dispatch(
                actions.setSnackbar({
                  message: "Column selection reset.",
                  severity: "info",
                }),
              );
            }}
          />
        ) : null}

        <Box
          className={[
            "flex min-h-0 flex-1 flex-col",
            isCompact ? "p-2 pt-1.5" : "p-3 pt-2",
          ].join(" ")}
        >
          <div className="mb-2 grid grid-cols-2 gap-1.5 lg:grid-cols-4">
            {showInitialSkeleton ? (
              Array.from({ length: 4 }).map((_, index) => (
                <MetricCardSkeleton key={index} />
              ))
            ) : (
              <>
                <MetricCard
                  label="Total Records"
                  value={totalItems.toLocaleString()}
                  sub="From current result set"
                  icon={<HiOutlineDocumentText size={14} />}
                />
                <MetricCard
                  label="Rows Loaded"
                  value={normalizedItems.length.toLocaleString()}
                  sub="Visible in table"
                  icon={<HiOutlineCheckCircle size={14} />}
                />
                <MetricCard
                  label="Active Filters"
                  value={activeFilterCount}
                  sub="Applied to report"
                  icon={<HiOutlineFunnel size={14} />}
                  active={activeFilterCount > 0}
                />
                <MetricCard
                  label="Columns"
                  value={visibleColumns.length}
                  sub="Shown in table"
                  icon={<HiOutlineAdjustmentsHorizontal size={14} />}
                  active={showColumnFilter}
                />
              </>
            )}
          </div>

          <Box className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-[var(--app-border)] bg-[var(--app-card)] shadow-sm">
            <GenericDataTable
              ref={containerRef}
              config={config}
              data={normalizedItems as Record<string, unknown>[]}
              visibleColumns={visibleColumns}
              isLoading={isLoading || isWaitingForCurrentData}
              compact={isCompact}
            />

            {showRefreshingOverlay ? (
              <div className="pointer-events-none absolute inset-0 z-30 flex items-start justify-center bg-[var(--app-card)]/35 pt-4 backdrop-blur-[1px]">
                <div className="inline-flex items-center gap-2 rounded-xl border border-[var(--app-border)] bg-[var(--app-card)] px-3 py-2 text-xs font-semibold text-[var(--app-text-muted)] shadow-lg">
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--app-border)] border-t-[var(--app-accent)]" />
                  Updating report...
                </div>
              </div>
            ) : null}
          </Box>
        </Box>
      </Box>

      <GlobalSnackbar
        open={state.snackbar.open}
        message={state.snackbar.message}
        severity={state.snackbar.severity}
        onClose={() => dispatch(actions.clearSnackbar())}
      />
    </Box>
  );
}

export default React.memo(ReportPageInner);
