import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../../redux/store';

import { AddOn } from '../Models/addonModels';
import { initialState, FetchItemsResponse, FetchItemsArgs, initialAddOn } from '../Models/addonModels';
import { API_BASE_URL } from '../../../../../../API_URL';


const ADDONS_API_URL = `${API_BASE_URL}/addons/`;
const ITEM_API_URL = `${API_BASE_URL}/kotvariants/variant-variance`;


// Fetch all addOns
export const fetchaddOns = createAsyncThunk<AddOn[]>(
  'addOn/fetch',
  async () => {
    const response = await axios.get(ADDONS_API_URL);
    return response.data;
  }
);


// Fetch All Items
export const fetchItems = createAsyncThunk<
  FetchItemsResponse,
  FetchItemsArgs
>(
  "addon/fetch",
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




// Add a new addOn
export const addaddOn = createAsyncThunk<AddOn, AddOn>(
  'addOn/add',
  async (addOn, { rejectWithValue }) => {
    try {
      const response = await axios.post(ADDONS_API_URL, addOn);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }

  }
);

// Update an existing addOn
// In your addOnSlice.ts
export const updateaddOn = createAsyncThunk<AddOn, AddOn>(
  'addOn/updateaddOn',
  async (addOn, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${ADDONS_API_URL}${addOn.id}`, addOn);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }

  }
);
// Deactivate addOn
export const deactivateaddOn = createAsyncThunk<AddOn, string>(
  'addOn/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${ADDONS_API_URL}${id}`, { status: 'deactivated' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }

  }
);

// Activate addOn
export const activateaddOn = createAsyncThunk<AddOn, string>(
  'addOn/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${ADDONS_API_URL}${id}`, { status: 'active' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }

  }
);

const addOnSlice = createSlice({
  name: 'addOn',
  initialState,
  reducers: {
    setAddOnData: (state, action: PayloadAction<AddOn>) => {
      state.addOnData = action.payload;
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
    resetAddOnData: (state) => {
      state.addOnData = initialAddOn;

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
      // Fetch AddOns
      .addCase(fetchaddOns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchaddOns.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter(item => item.status === 'active');
        state.deactivatedItems = action.payload.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchaddOns.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch addOns';
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

      // Add AddOn
      .addCase(addaddOn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addaddOn.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === '1') {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
      })
      .addCase(addaddOn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to add addOn';
      })

      // Update AddOn
      .addCase(updateaddOn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateaddOn.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateaddOn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update addOn';
      })

      // Deactivate AddOn
      .addCase(deactivateaddOn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateaddOn.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
      })
      .addCase(deactivateaddOn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to deactivate addOn';
      })

      // Activate AddOn
      .addCase(activateaddOn.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateaddOn.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
      })
      .addCase(activateaddOn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to activate addOn';
      });
  },
});

export const {
  setAddOnData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetAddOnData,
  incrementPage,
  resetPagination,
} = addOnSlice.actions;

export const selectAddOn = (state: RootState) => state.addOn;

export default addOnSlice.reducer;