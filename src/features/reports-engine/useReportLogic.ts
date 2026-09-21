"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AnyAction } from "@reduxjs/toolkit";
import { usePreferences } from "@/components/preferences/PreferencesContext";
import { AppDispatch, RootState } from "@/redux/store";
import {
  OptionType,
  PaginatedResponse,
  ReportConfig,
  ReportState,
} from "./types";
import { createReportSlice } from "./genericReportSlice";
import {
  getDateFilterSignature,
  hasAllDateFiltersSelected,
  hasFiscalYearSelected,
} from "./queryUtils";

type SliceThunks = ReturnType<typeof createReportSlice>["thunks"];
type DateFilterPayload = { years: string[]; months: string[]; days: number[] };

interface UseReportLogicOptions<T> {
  config: ReportConfig<T>;
  thunks: SliceThunks;
  selector: (state: RootState) => ReportState<T>;
  actions: ReturnType<typeof createReportSlice>["slice"]["actions"];
}

export function useReportLogic<T = Record<string, unknown>>({
  config,
  thunks,
  selector,
  actions,
}: UseReportLogicOptions<T>) {
  const dispatch = useDispatch<AppDispatch>();
  const state = useSelector(selector);
  const { preferences } = usePreferences();

  const [hasMore, setHasMore] = useState(true);

  /**
   * Prevents default date logic from running before Redux reset is reflected.
   */
  const [runtimeReadyKey, setRuntimeReadyKey] = useState<string | null>(null);

  const [isFilterInitialized, setIsFilterInitialized] = useState(false);

  const initialFetchDone = useRef(false);
  const skipNextAutoFetch = useRef(false);
  const searchInProgress = useRef(false);
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>(
    {},
  );
  const defaultDateSelectionDone = useRef(false);
  const lastDropdownDateSignature = useRef<string | null>(null);
  const lastRuntimeResetKey = useRef<string | null>(null);

  const { filters, paginationLoading, pagination, loading } = state;

  const fiscalYearMessage = "Select fiscal year to see the data.";

  const getSafeErrorMessage = (err: unknown) =>
    typeof err === "string" && err.trim()
      ? err
      : "Data loading failed. Please try again.";

  const pickNearestOption = useCallback(
    (
      options: { value: string; label?: string }[],
      preferredValues: string[],
      preferredNumber: number,
    ) => {
      const exactMatch = preferredValues.find((candidate) =>
        options.some((option) => String(option.value) === String(candidate)),
      );

      if (exactMatch) return exactMatch;

      const numericOptions = options
        .map((option) => ({
          value: option.value,
          numberValue: Number(option.value),
        }))
        .filter((option) => Number.isFinite(option.numberValue));

      if (numericOptions.length === 0) return options[0]?.value;

      const latestBeforeOrSame = numericOptions
        .filter((option) => option.numberValue <= preferredNumber)
        .sort((left, right) => right.numberValue - left.numberValue)[0];

      if (latestBeforeOrSame) return latestBeforeOrSame.value;

      return numericOptions.sort(
        (left, right) => left.numberValue - right.numberValue,
      )[0]?.value;
    },
    [],
  );

  const toDateOptions = useCallback((payload: DateFilterPayload) => {
    const toUniqueOptions = (
      values: Array<string | number>,
      pad = false,
    ): OptionType[] => {
      const uniqueValues = Array.from(
        new Set(
          values
            .map((value) => String(value).trim())
            .filter(Boolean)
            .map((value) => (pad ? value.padStart(2, "0") : value)),
        ),
      );

      return uniqueValues.map((value) => ({
        label: value,
        value,
      }));
    };

    return {
      year: toUniqueOptions(payload.years),
      month: toUniqueOptions(payload.months, true),
      day: toUniqueOptions(payload.days, true),
    };
  }, []);

  const buildNearestDateUpdates = useCallback(
    (
      optionsByType: Partial<Record<"year" | "month" | "day", OptionType[]>>,
      replaceExisting = false,
    ) => {
      const now = new Date();
      const updates: Record<string, string[]> = {};

      const setIfNeeded = (
        filterType: "year" | "month" | "day",
        preferredValues: string[],
        preferredNumber: number,
      ) => {
        const filter = config.filters.find((item) => item.type === filterType);
        if (!filter) return;

        const current = filters[filter.apiParam] ?? [];
        if (!replaceExisting && current.length > 0) return;

        const picked = pickNearestOption(
          optionsByType[filterType] ?? [],
          preferredValues,
          preferredNumber,
        );

        if (picked && current[0] !== picked) {
          updates[filter.apiParam] = [picked];
        }
      };

      setIfNeeded("year", [String(now.getFullYear())], now.getFullYear());

      const currentMonth = now.getMonth() + 1;
      setIfNeeded(
        "month",
        [String(currentMonth).padStart(2, "0"), String(currentMonth)],
        currentMonth,
      );

      const currentDay = now.getDate();
      setIfNeeded(
        "day",
        [String(currentDay).padStart(2, "0"), String(currentDay)],
        currentDay,
      );

      return updates;
    },
    [config.filters, filters, pickNearestOption],
  );

  /**
   * Unique module/report identity.
   * Changes when navigating between modules — triggers full reset.
   */
  const moduleIdentity = useMemo(() => {
    const filterKey = config.filters
      .map((filter) => `${filter.type}:${filter.apiParam}`)
      .join("|");

    return `${config.key ?? config.title}|${config.apiBase}|${config.defaultPageSize ?? ""}|${filterKey}`;
  }, [
    config.key,
    config.title,
    config.apiBase,
    config.defaultPageSize,
    config.filters,
  ]);

  const hasDateFilters = useMemo(
    () => config.filters.some((f) => ["year", "month", "day"].includes(f.type)),
    [config.filters],
  );

  const hasPaginatedFilters = useMemo(
    () => config.filters.some((f) => f.paginated),
    [config.filters],
  );

  const dateSignature = useMemo(
    () => getDateFilterSignature(filters, config),
    [filters, config],
  );

  const reportFilterSignature = useMemo(() => {
    return config.filters
      .map((filter) => {
        const values = filters[filter.apiParam] ?? [];
        return `${filter.apiParam}:${values.join(",")}`;
      })
      .join("|");
  }, [config.filters, filters]);

  const isFiscalYearSelected = useMemo(
    () => hasFiscalYearSelected(filters, config),
    [filters, config],
  );

  /**
   * RESET ON MODULE CHANGE
   *
   * Clears all refs and Redux state when navigating between modules.
   * Waits one tick before setting runtimeReadyKey so Redux reset
   * is reflected before default date logic runs.
   */
  useEffect(() => {
    if (lastRuntimeResetKey.current === moduleIdentity) return;

    lastRuntimeResetKey.current = moduleIdentity;
    setRuntimeReadyKey(null);
    setIsFilterInitialized(false);

    initialFetchDone.current = false;
    skipNextAutoFetch.current = false;
    searchInProgress.current = false;
    defaultDateSelectionDone.current = false;
    lastDropdownDateSignature.current = null;

    setHasMore(true);

    Object.values(debounceTimers.current).forEach(clearTimeout);
    debounceTimers.current = {};

    dispatch(actions.resetReportRuntimeState());

    setTimeout(() => {
      setRuntimeReadyKey(moduleIdentity);
    }, 0);
  }, [dispatch, actions, moduleIdentity]);

  useEffect(() => {
    return () => {
      Object.values(debounceTimers.current).forEach(clearTimeout);
      debounceTimers.current = {};
    };
  }, []);

  const blockUntilFiscalYearSelected = useCallback(() => {
    if (isFiscalYearSelected) return false;

    dispatch(actions.clearReportDataForMissingFiscalYear());
    dispatch(
      actions.setSnackbar({
        message: fiscalYearMessage,
        severity: "warning",
      }),
    );

    setHasMore(false);
    return true;
  }, [actions, dispatch, isFiscalYearSelected]);

  /**
   * Fetch date dropdown only after runtime reset is ready.
   */
  useEffect(() => {
    if (!hasDateFilters) return;
    if (runtimeReadyKey !== moduleIdentity) return;

    dispatch(thunks.fetchDateFilters() as unknown as AnyAction);
  }, [dispatch, hasDateFilters, thunks, moduleIdentity, runtimeReadyKey]);

  /**
   * Apply default/current date only after:
   * 1. runtime reset completed
   * 2. date options loaded into Redux
   */
  // Set isFilterInitialized to true immediately if there are no date filters
  useEffect(() => {
    if (!hasDateFilters) {
      setIsFilterInitialized(true);
    }
  }, [hasDateFilters]);

  /**
   * Apply default/current date only after:
   * 1. runtime reset completed
   * 2. date options loaded into Redux
   */
  useEffect(() => {
    if (!hasDateFilters) return;
    if (defaultDateSelectionDone.current) {
      setIsFilterInitialized(true);
      return;
    }
    if (runtimeReadyKey !== moduleIdentity) return;

    const yearFilter = config.filters.find((filter) => filter.type === "year");
    const monthFilter = config.filters.find(
      (filter) => filter.type === "month",
    );
    const dayFilter = config.filters.find((filter) => filter.type === "day");

    const yearOptions = state.availableOptions.year ?? [];
    const monthOptions = state.availableOptions.month ?? [];
    const dayOptions = state.availableOptions.day ?? [];

    const hasRequiredOptions =
      (!yearFilter || yearOptions.length > 0) &&
      (!monthFilter || monthOptions.length > 0) &&
      (!dayFilter || dayOptions.length > 0);

    if (!hasRequiredOptions) return;

    const updates = buildNearestDateUpdates(
      {
        year: yearOptions,
        month: monthOptions,
        day: dayOptions,
      },
      false,
    );

    /**
     * Optional default location from preferences.
     */
    if (preferences.filters.defaultLocation.trim()) {
      const locationFilter = config.filters.find((filter) =>
        ["locations", "branch", "warehouse"].includes(filter.type),
      );

      if (
        locationFilter &&
        (filters[locationFilter.apiParam] ?? []).length === 0
      ) {
        const locationOptions =
          state.availableOptions[locationFilter.type] ?? [];
        const preferred = preferences.filters.defaultLocation
          .trim()
          .toLowerCase();

        const match = locationOptions.find(
          (option) =>
            option.label?.toLowerCase() === preferred ||
            option.value.toLowerCase() === preferred,
        );

        if (match) {
          updates[locationFilter.apiParam] = [match.value];
        }
      }
    }

    defaultDateSelectionDone.current = true;
    setIsFilterInitialized(true);

    if (Object.keys(updates).length > 0) {
      dispatch(actions.setFiltersBatch(updates));
    }
  }, [
    dispatch,
    actions,
    config.filters,
    filters,
    hasDateFilters,
    moduleIdentity,
    runtimeReadyKey,
    preferences.filters.defaultLocation,
    state.availableOptions,
    buildNearestDateUpdates,
  ]);

  /**
   * Reload paginated dropdowns when date changes.
   */
  useEffect(() => {
    if (runtimeReadyKey !== moduleIdentity) return;
    if (!hasPaginatedFilters) return;
    if (!isFiscalYearSelected) return;
    if (lastDropdownDateSignature.current === dateSignature) return;

    lastDropdownDateSignature.current = dateSignature;

    config.filters
      .filter((filter) => filter.paginated)
      .forEach((filter) => {
        dispatch(actions.resetDropdown(filter.type));
        dispatch(
          thunks.fetchDropdownOptions({
            filterType: filter.type,
            force: false,
          }) as unknown as AnyAction,
        );
      });
  }, [
    dispatch,
    actions,
    thunks,
    config.filters,
    dateSignature,
    hasPaginatedFilters,
    isFiscalYearSelected,
    moduleIdentity,
    runtimeReadyKey,
  ]);

  const getFilterValue = useCallback(
    (type: string) => {
      const filterConfig = config.filters.find((f) => f.type === type);
      if (!filterConfig) return [];
      return filters[filterConfig.apiParam] || [];
    },
    [config.filters, filters],
  );

  const fetchReportPage = useCallback(
    (page: number, force = false) => {
      if (blockUntilFiscalYearSelected()) return Promise.resolve(false);

      if (page === 1) setHasMore(true);

      return dispatch(
        thunks.fetchReport({
          page,
          limit:
            preferences.reportTable.defaultRowsPerPage ||
            config.defaultPageSize ||
            30,
          force,
        }) as unknown as AnyAction,
      )
        .unwrap()
        .then((res: PaginatedResponse<T>) => {
          const currentPage = Number(res.page ?? page);
          const totalPages = Number(res.totalPages ?? 0);

          setHasMore(totalPages > 0 && currentPage < totalPages);
          return true;
        })
        .catch((err: unknown) => {
          dispatch(
            actions.setSnackbar({
              message: getSafeErrorMessage(err),
              severity: "error",
            }),
          );

          return false;
        });
    },
    [
      blockUntilFiscalYearSelected,
      dispatch,
      thunks,
      config.defaultPageSize,
      actions,
      preferences.reportTable.defaultRowsPerPage,
    ],
  );

  /**
   * INITIAL REPORT FETCH
   *
   * Runs once after:
   * - runtime reset completed (runtimeReadyKey matches)
   * - date filters selected (if the report has date filters)
   *
   * force=false — normal load reads from backend cache.
   * Only the topbar refresh button or manual search sends refresh=true.
   */
  useEffect(() => {
    if (runtimeReadyKey !== moduleIdentity) return;
    if (initialFetchDone.current) return;
    if (hasDateFilters && !isFiscalYearSelected) return;

    const canFetch =
      !hasDateFilters || hasAllDateFiltersSelected(filters, config);
    if (!canFetch) return;

    initialFetchDone.current = true;
    skipNextAutoFetch.current = true;

    fetchReportPage(1, false);
  }, [
    fetchReportPage,
    filters,
    config,
    hasDateFilters,
    isFiscalYearSelected,
    moduleIdentity,
    runtimeReadyKey,
  ]);

  /**
   * AUTO FETCH AFTER FILTER CHANGE
   *
   * Runs when the user updates a filter (date, dropdown, etc).
   *
   * force=false — filter changes are normal loads, backend cache applies.
   * Only manual search / refresh button bypasses cache.
   */
  useEffect(() => {
    if (runtimeReadyKey !== moduleIdentity) return;
    if (!initialFetchDone.current) return;

    const year = getFilterValue("year");
    const hasYearFilter = config.filters.some((f) => f.type === "year");

    if (hasYearFilter && year.length === 0) {
      blockUntilFiscalYearSelected();
      return;
    }

    if (skipNextAutoFetch.current) {
      skipNextAutoFetch.current = false;
      return;
    }

    if (!preferences.filters.autoApply) return;

    fetchReportPage(1, false);
  }, [
    reportFilterSignature,
    getFilterValue,
    config.filters,
    fetchReportPage,
    preferences.filters.autoApply,
    blockUntilFiscalYearSelected,
    moduleIdentity,
    runtimeReadyKey,
  ]);

  const handleFilterChange = useCallback(
    (apiParam: string, values: string[]) => {
      const changedFilterType = config.filters.find(
        (f) => f.apiParam === apiParam,
      )?.type;

      const nextFilters: Record<string, string[]> = {
        [apiParam]: values,
      };

      if (changedFilterType === "year") {
        const monthApiParam = config.filters.find(
          (filter) => filter.type === "month",
        )?.apiParam;

        const dayApiParam = config.filters.find(
          (filter) => filter.type === "day",
        )?.apiParam;

        if (monthApiParam) nextFilters[monthApiParam] = [];
        if (dayApiParam) nextFilters[dayApiParam] = [];
      } else if (changedFilterType === "month") {
        const dayApiParam = config.filters.find(
          (filter) => filter.type === "day",
        )?.apiParam;

        if (dayApiParam) nextFilters[dayApiParam] = [];
      }

      dispatch(actions.setFiltersBatch(nextFilters));
      setHasMore(true);

      if (changedFilterType === "year" && values.length === 0) {
        dispatch(actions.clearReportDataForMissingFiscalYear());
        dispatch(
          actions.setSnackbar({
            message: fiscalYearMessage,
            severity: "warning",
          }),
        );

        initialFetchDone.current = true;
        defaultDateSelectionDone.current = true;
        lastDropdownDateSignature.current = null;
        setHasMore(false);
        return;
      }

      dispatch(
        actions.setSnackbar({
          message: "Filters updated.",
          severity: "info",
        }),
      );
    },
    [dispatch, actions, config.filters],
  );

  const handleClear = useCallback(
    (apiParam: string) => {
      const clearedFilterType = config.filters.find(
        (filter) => filter.apiParam === apiParam,
      )?.type;

      const nextFilters: Record<string, string[]> = {
        [apiParam]: [],
      };

      if (clearedFilterType === "year") {
        const monthApiParam = config.filters.find(
          (filter) => filter.type === "month",
        )?.apiParam;

        const dayApiParam = config.filters.find(
          (filter) => filter.type === "day",
        )?.apiParam;

        if (monthApiParam) nextFilters[monthApiParam] = [];
        if (dayApiParam) nextFilters[dayApiParam] = [];
      } else if (clearedFilterType === "month") {
        const dayApiParam = config.filters.find(
          (filter) => filter.type === "day",
        )?.apiParam;

        if (dayApiParam) nextFilters[dayApiParam] = [];
      }

      dispatch(actions.setFiltersBatch(nextFilters));
      setHasMore(true);

      if (clearedFilterType === "year") {
        dispatch(actions.clearReportDataForMissingFiscalYear());
        dispatch(
          actions.setSnackbar({
            message: fiscalYearMessage,
            severity: "warning",
          }),
        );

        initialFetchDone.current = true;
        defaultDateSelectionDone.current = true;
        lastDropdownDateSignature.current = null;
        setHasMore(false);
        return;
      }

      dispatch(
        actions.setSnackbar({
          message: "Filter cleared.",
          severity: "info",
        }),
      );
    },
    [dispatch, actions, config.filters],
  );

  const handleClearAll = useCallback(() => {
    dispatch(actions.clearAllFilters());
    dispatch(actions.clearReportDataForMissingFiscalYear());

    dispatch(
      actions.setSnackbar({
        message: fiscalYearMessage,
        severity: "warning",
      }),
    );

    initialFetchDone.current = true;
    defaultDateSelectionDone.current = true;
    lastDropdownDateSignature.current = null;
    setHasMore(false);
  }, [dispatch, actions]);

  /**
   * MANUAL SEARCH (topbar filter search button)
   *
   * force=true — user explicitly asked for fresh data.
   * Fetches latest date options first, then re-runs the report bypassing cache.
   */
  const handleSearch = useCallback(async () => {
    if (searchInProgress.current) return;

    searchInProgress.current = true;

    try {
      if (hasDateFilters) {
        const freshDateOptions = await dispatch(
          thunks.fetchDateFilters() as unknown as AnyAction,
        ).unwrap();

        const dateUpdates = buildNearestDateUpdates(
          toDateOptions(freshDateOptions as DateFilterPayload),
          true,
        );

        if (Object.keys(dateUpdates).length > 0) {
          skipNextAutoFetch.current = true;
          dispatch(actions.setFiltersBatch(dateUpdates));
          lastDropdownDateSignature.current = null;
        }
      }

      if (blockUntilFiscalYearSelected()) return;

      const ok = await fetchReportPage(1, true);

      if (ok) {
        dispatch(
          actions.setSnackbar({
            message: "Data refreshed successfully.",
            severity: "success",
          }),
        );
      }
    } finally {
      searchInProgress.current = false;
    }
  }, [
    actions,
    blockUntilFiscalYearSelected,
    buildNearestDateUpdates,
    dispatch,
    fetchReportPage,
    hasDateFilters,
    thunks,
    toDateOptions,
  ]);

  const handleDropdownSearch = useCallback(
    (filterType: string, query: string) => {
      if (filterType !== "year" && blockUntilFiscalYearSelected()) return;

      dispatch(actions.setDropdownSearch({ filterType, query }));

      if (debounceTimers.current[filterType]) {
        clearTimeout(debounceTimers.current[filterType]);
      }

      debounceTimers.current[filterType] = setTimeout(() => {
        const trimmedQuery = query.trim();

        dispatch(actions.resetDropdown(filterType));

        if (!trimmedQuery) {
          dispatch(
            thunks.fetchDropdownOptions({
              filterType,
              force: true,
            }) as unknown as AnyAction,
          );
          return;
        }

        dispatch(
          thunks.fetchDropdownOptions({
            filterType,
            force: true,
            search: trimmedQuery,
            page: 1,
          }) as unknown as AnyAction,
        );
      }, 400);
    },
    [blockUntilFiscalYearSelected, dispatch, actions, thunks],
  );

  const handleLoadMoreDropdown = useCallback(
    (filterType: string) => {
      if (filterType !== "year" && blockUntilFiscalYearSelected()) return;

      const query = state.dropdownSearchQuery?.[filterType] ?? "";
      if (query.trim()) return;

      const pg = state.dropdownPagination[filterType];

      if (pg?.hasMore && !pg.loading) {
        dispatch(
          thunks.fetchMoreDropdownOptions({
            filterType,
          }) as unknown as AnyAction,
        );
      }
    },
    [
      blockUntilFiscalYearSelected,
      dispatch,
      thunks,
      state.dropdownPagination,
      state.dropdownSearchQuery,
    ],
  );

  const fetchNext = useCallback(() => {
    if (blockUntilFiscalYearSelected()) return;
    if (paginationLoading || !hasMore) return;

    const nextPage = Number(pagination.currentPage || 1) + 1;
    const totalPages = Number(pagination.totalPages || 0);

    if (totalPages > 0 && nextPage > totalPages) {
      setHasMore(false);
      return;
    }

    dispatch(
      thunks.fetchReport({
        page: nextPage,
        limit:
          preferences.reportTable.defaultRowsPerPage ||
          config.defaultPageSize ||
          30,
        // No force — infinite scroll pagination always uses cache
      }) as unknown as AnyAction,
    )
      .unwrap()
      .then((res: PaginatedResponse<T>) => {
        const currentPage = Number(res.page ?? nextPage);
        const responseTotalPages = Number(res.totalPages ?? totalPages);

        setHasMore(responseTotalPages > 0 && currentPage < responseTotalPages);
      })
      .catch((err: unknown) => {
        setHasMore(false);

        dispatch(
          actions.setSnackbar({
            message: getSafeErrorMessage(err),
            severity: "error",
          }),
        );
      });
  }, [
    blockUntilFiscalYearSelected,
    dispatch,
    thunks,
    paginationLoading,
    hasMore,
    pagination,
    config.defaultPageSize,
    preferences.reportTable.defaultRowsPerPage,
    actions,
  ]);

  const handleExportExcel = useCallback(async () => {
    if (blockUntilFiscalYearSelected()) return;

    if (!state.items.length) {
      dispatch(
        actions.setSnackbar({
          message: "No data to export",
          severity: "warning",
        }),
      );
      return;
    }

    try {
      const blob = await dispatch(
        thunks.exportExcel({ force: true }) as unknown as AnyAction,
      ).unwrap();

      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement("a");

      a.href = url;

      const now = new Date();
      const pad = (n: number) => n.toString().padStart(2, "0");

      const ts = `${pad(now.getDate())}-${pad(
        now.getMonth() + 1,
      )}-${now.getFullYear()}_${pad(now.getHours())}-${pad(now.getMinutes())}`;

      const prefix = config.exportFilename ?? config.title.replace(/\s+/g, "");

      a.download = `${prefix}_YenERP_${ts}.xlsx`;
      a.click();

      URL.revokeObjectURL(url);
    } catch {
      dispatch(
        actions.setSnackbar({
          message: "Server error. Please try again.",
          severity: "error",
        }),
      );
    }
  }, [
    blockUntilFiscalYearSelected,
    dispatch,
    thunks,
    actions,
    state.items.length,
    config,
  ]);

  const filtersDirty = state.filtersDirty;

  const isAnyFilterSelected = useMemo(
    () => Object.values(filters).some((arr) => arr.length > 0),
    [filters],
  );

  return {
    state,
    hasMore,
    filters,
    filtersDirty,
    isAnyFilterSelected,
    isFilterInitialized,
    isLoading: loading || paginationLoading,
    handleFilterChange,
    handleClear,
    handleClearAll,
    handleSearch,
    handleDropdownSearch,
    handleLoadMoreDropdown,
    handleExportExcel,
    fetchNext,
    dispatch,
    actions,
  };
}
