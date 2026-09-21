import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../../redux/store';

import { variant } from '../Models/variantModel';
import { initialState, FetchItemsResponse, FetchItemsArgs, initialvariant } from '../Models/variantModel';
import { API_BASE_URL } from '../../../../../../API_URL';

const variants_API_URL = `${API_BASE_URL}/kotvariants/`;
const ITEM_API_URL = `${API_BASE_URL}/kotvariants/variant-variance`;

// Fetch all variants
export const fetchvariants = createAsyncThunk<variant[]>(
  'variant/fetch',
  async () => {
    const response = await axios.get(variants_API_URL);
    return response.data;
  }
);


// Fetch All Items
export const fetchItems = createAsyncThunk<
  FetchItemsResponse,
  FetchItemsArgs
>(
  "subcat/fetch",
  async ({ page = 1, limit = 30, search = "" }) => {
    const url = `${ITEM_API_URL}?page=${page}&limit=${limit}&search=${search}`;
    const response = await axios.get(url);

    return {
      results: response.data.results ?? [],
      totalPages: response.data.pages ?? 0,
      currentPage: response.data.page ?? 1,
    };
  }
);


// Add a new variant
export const addvariant = createAsyncThunk<variant, variant>(
  'variant/add',
  async (variant, { rejectWithValue }) => {
    try {
      const response = await axios.post(variants_API_URL, variant);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

// Update an existing variant
export const updatevariant = createAsyncThunk<variant, variant>(
  'variant/updatevariant',
  async (variant, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${variants_API_URL}${variant.id}`, variant);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);
// Deactivate variant
export const deactivatevariant = createAsyncThunk<variant, string>(
  'variant/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${variants_API_URL}${id}`, { status: 'deactivated' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

// Activate variant
export const activatevariant = createAsyncThunk<variant, string>(
  'variant/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${variants_API_URL}${id}`, { status: 'active' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

const variantSlice = createSlice({
  name: 'variant',
  initialState,
  reducers: {
    setvariantData: (state, action: PayloadAction<variant>) => {
      state.variantData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setDialogOpen: (state, action: PayloadAction<'none' | 'edit' | 'add'>) => {
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
    resetvariantData: (state) => {
      state.variantData = initialvariant;
      state.product = [];
      state.currentPage = 1;
      state.totalPages = 0;
      state.hasMoreItems = true;
    },
    incrementPage: (state) => {
      state.currentPage += 1;
    },
    resetPagination: (state) => {
      state.currentPage = 1;
      state.product = [];
      state.totalPages = 0;
      state.hasMoreItems = true;

    },

  },
  extraReducers: (builder) => {
    builder
      // Fetch variants
      .addCase(fetchvariants.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchvariants.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter(item => item.status === 'active');
        state.deactivatedItems = action.payload.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchvariants.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch variants';
      })



      // Fetch All Items
      .addCase(fetchItems.pending, (state) => {
        state.isFetchingItems = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.isFetchingItems = false;
        state.product =
          action.payload.currentPage === 1
            ? action.payload.results
            : [...state.product, ...action.payload.results];
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.hasMoreItems = state.currentPage < state.totalPages;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.isFetchingItems = false;
        state.error = action.error.message ?? "Failed to fetch all items";
        state.hasMoreItems = false;
      })

      // Add variant
      .addCase(addvariant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addvariant.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === 'active') {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
      })
      .addCase(addvariant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to add variant';
      })

      // Update variant
      .addCase(updatevariant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatevariant.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updatevariant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update variant';
      })

      // Deactivate variant
      .addCase(deactivatevariant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivatevariant.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
      })
      .addCase(deactivatevariant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to deactivate variant';
      })

      // Activate variant
      .addCase(activatevariant.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activatevariant.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
      })
      .addCase(activatevariant.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to activate variant';
      });
  },
});

export const {
  setvariantData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetvariantData,
  incrementPage,
  resetPagination,
} = variantSlice.actions;

export const selectvariant = (state: RootState) => state.variants;

export default variantSlice.reducer;