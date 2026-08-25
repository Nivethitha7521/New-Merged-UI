// import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
// import axios from "axios";
// import {
//   OptionType,
//   PaginatedResponse,
//   ReportConfig,
//   ReportState,
//   makeInitialState,
// } from "./types";
// import {
//   buildDateFilterCacheKey,
//   buildDropdownCacheKey,
//   buildDropdownParams,
//   buildQueryParams,
//   buildReportCacheKey,
//   normalizeFilterValues,
// } from "./queryUtils";
// import { normalizePaginatedReport, safeArray } from "./reportDataNormalizer";
// import {
//   deleteCachedValue,
//   getCachedValue,
//   runWithInFlightDedup,
//   setCachedValue,
// } from "./reportCache";

// const DATE_FILTER_TTL_MS = 30 * 60 * 1000;
// const DROPDOWN_TTL_MS = 10 * 60 * 1000;
// const REPORT_TTL_MS = 5 * 60 * 1000;

// const DATE_CACHE_MAX_ENTRIES = 20;
// const DROPDOWN_CACHE_MAX_ENTRIES = 80;
// const REPORT_CACHE_MAX_ENTRIES = 120;

// const NORMAL_DROPDOWN_LIMIT = 50;
// const SEARCH_DROPDOWN_LIMIT = 1000;

// const getFriendlyApiError = (
//   err: unknown,
//   fallback = "Data loading failed. Showing last available data.",
// ) => {
//   if (!axios.isAxiosError(err)) return fallback;
//   if (!err.response)
//     return "Network error. Please check connection and try again.";
//   if (err.response.status >= 500) return "Server error. Please try again.";
//   return fallback;
// };

// const blobText = async (value: unknown): Promise<string | null> => {
//   if (value instanceof Blob) return value.text();
//   return null;
// };

// const sanitizeFilters = (filters: Record<string, string[]>) =>
//   Object.fromEntries(
//     Object.entries(filters).map(([apiParam, values]) => [
//       apiParam,
//       normalizeFilterValues(values),
//     ]),
//   );

// const ensureDropdownRuntime = (
//   state: ReportState,
//   filterType: string,
//   limit = NORMAL_DROPDOWN_LIMIT,
// ) => {
//   if (!state.availableOptions[filterType]) {
//     state.availableOptions[filterType] = [];
//   }

//   if (!state.dropdownPagination[filterType]) {
//     state.dropdownPagination[filterType] = {
//       loading: false,
//       page: 1,
//       limit,
//       hasMore: true,
//     };
//   }

//   if (state.dropdownSearchQuery[filterType] === undefined) {
//     state.dropdownSearchQuery[filterType] = "";
//   }
// };

// const resetReportDataState = (state: ReportState, config: ReportConfig) => {
//   state.error = null;
//   state.loading = false;
//   state.paginationLoading = false;
//   state.activeReportRequestId = null;

//   state.pagination.limit =
//     config.defaultPageSize ?? state.pagination.limit ?? 30;
// };

// const clearVisibleReportData = (state: ReportState, config: ReportConfig) => {
//   state.items = [];
//   state.error = null;
//   state.loading = false;
//   state.paginationLoading = false;
//   state.activeReportRequestId = null;
//   state.hasLoadedOnce = false;
//   state.lastSuccessfulAt = null;

//   state.pagination = {
//     currentPage: 1,
//     totalPages: 1,
//     limit: config.defaultPageSize ?? 30,
//     totalItems: 0,
//   };
// };

// const resetRuntimeState = (state: ReportState, config: ReportConfig) => {
//   state.items = [];
//   state.error = null;
//   state.loading = false;
//   state.paginationLoading = false;
//   state.activeReportRequestId = null;
//   state.filtersDirty = false;
//   state.hasLoadedOnce = false;
//   state.lastSuccessfulAt = null;
//   state.exporting = false;

//   config.filters.forEach((filter) => {
//     state.filters[filter.apiParam] = [];
//     state.availableOptions[filter.type] = [];

//     ensureDropdownRuntime(state, filter.type);

//     state.dropdownPagination[filter.type] = {
//       loading: false,
//       page: 1,
//       limit: NORMAL_DROPDOWN_LIMIT,
//       hasMore: true,
//     };

//     state.dropdownSearchQuery[filter.type] = "";
//   });

//   state.pagination = {
//     currentPage: 1,
//     totalPages: 1,
//     limit: config.defaultPageSize ?? 30,
//     totalItems: 0,
//   };
// };

// export function createReportSlice<
//   T extends Record<string, unknown> = Record<string, unknown>,
// >(config: ReportConfig) {
//   const { key, apiBase } = config;
//   const initialState = makeInitialState(config);

//   const fetchDateFilters = createAsyncThunk<
//     { years: string[]; months: string[]; days: number[] },
//     void,
//     { rejectValue: string }
//   >(`${key}/fetchDateFilters`, async (_, { rejectWithValue }) => {
//     try {
//       const endpoint = config.dateEndpoint || `${apiBase}/dates`;
//       const cacheKey = buildDateFilterCacheKey(config);

//       const cached = getCachedValue<{
//         years: string[];
//         months: string[];
//         days: number[];
//       }>({
//         namespace: `${key}:date-filters`,
//         key: cacheKey,
//         maxEntries: DATE_CACHE_MAX_ENTRIES,
//       });

//       if (cached) return cached;

//       const data = await runWithInFlightDedup(cacheKey, async () => {
//         const response = await axios.get(endpoint);
//         return response.data;
//       });

//       const result = {
//         years: safeArray<string>(data?.years ?? data?.yearIn),
//         months: safeArray<string>(data?.months ?? data?.monthIn),
//         days: safeArray<number>(data?.days ?? data?.daysIn),
//       };

//       setCachedValue(
//         {
//           namespace: `${key}:date-filters`,
//           key: cacheKey,
//           ttlMs: DATE_FILTER_TTL_MS,
//           maxEntries: DATE_CACHE_MAX_ENTRIES,
//         },
//         result,
//       );

//       return result;
//     } catch (err: unknown) {
//       return rejectWithValue(getFriendlyApiError(err));
//     }
//   });

//   const fetchDropdownOptions = createAsyncThunk<
//     {
//       filterType: string;
//       items: OptionType[];
//       hasMore: boolean;
//       page: number;
//       limit: number;
//       search: string;
//     },
//     { filterType: string; search?: string; page?: number },
//     { state: Record<string, ReportState>; rejectValue: string }
//   >(
//     `${key}/fetchDropdownOptions`,
//     async ({ filterType, search, page = 1 }, { getState, rejectWithValue }) => {
//       try {
//         const filterConfig = config.filters.find(
//           (filter) => filter.type === filterType,
//         );
//         if (!filterConfig)
//           return rejectWithValue(`Unknown filter type: ${filterType}`);

//         const rootState = getState() as Record<string, ReportState>;
//         const sliceState = rootState[key];

//         if (!sliceState) {
//           return rejectWithValue(`Report state not found for key: ${key}`);
//         }

//         const normalizedSearch = search?.trim() || "";
//         const isSearching = normalizedSearch.length > 0;
//         const limit = isSearching
//           ? SEARCH_DROPDOWN_LIMIT
//           : NORMAL_DROPDOWN_LIMIT;

//         const cacheKey = buildDropdownCacheKey(
//           config,
//           sliceState.filters,
//           filterType,
//           page,
//           limit,
//           normalizedSearch,
//         );

//         const cached = getCachedValue<{
//           filterType: string;
//           items: OptionType[];
//           hasMore: boolean;
//           page: number;
//           limit: number;
//           search: string;
//         }>({
//           namespace: `${key}:dropdowns`,
//           key: cacheKey,
//           maxEntries: DROPDOWN_CACHE_MAX_ENTRIES,
//         });

//         if (cached) return cached;

//         const endpoint =
//           config.globalDropdownEndpoint || `${apiBase}/global-dropdowns`;

//         const params = buildDropdownParams({
//           filters: sliceState.filters,
//           config,
//           filterType,
//           search: normalizedSearch || undefined,
//           page,
//           limit,
//         });

//         const data = await runWithInFlightDedup(cacheKey, async () => {
//           const response = await axios.get(endpoint, { params });
//           return response.data;
//         });

//         const rawItems = safeArray<string | OptionType>(
//           data?.[filterType] ?? data?.items,
//         );

//         const items: OptionType[] = rawItems.map(
//           (value: string | OptionType) =>
//             typeof value === "string" ? { label: value, value } : value,
//         );

//         const result = {
//           filterType,
//           items,
//           hasMore: isSearching ? false : items.length === limit,
//           page,
//           limit,
//           search: normalizedSearch,
//         };

//         setCachedValue(
//           {
//             namespace: `${key}:dropdowns`,
//             key: cacheKey,
//             ttlMs: DROPDOWN_TTL_MS,
//             maxEntries: DROPDOWN_CACHE_MAX_ENTRIES,
//           },
//           result,
//         );

//         return result;
//       } catch (err: unknown) {
//         return rejectWithValue(getFriendlyApiError(err));
//       }
//     },
//   );

//   const fetchMoreDropdownOptions = createAsyncThunk<
//     {
//       filterType: string;
//       items: OptionType[];
//       hasMore: boolean;
//       page: number;
//       limit: number;
//       search: string;
//     },
//     { filterType: string },
//     { state: Record<string, ReportState>; rejectValue: string }
//   >(
//     `${key}/fetchMoreDropdownOptions`,
//     async ({ filterType }, { getState, rejectWithValue }) => {
//       const rootState = getState() as Record<string, ReportState>;
//       const sliceState = rootState[key];

//       if (!sliceState) {
//         return rejectWithValue(`Report state not found for key: ${key}`);
//       }

//       const pagination = sliceState.dropdownPagination[filterType];
//       const search = sliceState.dropdownSearchQuery[filterType] ?? "";

//       if (search.trim()) {
//         return {
//           filterType,
//           items: [],
//           hasMore: false,
//           page: pagination?.page ?? 1,
//           limit: pagination?.limit ?? NORMAL_DROPDOWN_LIMIT,
//           search,
//         };
//       }

//       if (!pagination?.hasMore || pagination.loading) {
//         return {
//           filterType,
//           items: [],
//           hasMore: false,
//           page: pagination?.page ?? 1,
//           limit: pagination?.limit ?? NORMAL_DROPDOWN_LIMIT,
//           search,
//         };
//       }

//       const nextPage = pagination.page + 1;
//       const limit = pagination.limit || NORMAL_DROPDOWN_LIMIT;

//       try {
//         const cacheKey = buildDropdownCacheKey(
//           config,
//           sliceState.filters,
//           filterType,
//           nextPage,
//           limit,
//           search,
//         );

//         const cached = getCachedValue<{
//           filterType: string;
//           items: OptionType[];
//           hasMore: boolean;
//           page: number;
//           limit: number;
//           search: string;
//         }>({
//           namespace: `${key}:dropdowns`,
//           key: cacheKey,
//           maxEntries: DROPDOWN_CACHE_MAX_ENTRIES,
//         });

//         if (cached) return cached;

//         const endpoint =
//           config.globalDropdownEndpoint || `${apiBase}/global-dropdowns`;

//         const params = buildDropdownParams({
//           filters: sliceState.filters,
//           config,
//           filterType,
//           search,
//           page: nextPage,
//           limit,
//         });

//         const data = await runWithInFlightDedup(cacheKey, async () => {
//           const response = await axios.get(endpoint, { params });
//           return response.data;
//         });

//         const rawItems = safeArray<string | OptionType>(
//           data?.[filterType] ?? data?.items,
//         );

//         const items: OptionType[] = rawItems.map(
//           (value: string | OptionType) =>
//             typeof value === "string" ? { label: value, value } : value,
//         );

//         const result = {
//           filterType,
//           items,
//           hasMore: items.length === limit,
//           page: nextPage,
//           limit,
//           search,
//         };

//         setCachedValue(
//           {
//             namespace: `${key}:dropdowns`,
//             key: cacheKey,
//             ttlMs: DROPDOWN_TTL_MS,
//             maxEntries: DROPDOWN_CACHE_MAX_ENTRIES,
//           },
//           result,
//         );

//         return result;
//       } catch (err: unknown) {
//         return rejectWithValue(getFriendlyApiError(err));
//       }
//     },
//   );
// export const clearReportModuleCache = (key: string) => {
//   deleteCachedValue(`${key}:reports`, "*");
//   deleteCachedValue(`${key}:dropdowns`, "*");
//   deleteCachedValue(`${key}:date-filters`, "*");
// };

// const fetchReport = createAsyncThunk<
//   PaginatedResponse & { queryKey: string },
//   { page: number; limit?: number; force?: boolean },
//   { state: Record<string, ReportState>; rejectValue: string }
// >(
//   `${key}/fetchReport`,
//   async (
//     { page, limit: requestedLimit, force = false },
//     { getState, rejectWithValue },
//   ) => {
//     const rootState = getState() as Record<string, ReportState>;
//     const sliceState = rootState[key];

//     if (!sliceState) {
//       return rejectWithValue(`Report state not found for key: ${key}`);
//     }

//     const limit = requestedLimit ?? config.defaultPageSize ?? 30;

//     /**
//      * Base cache key = same filters/page/limit
//      * We use this to fully clear both normal + refresh cache versions.
//      */
//     const baseCacheKey = buildReportCacheKey(
//       config,
//       sliceState.filters,
//       page,
//       limit,
//     );

//     /**
//      * Final request key includes mode.
//      */
// const queryKey = `${baseCacheKey}:${force ? `refresh:${Date.now()}` : "normal"}`;
//     try {
//       /**
//        * NORMAL SEARCH:
//        * Use cache if available.
//        */
//       if (!force) {
//         const cached = getCachedValue<
//           PaginatedResponse & { queryKey: string }
//         >({
//           namespace: `${key}:reports`,
//           key: queryKey,
//           maxEntries: REPORT_CACHE_MAX_ENTRIES,
//         });

//         if (cached) {
//           return cached;
//         }
//       } else {
//         /**
//          * HARD REFRESH:
//          * Remove all cached variants for this exact query.
//          */
//         deleteCachedValue(`${key}:reports`, `${baseCacheKey}:normal`);
//         deleteCachedValue(`${key}:reports`, `${baseCacheKey}:refresh`);
//       }

//       /**
//        * Build latest request params.
//        */
//       const params = buildQueryParams({
//         filters: sliceState.filters,
//         config,
//         page,
//         limit,
//         includePagination: true,
//       });

//       /**
//        * Force backend fresh data using refresh=true
//        */
//       const data = (await runWithInFlightDedup(queryKey, async () => {
//         const response = await axios.get<PaginatedResponse>(
//           `${apiBase}/report`,
//           {
//             params: {
//               ...params,
//               refresh: force ? "true" : "false",
//             },
//           },
//         );

//         return response.data;
//       })) as Partial<PaginatedResponse<T>>;

//       /**
//        * Normalize backend response.
//        */
//       const normalized = normalizePaginatedReport<T>(
//         data,
//         config,
//         page,
//         limit,
//       );

//       const result = {
//         ...normalized,
//         queryKey,
//       };

//       /**
//        * Store latest response in cache.
//        */
//       setCachedValue(
//         {
//           namespace: `${key}:reports`,
//           key: queryKey,
//           ttlMs: REPORT_TTL_MS,
//           maxEntries: REPORT_CACHE_MAX_ENTRIES,
//         },
//         result,
//       );

//       return result;
//     } catch (err: unknown) {
//       return rejectWithValue(getFriendlyApiError(err));
//     }
//   },
// );

//   const exportExcel = createAsyncThunk<
//     Blob,
//     void,
//     { state: Record<string, ReportState>; rejectValue: string }
//   >(`${key}/exportExcel`, async (_, { getState, rejectWithValue }) => {
//     const rootState = getState() as Record<string, ReportState>;
//     const sliceState = rootState[key];

//     if (!sliceState) {
//       return rejectWithValue(`Report state not found for key: ${key}`);
//     }

//     try {
//       const params = buildQueryParams({
//         filters: sliceState.filters,
//         config,
//         includePagination: false,
//       });

//       const { data } = await axios.get(`${apiBase}/export`, {
//         params,
//         responseType: "blob",
//       });

//       return data as Blob;
//     } catch (err: unknown) {
//       if (axios.isAxiosError(err)) {
//         await blobText(err.response?.data);
//       }

//       return rejectWithValue(
//         getFriendlyApiError(err, "Server error. Please try again."),
//       );
//     }
//   });

//   const slice = createSlice({
//     name: key,
//     initialState: initialState as ReportState,
//     reducers: {
//       setFilter(
//         state,
//         action: PayloadAction<{ apiParam: string; values: string[] }>,
//       ) {
//         state.filters[action.payload.apiParam] = normalizeFilterValues(
//           action.payload.values,
//         );

//         resetReportDataState(state, config);
//         state.filtersDirty = true;
//       },

//       setFiltersBatch(state, action: PayloadAction<Record<string, string[]>>) {
//         const sanitizedBatch = sanitizeFilters(action.payload);

//         Object.entries(sanitizedBatch).forEach(([apiParam, values]) => {
//           state.filters[apiParam] = values;
//         });

//         resetReportDataState(state, config);
//         state.filtersDirty = true;
//       },

//       clearFilter(state, action: PayloadAction<string>) {
//         state.filters[action.payload] = [];

//         resetReportDataState(state, config);
//         state.filtersDirty = true;
//       },

//       clearAllFilters(state) {
//         config.filters.forEach((filter) => {
//           state.filters[filter.apiParam] = [];
//         });

//         resetReportDataState(state, config);
//         state.filtersDirty = false;

//         config.filters.forEach((filter) => {
//           ensureDropdownRuntime(state, filter.type);

//           if (!["year", "month", "day"].includes(filter.type)) {
//             state.availableOptions[filter.type] = [];
//           }

//           state.dropdownPagination[filter.type] = {
//             loading: false,
//             page: 1,
//             limit: NORMAL_DROPDOWN_LIMIT,
//             hasMore: true,
//           };

//           state.dropdownSearchQuery[filter.type] = "";
//         });
//       },

//       clearReportDataForMissingFiscalYear(state) {
//         clearVisibleReportData(state, config);
//         state.filtersDirty = false;
//       },

//       resetReportRuntimeState(state) {
//         resetRuntimeState(state, config);
//       },

//       setDropdownSearch(
//         state,
//         action: PayloadAction<{ filterType: string; query: string }>,
//       ) {
//         const { filterType, query } = action.payload;

//         ensureDropdownRuntime(state, filterType);

//         state.dropdownSearchQuery[filterType] = query;
//         state.dropdownPagination[filterType].page = 1;
//         state.dropdownPagination[filterType].limit = query.trim()
//           ? SEARCH_DROPDOWN_LIMIT
//           : NORMAL_DROPDOWN_LIMIT;
//         state.dropdownPagination[filterType].hasMore = !query.trim();
//       },

//       resetDropdown(state, action: PayloadAction<string>) {
//         const filterType = action.payload;

//         ensureDropdownRuntime(state, filterType);

//         state.availableOptions[filterType] = [];
//         state.dropdownSearchQuery[filterType] = "";

//         state.dropdownPagination[filterType] = {
//           loading: false,
//           page: 1,
//           limit: NORMAL_DROPDOWN_LIMIT,
//           hasMore: true,
//         };
//       },

//       setSnackbar(
//         state,
//         action: PayloadAction<{
//           message: string;
//           severity: "success" | "error" | "warning" | "info";
//         }>,
//       ) {
//         state.snackbar = { open: true, ...action.payload };
//       },

//       clearSnackbar(state) {
//         state.snackbar = {
//           open: false,
//           message: "",
//           severity: "info",
//         };
//       },
//     },

//     extraReducers: (builder) => {
//       builder
//         .addCase(fetchDateFilters.pending, (state) => {
//           state.error = null;
//         })

//         .addCase(fetchDateFilters.fulfilled, (state, action) => {
//           if (config.filters.some((filter) => filter.type === "year")) {
//             state.availableOptions.year = action.payload.years.map((value) => ({
//               label: String(value),
//               value: String(value),
//             }));
//           }

//           if (config.filters.some((filter) => filter.type === "month")) {
//             state.availableOptions.month = action.payload.months.map(
//               (value) => {
//                 const normalized = String(value).padStart(2, "0");

//                 return {
//                   label: normalized,
//                   value: normalized,
//                 };
//               },
//             );
//           }

//           if (config.filters.some((filter) => filter.type === "day")) {
//             state.availableOptions.day = action.payload.days.map((value) => {
//               const normalized = String(value).padStart(2, "0");

//               return {
//                 label: String(value),
//                 value: normalized,
//               };
//             });
//           }
//         })

//         .addCase(fetchDateFilters.rejected, (state, action) => {
//           state.snackbar = {
//             open: true,
//             message:
//               action.payload ??
//               "Data loading failed. Showing last available data.",
//             severity: "error",
//           };
//         });

//       builder
//         .addCase(fetchDropdownOptions.pending, (state, action) => {
//           const filterType = action.meta.arg.filterType;
//           const search = action.meta.arg.search?.trim() ?? "";

//           ensureDropdownRuntime(
//             state,
//             filterType,
//             search ? SEARCH_DROPDOWN_LIMIT : NORMAL_DROPDOWN_LIMIT,
//           );

//           state.dropdownPagination[filterType].loading = true;
//           state.dropdownPagination[filterType].page = 1;
//           state.dropdownPagination[filterType].limit = search
//             ? SEARCH_DROPDOWN_LIMIT
//             : NORMAL_DROPDOWN_LIMIT;
//         })

//         .addCase(fetchDropdownOptions.fulfilled, (state, action) => {
//           const { filterType, items, hasMore, page, limit, search } =
//             action.payload;

//           ensureDropdownRuntime(state, filterType, limit);

//           state.availableOptions[filterType] = items;
//           state.dropdownSearchQuery[filterType] = search;
//           state.dropdownPagination[filterType] = {
//             loading: false,
//             page,
//             limit,
//             hasMore,
//           };
//         })

//         .addCase(fetchDropdownOptions.rejected, (state, action) => {
//           const filterType = action.meta.arg.filterType;

//           ensureDropdownRuntime(state, filterType);
//           state.dropdownPagination[filterType].loading = false;

//           state.snackbar = {
//             open: true,
//             message:
//               action.payload ??
//               "Data loading failed. Showing last available data.",
//             severity: "error",
//           };
//         });

//       builder
//         .addCase(fetchMoreDropdownOptions.pending, (state, action) => {
//           const filterType = action.meta.arg.filterType;

//           ensureDropdownRuntime(state, filterType);
//           state.dropdownPagination[filterType].loading = true;
//         })

//         .addCase(fetchMoreDropdownOptions.fulfilled, (state, action) => {
//           const { filterType, items, hasMore, page, limit, search } =
//             action.payload;

//           ensureDropdownRuntime(state, filterType, limit);

//           const existing = state.availableOptions[filterType] ?? [];
//           const existingValues = new Set(existing.map((item) => item.value));

//           state.availableOptions[filterType] = [
//             ...existing,
//             ...items.filter((item) => !existingValues.has(item.value)),
//           ];

//           state.dropdownSearchQuery[filterType] = search;
//           state.dropdownPagination[filterType] = {
//             loading: false,
//             page,
//             limit,
//             hasMore,
//           };
//         })

//         .addCase(fetchMoreDropdownOptions.rejected, (state, action) => {
//           const filterType = action.meta.arg.filterType;

//           ensureDropdownRuntime(state, filterType);

//           state.dropdownPagination[filterType].loading = false;
//           state.dropdownPagination[filterType].hasMore = false;

//           state.snackbar = {
//             open: true,
//             message:
//               action.payload ??
//               "Data loading failed. Showing last available data.",
//             severity: "error",
//           };
//         });

//       builder
//         .addCase(fetchReport.pending, (state, action) => {
//           const isFirstPage = action.meta.arg.page === 1;

//           state.error = null;
//           state.activeReportRequestId = action.meta.requestId;
//           state.loading = isFirstPage;
//           state.paginationLoading = !isFirstPage;

//           if (isFirstPage) {
//             state.pagination.currentPage = 1;
//           }
//         })

//         .addCase(fetchReport.fulfilled, (state, action) => {
//           if (state.activeReportRequestId !== action.meta.requestId) return;

//           const page = action.meta.arg.page;

//           state.loading = false;
//           state.paginationLoading = false;
//           state.activeReportRequestId = null;

//           state.items = (
//             page === 1
//               ? action.payload.items
//               : [...state.items, ...action.payload.items]
//           ) as T[];

//           state.pagination = {
//             currentPage: action.payload.page ?? page,
//             totalPages: action.payload.totalPages ?? 1,
//             limit: action.payload.limit ?? config.defaultPageSize ?? 30,
//             totalItems:
//               action.payload.totalItems ?? action.payload.totalrecords ?? 0,
//           };

//           state.filtersDirty = false;
//           state.hasLoadedOnce = true;
//           state.lastSuccessfulAt = Date.now();
//           state.error = null;

//           if (page === 1 && state.items.length === 0) {
//             state.snackbar = {
//               open: true,
//               message: "No data found for selected filters.",
//               severity: "info",
//             };
//           }
//         })

//         .addCase(fetchReport.rejected, (state, action) => {
//           if (state.activeReportRequestId !== action.meta.requestId) return;

//           state.loading = false;
//           state.paginationLoading = false;
//           state.activeReportRequestId = null;
//           state.error = action.payload ?? "Failed to load report";

//           state.snackbar = {
//             open: true,
//             message:
//               action.payload ??
//               "Data loading failed. Showing last available data.",
//             severity: "error",
//           };
//         });

//       builder
//         .addCase(exportExcel.pending, (state) => {
//           state.exporting = true;
//           state.snackbar = {
//             open: true,
//             message: "Export in progress...",
//             severity: "info",
//           };
//         })

//         .addCase(exportExcel.fulfilled, (state) => {
//           state.exporting = false;
//           state.snackbar = {
//             open: true,
//             message: "Export successful!",
//             severity: "success",
//           };
//         })

//         .addCase(exportExcel.rejected, (state, action) => {
//           state.exporting = false;
//           state.snackbar = {
//             open: true,
//             message: action.payload ?? "Server error. Please try again.",
//             severity: "error",
//           };
//         });
//     },
//   });

//   return {
//     slice,
//     thunks: {
//       fetchDateFilters,
//       fetchDropdownOptions,
//       fetchMoreDropdownOptions,
//       fetchReport,
//       exportExcel,
//     },
//   };
// }
