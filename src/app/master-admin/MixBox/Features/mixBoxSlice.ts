

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../../../redux/store";

import {
  MixBox,
  FetchMixboxResponse,
  FetchMixboxArgs,
  initialMixBox,
  initialState,
} from "../Models/mixboxModels";
import { ImportResponse } from "../../Items/Category/Models/categoryModels";

// ─── Import the global cache ──────────────────────────────────────────────────
import { paginatedCache, CACHE_NS } from "../../../Components/paginatedCache"; // adjust path as needed
import { API_BASE_URL } from "../../../../../API_URL";

const MIXBOX_API_URL = `${API_BASE_URL}/mixbox/`;
const ITEM_API_URL = `${API_BASE_URL}/kotvariants/variant-variance`;

// ─── Fetch all MixBoxes ───────────────────────────────────────────────────────
export const fetchMixBoxes = createAsyncThunk<MixBox[]>(
  "mixBox/fetch",
  async () => {
    const response = await axios.get(MIXBOX_API_URL);
    return response.data;
  }
);

// ─── Fetch Items (with cache) ─────────────────────────────────────────────────
// Cache key: namespace = CACHE_NS.MIXBOX_ITEMS, search string, page number.
// - If the page is already cached → returns cached data, NO API call.
// - If not cached → calls API, stores result in cache, returns data.
// - Cache is cleared in resetPagination (search change / dialog open).
export const fetchItems = createAsyncThunk<
  FetchMixboxResponse & { fromCache: boolean },
  FetchMixboxArgs
>("subcat/fetch", async ({ page = 1, limit = 50, search = "" }) => {
  const normalizedSearch = search.toLowerCase();

  // ── Cache hit ──────────────────────────────────────────────────────────────
  const cached = paginatedCache.get<FetchMixboxResponse>(
    CACHE_NS.MIXBOX_ITEMS,
    normalizedSearch,
    page
  );
  if (cached) {
    return { ...cached, fromCache: true };
  }

  // ── Cache miss → fetch from API ────────────────────────────────────────────
  const url = `${ITEM_API_URL}?page=${page}&limit=${limit}&search=${normalizedSearch}`;
  const response = await axios.get(url);

  const result: FetchMixboxResponse = {
    results: response.data.results ?? [],
    totalPages: response.data.pages ?? 0,
    currentPage: response.data.page ?? 1,
  };

  // Store in cache for future visits
  paginatedCache.set(CACHE_NS.MIXBOX_ITEMS, normalizedSearch, page, result);

  return { ...result, fromCache: false };
});

// ─── Add MixBox ───────────────────────────────────────────────────────────────
export const addMixBox = createAsyncThunk<MixBox, MixBox>(
  "mixBox/add",
  async (mixBox, { rejectWithValue }) => {
    try {
      const response = await axios.post(MIXBOX_API_URL, mixBox);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || "Error adding mixbox");
    }
  }
);

// ─── Update MixBox ────────────────────────────────────────────────────────────
export const updateMixBox = createAsyncThunk<MixBox, MixBox>(
  "mixBox/update",
  async (mixBox, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${MIXBOX_API_URL}${mixBox.id}`,
        mixBox
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || "Error updating mixbox");
    }
  }
);

// ─── Deactivate MixBox ────────────────────────────────────────────────────────
export const deactivateMixBox = createAsyncThunk<MixBox, string>(
  "mixBox/deactivate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${MIXBOX_API_URL}${id}`, {
        status: "deactivated",
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || "Error deactivating mixbox");
    }
  }
);

// ─── Activate MixBox ──────────────────────────────────────────────────────────
export const activateMixBox = createAsyncThunk<MixBox, string>(
  "mixBox/activate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${MIXBOX_API_URL}${id}`, {
        status: "active",
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || "Error activating mixbox");
    }
  }
);

// ─── Export CSV ───────────────────────────────────────────────────────────────
export const Exportmixbox = createAsyncThunk<void, void>(
  "Exportmixbox/fetch",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get(`${MIXBOX_API_URL}export-csv`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "mixbox_export.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("MixBox data exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export MixBox data"));
      throw err;
    }
  }
);

// ─── Import CSV ───────────────────────────────────────────────────────────────
export const Importmixbox = createAsyncThunk<ImportResponse, File>(
  "Importmixbox/add",
  async (file, { dispatch, rejectWithValue }) => {
    if (!file.name.endsWith(".csv")) {
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Please upload a valid CSV file"));
      return rejectWithValue("Invalid file format. Please upload a CSV file.");
    }

    const form = new FormData();
    form.append("file", file);
    try {
      const response = await axios.post(`${MIXBOX_API_URL}import-csv`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      dispatch(fetchMixBoxes());
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to import MixBox data"));
      return rejectWithValue(
        err.response?.data || "Failed to import MixBox data"
      );
    }
  }
);

// ─── Slice ────────────────────────────────────────────────────────────────────
const mixBoxSlice = createSlice({
  name: "mixBox",
  initialState,
  reducers: {
    setMixBoxData: (state, action: PayloadAction<MixBox>) => {
      state.mixBoxData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setDialogOpen: (
      state,
      action: PayloadAction<"none" | "edit" | "add" | "deactivated">
    ) => {
      state.dialogOpen = action.payload;
    },
    setSnackbarOpen: (state, action: PayloadAction<boolean>) => {
      state.snackbarOpen = action.payload;
    },
    setSnackbarMessage: (state, action: PayloadAction<string>) => {
      state.snackbarMessage = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setShowDeactivated: (state, action: PayloadAction<boolean>) => {
      state.showDeactivated = action.payload;
    },
    resetMixBoxData: (state) => {
      state.mixBoxData = initialMixBox;
      state.product = [];
      state.currentPage = 1;
      state.totalPages = 0;
      state.hasMoreItems = true;
    },
    incrementPage: (state) => {
      state.currentPage += 1;
    },
    /**
     * resetPagination
     * Resets Redux pagination state AND clears the in-memory cache for this
     * namespace. Call this whenever the search query changes so stale cached
     * pages are not reused with the new query.
     *
     * Optionally pass { clearCacheSearch } to only clear cache for a specific
     * search string, or omit it to clear the entire namespace cache.
     */
    resetPagination: (
      state,
      action: PayloadAction<{ clearCacheSearch?: string } | undefined>
    ) => {
      state.currentPage = 1;
      state.product = [];
      state.totalPages = 0;
      state.hasMoreItems = true;

      // Clear cache so the next fetchItems hits the API fresh
      if (action?.payload?.clearCacheSearch !== undefined) {
        paginatedCache.clear(
          CACHE_NS.MIXBOX_ITEMS,
          action.payload.clearCacheSearch
        );
      } else {
        // Clear all pages for this namespace (search changed or dialog opened)
        paginatedCache.clear(CACHE_NS.MIXBOX_ITEMS);
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // ── fetchMixBoxes ──────────────────────────────────────────────────────
      .addCase(fetchMixBoxes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMixBoxes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter((item) => item.status === "active");
        state.deactivatedItems = action.payload.filter(
          (item) => item.status === "deactivated"
        );
      })
      .addCase(fetchMixBoxes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch mix boxes";
      })

      // ── fetchItems ─────────────────────────────────────────────────────────
      .addCase(fetchItems.pending, (state) => {
        state.isFetchingItems = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.isFetchingItems = false;
        state.error = null;

        const newItems = Array.isArray(action.payload.results)
          ? action.payload.results
          : [];

        if (action.payload.currentPage === 1) {
          // Page 1: always replace (fresh search or first open)
          state.product = newItems;
        } else {
          // Subsequent pages: append, deduplicating by varianceName
          const seen = new Set(state.product.map((i) => i.varianceName));
          const filtered = newItems.filter((i) => !seen.has(i.varianceName));
          state.product = [...state.product, ...filtered];
        }

        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.hasMoreItems = state.currentPage < state.totalPages;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.isFetchingItems = false;
        state.error = action.error.message ?? "Failed to fetch items";
        state.hasMoreItems = false;
      })

      // ── addMixBox ──────────────────────────────────────────────────────────
      .addCase(addMixBox.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMixBox.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === "active") {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
        state.snackbarMessage = "Mix box added successfully";
        state.snackbarOpen = true;
        state.dialogOpen = "none";
      })
      .addCase(addMixBox.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to add mix box";
        state.snackbarMessage = "Failed to add mix box";
        state.snackbarOpen = true;
      })

      // ── updateMixBox ───────────────────────────────────────────────────────
      .addCase(updateMixBox.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMixBox.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) state.items[index] = action.payload;
        state.snackbarMessage = "MixBox updated successfully";
        state.snackbarOpen = true;
        state.dialogOpen = "none";
      })
      .addCase(updateMixBox.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to update MixBox";
        state.snackbarMessage = "Failed to update MixBox";
        state.snackbarOpen = true;
      })

      // ── deactivateMixBox ───────────────────────────────────────────────────
      .addCase(deactivateMixBox.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateMixBox.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
        state.snackbarMessage = "Mix box deactivated successfully";
        state.snackbarOpen = true;
      })
      .addCase(deactivateMixBox.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to deactivate mix box";
        state.snackbarMessage = "Failed to deactivate mix box";
        state.snackbarOpen = true;
      })

      // ── activateMixBox ─────────────────────────────────────────────────────
      .addCase(activateMixBox.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateMixBox.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(
          (p) => p.id === action.payload.id
        );
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
        state.snackbarMessage = "Mix box activated successfully";
        state.snackbarOpen = true;
      })
      .addCase(activateMixBox.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to activate mix box";
        state.snackbarMessage = "Failed to activate mix box";
        state.snackbarOpen = true;
      })

      // ── Exportmixbox ───────────────────────────────────────────────────────
      .addCase(Exportmixbox.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Exportmixbox.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(Exportmixbox.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export MixBox data";
      })

      // ── Importmixbox ───────────────────────────────────────────────────────
      .addCase(Importmixbox.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Importmixbox.fulfilled, (state, action) => {
        state.loading = false;
        const {
          message,
          duplicates = [],
          updated = [],
          failed = [],
        } = action.payload;

        let snackbarMessage = message || "Import completed";
        if (duplicates.length > 0)
          snackbarMessage += ` Duplicates skipped: ${duplicates.join(", ")}.`;
        if (failed.length > 0)
          snackbarMessage += ` ${failed.length} rows failed.`;
        if (updated.length > 0)
          snackbarMessage += ` ${updated.length} rows updated.`;

        state.snackbarOpen = true;
        state.snackbarMessage = snackbarMessage;
      })
      .addCase(Importmixbox.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || "Failed to import MixBox data";
        state.snackbarOpen = true;
        state.snackbarMessage =
          (action.payload as string) || "Failed to import MixBox data";
      });
  },
});

export const {
  setMixBoxData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetMixBoxData,
  resetPagination,
  incrementPage,
} = mixBoxSlice.actions;

export const selectMixBox = (state: RootState) => state.mixBox;
export default mixBoxSlice.reducer;