import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  OptionType,
  PaginatedResponse,
  ReportConfig,
  ReportState,
  makeInitialState,
} from "./types";
import {
  buildDropdownCacheKey,
  buildDropdownParams,
  buildQueryParams,
  buildReportCacheKey,
  normalizeFilterValues,
} from "./queryUtils";
import { normalizePaginatedReport, safeArray } from "./reportDataNormalizer";
import {
  deleteCachedValue,
  getCachedValue,
  runWithInFlightDedup,
  setCachedValue,
} from "./reportCache";

const DROPDOWN_TTL_MS = 10 * 60 * 1000;
const DROPDOWN_CACHE_MAX_ENTRIES = 80;

const getFriendlyApiError = (
  err: unknown,
  fallback = "Data loading failed. Please try again.",
) => {
  if (!axios.isAxiosError(err)) return fallback;
  if (!err.response)
    return "Network error. Please check connection and try again.";
  if (err.response.status >= 500) return "Server error. Please try again.";
  return fallback;
};

const blobText = async (value: unknown): Promise<string | null> => {
  if (value instanceof Blob) return value.text();
  return null;
};

const sanitizeFilters = (filters: Record<string, string[]>) =>
  Object.fromEntries(
    Object.entries(filters).map(([apiParam, values]) => [
      apiParam,
      normalizeFilterValues(values),
    ]),
  );

const resetReportDataState = (state: ReportState, config: ReportConfig) => {
  state.items = [];
  state.error = null;
  state.loading = false;
  state.paginationLoading = false;
  state.activeReportRequestId = null;
  state.hasLoadedOnce = false;
  state.lastSuccessfulAt = null;
  state.pagination = {
    currentPage: 1,
    totalPages: 1,
    limit: config.defaultPageSize ?? state.pagination.limit ?? 30,
    totalItems: 0,
  };
};

const clearVisibleReportData = (state: ReportState, config: ReportConfig) => {
  state.items = [];
  state.error = null;
  state.loading = false;
  state.paginationLoading = false;
  state.activeReportRequestId = null;
  state.hasLoadedOnce = false;
  state.lastSuccessfulAt = null;
  state.pagination = {
    currentPage: 1,
    totalPages: 1,
    limit: config.defaultPageSize ?? 30,
    totalItems: 0,
  };
};

const resetRuntimeState = (state: ReportState, config: ReportConfig) => {
  state.items = [];
  state.error = null;
  state.loading = false;
  state.paginationLoading = false;
  state.activeReportRequestId = null;
  state.filtersDirty = false;
  state.hasLoadedOnce = false;
  state.lastSuccessfulAt = null;

  config.filters.forEach((filter) => {
    state.filters[filter.apiParam] = [];
    state.availableOptions[filter.type] = [];

    if (
      filter.paginated ||
      ["locations", "branch", "warehouse"].includes(filter.type)
    ) {
      state.dropdownPagination[filter.type] = {
        loading: false,
        page: 1,
        limit: 50,
        hasMore: true,
      };
      state.dropdownSearchQuery[filter.type] = "";
    }
  });

  state.pagination = {
    currentPage: 1,
    totalPages: 1,
    limit: config.defaultPageSize ?? 30,
    totalItems: 0,
  };
};

export function createReportSlice<
  T extends Record<string, unknown> = Record<string, unknown>,
>(config: ReportConfig) {
  const { key, apiBase } = config;
  const initialState = makeInitialState(config);

  const fetchDateFilters = createAsyncThunk<
    { years: string[]; months: string[]; days: number[] },
    void,
    { rejectValue: string }
  >(`${key}/fetchDateFilters`, async (_, { rejectWithValue }) => {
    try {
      const endpoint = config.dateEndpoint || `${apiBase}/dates`;
      const response = await axios.get(endpoint, {
        params: { _: Date.now() },
      });

      const data = response.data;

      return {
        years: safeArray<string>(data?.years ?? data?.yearIn),
        months: safeArray<string>(data?.months ?? data?.monthIn),
        days: safeArray<number>(data?.days ?? data?.daysIn),
      };
    } catch (err: unknown) {
      return rejectWithValue(getFriendlyApiError(err));
    }
  });

const fetchDropdownOptions = createAsyncThunk<
  { filterType: string; items: OptionType[]; hasMore: boolean },
  { filterType: string; search?: string; page?: number; force?: boolean },
  { state: { [key: string]: ReportState }; rejectValue: string }
>(
  `${key}/fetchDropdownOptions`,
  async ({ filterType, search, page = 1, force = false }, { getState, rejectWithValue }) => {
    try {
      const filterConfig = config.filters.find(
        (filter) => filter.type === filterType,
      );
      if (!filterConfig)
        return rejectWithValue(`Unknown filter type: ${filterType}`);

      const sliceState = (getState() as Record<string, ReportState>)[key];

      const normalizedSearch = search?.trim() || "";
      const isSearching = normalizedSearch.length > 0;
      const limit = isSearching ? 1000 : 50;

      const cacheKey = buildDropdownCacheKey(
        config,
        sliceState.filters,
        filterType,
        page,
        limit,
        normalizedSearch,
      );

      // Delete cache if force refresh is requested
      if (force) {
        deleteCachedValue(`${key}:dropdowns`, cacheKey);
      }

      const cached = getCachedValue<{
        filterType: string;
        items: OptionType[];
        hasMore: boolean;
      }>({
        namespace: `${key}:dropdowns`,
        key: cacheKey,
        maxEntries: DROPDOWN_CACHE_MAX_ENTRIES,
      });

      if (cached && !force) return cached;

      const endpoint =
        config.globalDropdownEndpoint || `${apiBase}/global-dropdowns`;

      const params = buildDropdownParams({
        filters: sliceState.filters,
        config,
        filterType,
        search: normalizedSearch || undefined,
        page,
        limit,
        refresh: force === true ? true : undefined, // Add refresh param
      });

      const data = await runWithInFlightDedup(force ? `${cacheKey}:force:${Date.now()}` : cacheKey, async () => {
        const response = await axios.get(endpoint, { params });
        return response.data;
      });

      const rawItems = safeArray<string | OptionType>(
        data?.[filterType] ?? data?.items,
      );

      const items: OptionType[] = rawItems.map(
        (value: string | OptionType) =>
          typeof value === "string" ? { label: value, value } : value,
      );

      const result = {
        filterType,
        items,
        hasMore: isSearching ? false : items.length === limit,
      };

      setCachedValue(
        {
          namespace: `${key}:dropdowns`,
          key: cacheKey,
          ttlMs: DROPDOWN_TTL_MS,
          maxEntries: DROPDOWN_CACHE_MAX_ENTRIES,
        },
        result,
      );

      return result;
    } catch (err: unknown) {
      return rejectWithValue(getFriendlyApiError(err));
    }
  },
);

const fetchMoreDropdownOptions = createAsyncThunk<
  { filterType: string; items: OptionType[]; hasMore: boolean },
  { filterType: string; force?: boolean },
  { state: { [key: string]: ReportState }; rejectValue: string }
>(
  `${key}/fetchMoreDropdownOptions`,
  async ({ filterType, force = false }, { getState, rejectWithValue }) => {
    const sliceState = (getState() as Record<string, ReportState>)[key];
    const pagination = sliceState.dropdownPagination[filterType];
    const search = sliceState.dropdownSearchQuery[filterType];

    if (search?.trim()) return { filterType, items: [], hasMore: false };
    if (!pagination?.hasMore && !force)
      return { filterType, items: [], hasMore: false };

    const nextPage = force ? 1 : pagination.page + 1;
    const limit = pagination.limit;

    try {
      const cacheKey = buildDropdownCacheKey(
        config,
        sliceState.filters,
        filterType,
        nextPage,
        limit,
        search,
      );

      // Delete cache if force refresh is requested
      if (force) {
        deleteCachedValue(`${key}:dropdowns`, cacheKey);
      }

      const cached = getCachedValue<{
        filterType: string;
        items: OptionType[];
        hasMore: boolean;
      }>({
        namespace: `${key}:dropdowns`,
        key: cacheKey,
        maxEntries: DROPDOWN_CACHE_MAX_ENTRIES,
      });

      if (cached && !force) return cached;

      const endpoint =
        config.globalDropdownEndpoint || `${apiBase}/global-dropdowns`;

      const params = buildDropdownParams({
        filters: sliceState.filters,
        config,
        filterType,
        search,
        page: nextPage,
        limit,
        refresh: force === true ? true : undefined, // Add refresh param
      });

      const data = await runWithInFlightDedup(force ? `${cacheKey}:force:${Date.now()}` : cacheKey, async () => {
        const response = await axios.get(endpoint, { params });
        return response.data;
      });

      const rawItems = safeArray<string | OptionType>(
        data?.[filterType] ?? data?.items,
      );

      const items: OptionType[] = rawItems.map(
        (value: string | OptionType) =>
          typeof value === "string" ? { label: value, value } : value,
      );

      const result = {
        filterType,
        items,
        hasMore: items.length === limit,
      };

      setCachedValue(
        {
          namespace: `${key}:dropdowns`,
          key: cacheKey,
          ttlMs: DROPDOWN_TTL_MS,
          maxEntries: DROPDOWN_CACHE_MAX_ENTRIES,
        },
        result,
      );

      return result;
    } catch (err: unknown) {
      return rejectWithValue(getFriendlyApiError(err));
    }
  },
);

  const fetchReport = createAsyncThunk<
    PaginatedResponse & { queryKey: string },
    { page: number; limit?: number; force?: boolean },
    { rejectValue: string }
  >(
    `${key}/fetchReport`,
    async (
      { page, limit: requestedLimit, force = false },
      { getState, rejectWithValue },
    ) => {
      const sliceState = (getState() as Record<string, ReportState>)[key];
      const limit = requestedLimit ?? config.defaultPageSize ?? 30;

      const queryKey = buildReportCacheKey(
        config,
        sliceState.filters,
        page,
        limit,
      );

      try {
        if (force) {
          deleteCachedValue(`${key}:reports`, queryKey);
        }

        const params = buildQueryParams({
          filters: sliceState.filters,
          config,
          page,
          limit,
          includePagination: true,

          refresh: force === true ? true : undefined,
        });

        const dedupKey = force ? `${queryKey}:force:${Date.now()}` : queryKey;

        const data = (await runWithInFlightDedup(dedupKey, async () => {
          const response = await axios.get<PaginatedResponse>(
            `${apiBase}/report`,
            {
              params,
            },
          );
          return response.data;
        })) as Partial<PaginatedResponse<T>>;

        const normalized = normalizePaginatedReport<T>(
          data,
          config,
          page,
          limit,
        );

        return { ...normalized, queryKey };
      } catch (err: unknown) {
        return rejectWithValue(getFriendlyApiError(err));
      }
    },
  );

  const exportExcel = createAsyncThunk<
  Blob,
  { force?: boolean }, // Add force parameter
  { rejectValue: string }
>(
  `${key}/exportExcel`,
  async ({ force = false }, { getState, rejectWithValue }) => {
    const sliceState = (getState() as Record<string, ReportState>)[key];

    try {
      const params = buildQueryParams({
        filters: sliceState.filters,
        config,
        includePagination: false,
        /**
         * Only send refresh=true when force is true
         * undefined is used instead of false so buildQueryParams does not append it
         */
        refresh: force === true ? true : undefined,
      });

      const { data } = await axios.get(`${apiBase}/export`, {
        params,
        responseType: "blob",
      });

      return data as Blob;
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        await blobText(err.response?.data);
      }

      return rejectWithValue(
        getFriendlyApiError(err, "Server error. Please try again."),
      );
    }
  },
);

  const slice = createSlice({
    name: key,
    initialState: initialState as ReportState,
    reducers: {
      setFilter(
        state,
        action: PayloadAction<{ apiParam: string; values: string[] }>,
      ) {
        state.filters[action.payload.apiParam] = normalizeFilterValues(
          action.payload.values,
        );
        resetReportDataState(state, config);
        state.filtersDirty = true;
      },

      setFiltersBatch(state, action: PayloadAction<Record<string, string[]>>) {
        const sanitizedBatch = sanitizeFilters(action.payload);

        Object.entries(sanitizedBatch).forEach(([apiParam, values]) => {
          state.filters[apiParam] = values;
        });

        resetReportDataState(state, config);
        state.filtersDirty = true;
      },

      clearFilter(state, action: PayloadAction<string>) {
        state.filters[action.payload] = [];
        resetReportDataState(state, config);
        state.filtersDirty = true;
      },

      clearAllFilters(state) {
        config.filters.forEach((filter) => {
          state.filters[filter.apiParam] = [];
        });

        resetReportDataState(state, config);
        state.filtersDirty = false;

        Object.keys(state.dropdownPagination).forEach((filterType) => {
          if (!["year", "month", "day"].includes(filterType)) {
            state.availableOptions[filterType] = [];
          }

          state.dropdownPagination[filterType] = {
            loading: false,
            page: 1,
            limit: 50,
            hasMore: true,
          };

          state.dropdownSearchQuery[filterType] = "";
        });
      },

      clearReportDataForMissingFiscalYear(state) {
        clearVisibleReportData(state, config);
        state.filtersDirty = false;
      },

      resetReportRuntimeState(state) {
        resetRuntimeState(state, config);
      },

      setDropdownSearch(
        state,
        action: PayloadAction<{ filterType: string; query: string }>,
      ) {
        const { filterType, query } = action.payload;

        if (!state.dropdownSearchQuery[filterType]) {
          state.dropdownSearchQuery[filterType] = "";
        }

        if (!state.dropdownPagination[filterType]) {
          state.dropdownPagination[filterType] = {
            loading: false,
            page: 1,
            limit: 50,
            hasMore: true,
          };
        }

        state.dropdownSearchQuery[filterType] = query;
        state.dropdownPagination[filterType].page = 1;
        state.dropdownPagination[filterType].hasMore = !query.trim();
      },

      resetDropdown(state, action: PayloadAction<string>) {
        const filterType = action.payload;

        state.availableOptions[filterType] = [];
        state.dropdownSearchQuery[filterType] = "";
        state.dropdownPagination[filterType] = {
          loading: false,
          page: 1,
          limit: 50,
          hasMore: true,
        };
      },

      setSnackbar(
        state,
        action: PayloadAction<{
          message: string;
          severity: "success" | "error" | "warning" | "info";
        }>,
      ) {
        state.snackbar = { open: true, ...action.payload };
      },

      clearSnackbar(state) {
        state.snackbar = {
          open: false,
          message: "",
          severity: "info",
        };
      },
    },

    extraReducers: (builder) => {
      builder.addCase(fetchDateFilters.fulfilled, (state, action) => {
        if (config.filters.some((filter) => filter.type === "year")) {
          state.availableOptions.year = action.payload.years.map((value) => ({
            label: value,
            value,
          }));
        }

        if (config.filters.some((filter) => filter.type === "month")) {
          state.availableOptions.month = action.payload.months.map((value) => {
            const normalized = String(value).padStart(2, "0");
            return { label: normalized, value: normalized };
          });
        }

        if (config.filters.some((filter) => filter.type === "day")) {
          state.availableOptions.day = action.payload.days.map((value) => {
            const normalized = String(value).padStart(2, "0");
            return { label: String(value), value: normalized };
          });
        }
      });

      builder.addCase(fetchDateFilters.rejected, (state, action) => {
        state.snackbar = {
          open: true,
          message: action.payload ?? "Data loading failed. Please try again.",
          severity: "error",
        };
      });

      builder
        .addCase(fetchDropdownOptions.pending, (state, action) => {
          const filterType = action.meta.arg.filterType;

          if (!state.dropdownPagination[filterType]) {
            state.dropdownPagination[filterType] = {
              loading: false,
              page: 1,
              limit: 50,
              hasMore: true,
            };
          }

          state.dropdownPagination[filterType].loading = true;
        })

        .addCase(fetchDropdownOptions.fulfilled, (state, action) => {
          const { filterType, items, hasMore } = action.payload;

          state.availableOptions[filterType] = items;

          if (!state.dropdownPagination[filterType]) {
            state.dropdownPagination[filterType] = {
              loading: false,
              page: 1,
              limit: 50,
              hasMore: true,
            };
          }

          state.dropdownPagination[filterType].loading = false;
          state.dropdownPagination[filterType].page = 1;
          state.dropdownPagination[filterType].hasMore = hasMore;
        })

        .addCase(fetchDropdownOptions.rejected, (state, action) => {
          const filterType = action.meta.arg.filterType;

          if (state.dropdownPagination[filterType]) {
            state.dropdownPagination[filterType].loading = false;
          }

          state.snackbar = {
            open: true,
            message: action.payload ?? "Data loading failed. Please try again.",
            severity: "error",
          };
        });

      builder
        .addCase(fetchMoreDropdownOptions.pending, (state, action) => {
          const filterType = action.meta.arg.filterType;

          if (state.dropdownPagination[filterType]) {
            state.dropdownPagination[filterType].loading = true;
          }
        })

        .addCase(fetchMoreDropdownOptions.fulfilled, (state, action) => {
          const { filterType, items, hasMore } = action.payload;

          const existing = state.availableOptions[filterType] ?? [];
          const existingValues = new Set(existing.map((item) => item.value));

          state.availableOptions[filterType] = [
            ...existing,
            ...items.filter((item) => !existingValues.has(item.value)),
          ];

          if (state.dropdownPagination[filterType]) {
            state.dropdownPagination[filterType].loading = false;

            if (items.length > 0) {
              state.dropdownPagination[filterType].page += 1;
            }

            state.dropdownPagination[filterType].hasMore = hasMore;
          }
        })

        .addCase(fetchMoreDropdownOptions.rejected, (state, action) => {
          const filterType = action.meta.arg.filterType;

          if (state.dropdownPagination[filterType]) {
            state.dropdownPagination[filterType].loading = false;
            state.dropdownPagination[filterType].hasMore = false;
          }

          state.snackbar = {
            open: true,
            message: action.payload ?? "Data loading failed. Please try again.",
            severity: "error",
          };
        });

      builder
        .addCase(fetchReport.pending, (state, action) => {
          const isFirstPage = action.meta.arg.page === 1;

          state.error = null;
          state.activeReportRequestId = action.meta.requestId;
          state.loading = isFirstPage;
          state.paginationLoading = !isFirstPage;

          if (isFirstPage) {
            state.items = [];
            state.hasLoadedOnce = false;
            state.lastSuccessfulAt = null;
            state.pagination = {
              currentPage: 1,
              totalPages: 1,
              limit:
                action.meta.arg.limit ??
                config.defaultPageSize ??
                state.pagination.limit ??
                30,
              totalItems: 0,
            };
          }
        })

        .addCase(fetchReport.fulfilled, (state, action) => {
          if (state.activeReportRequestId !== action.meta.requestId) return;

          const page = action.meta.arg.page;

          state.loading = false;
          state.paginationLoading = false;

          state.items = (
            page === 1
              ? action.payload.items
              : [...state.items, ...action.payload.items]
          ) as T[];

          state.pagination = {
            currentPage: action.payload.page ?? page,
            totalPages: action.payload.totalPages ?? 1,
            limit: action.payload.limit ?? config.defaultPageSize ?? 30,
            totalItems:
              action.payload.totalItems ?? action.payload.totalrecords ?? 0,
          };

          state.filtersDirty = false;
          state.hasLoadedOnce = true;
          state.lastSuccessfulAt = Date.now();
          state.error = null;

          if (page === 1 && state.items.length === 0) {
            state.snackbar = {
              open: true,
              message: "No data found for selected filters.",
              severity: "info",
            };
          }
        })

        .addCase(fetchReport.rejected, (state, action) => {
          if (state.activeReportRequestId !== action.meta.requestId) return;

          state.loading = false;
          state.paginationLoading = false;
          state.error = action.payload ?? "Failed to load report";

          state.snackbar = {
            open: true,
            message: action.payload ?? "Data loading failed. Please try again.",
            severity: "error",
          };
        });

      builder
        .addCase(exportExcel.pending, (state) => {
          state.exporting = true;
          state.snackbar = {
            open: true,
            message: "Export in progress...",
            severity: "info",
          };
        })

        .addCase(exportExcel.fulfilled, (state) => {
          state.exporting = false;
          state.snackbar = {
            open: true,
            message: "Export successful!",
            severity: "success",
          };
        })

        .addCase(exportExcel.rejected, (state, action) => {
          state.exporting = false;
          state.snackbar = {
            open: true,
            message: action.payload ?? "Server error. Please try again.",
            severity: "error",
          };
        });
    },
  });

  return {
    slice,
    thunks: {
      fetchDateFilters,
      fetchDropdownOptions,
      fetchMoreDropdownOptions,
      fetchReport,
      exportExcel,
    },
  };
}
