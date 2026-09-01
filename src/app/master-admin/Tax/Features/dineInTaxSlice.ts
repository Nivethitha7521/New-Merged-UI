




import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../redux/store';
import { DineInTax, initialDineInTax, dineInTaxInitialState } from '../Models/dineInTaxModels';
import { API_BASE_URL } from "../../../../../API_URL";

const DINEIN_TAX_API_URL = `${API_BASE_URL}/taxes/dineintax`;

// Fetch All DineIn Taxes
export const fetchDineInTaxes = createAsyncThunk<DineInTax[]>('dineInTax/fetch', async () => {
  const response = await axios.get(DINEIN_TAX_API_URL);
  return response.data;
});

// Add New DineIn Tax
export const addDineInTax = createAsyncThunk<DineInTax, DineInTax, { rejectValue: any }>(
  'dineInTax/add',
  async (tax, { rejectWithValue }) => {
    try {
      const response = await axios.post(DINEIN_TAX_API_URL, tax);
      return response.data;
    } catch (error) {
      const err: AxiosError = error as AxiosError;
      return rejectWithValue(err.response?.data ?? { detail: err.message });
    }
  }
);

// Update DineIn Tax
export const updateDineInTax = createAsyncThunk<DineInTax, DineInTax, { rejectValue: any }>(
  'dineInTax/update',
  async (tax, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${DINEIN_TAX_API_URL}/${tax.id}`, tax);
      return response.data;
    } catch (error) {
      const err: AxiosError = error as AxiosError;
      return rejectWithValue(err.response?.data ?? { detail: err.message });
    }
  }
);

// Deactivate DineIn Tax
export const deactivateDineInTax = createAsyncThunk<DineInTax, string>(
  'dineInTax/deactivate',
  async (id) => {
    const response = await axios.patch(`${DINEIN_TAX_API_URL}/${id}`, { status: 'deactivated' });
    return response.data;
  }
);

// Activate DineIn Tax
export const activateDineInTax = createAsyncThunk<DineInTax, string>(
  'dineInTax/activate',
  async (id) => {
    const response = await axios.patch(`${DINEIN_TAX_API_URL}/${id}`, { status: 'active' });
    return response.data;
  }
);

const dineInTaxSlice = createSlice({
  name: 'dineInTax',
  initialState: dineInTaxInitialState,
  reducers: {
    setDineInTaxData: (state, action: PayloadAction<DineInTax>) => {
      state.dineInTaxData = action.payload;
    },
    setDineInEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setDineInDialogOpen: (state, action: PayloadAction<'none' | 'edit' | 'add'>) => {
      state.dialogOpen = action.payload;
    },
    setDineInSnackbarOpen: (state, action: PayloadAction<boolean>) => {
      state.snackbarOpen = action.payload;
    },
    setDineInSnackbarMessage: (state, action: PayloadAction<string>) => {
      state.snackbarMessage = action.payload;
    },
    setDineInSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setDineInShowDeactivated: (state, action: PayloadAction<boolean>) => {
      state.showDeactivated = action.payload;
    },
    resetDineInTaxData: (state) => {
      state.dineInTaxData = initialDineInTax;
    },
  },

  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchDineInTaxes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDineInTaxes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter((item) => item.status === 'active');
        state.deactivatedItems = action.payload.filter((item) => item.status === 'deactivated');
      })
      .addCase(fetchDineInTaxes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch DineIn taxes';
      })

      // Add
      .addCase(addDineInTax.rejected, (state, action) => {
        state.snackbarOpen = true;
        state.snackbarMessage =
          (action.payload as any)?.detail || action.error.message || 'Failed to add DineIn tax';
      })
      .addCase(addDineInTax.fulfilled, (state, action) => {
        if (action.payload.status === 'active') {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
        state.snackbarMessage = 'DineIn Tax added successfully';
        state.snackbarOpen = true;
      })

      // Update
      .addCase(updateDineInTax.rejected, (state, action) => {
        state.snackbarOpen = true;
        state.snackbarMessage =
          (action.payload as any)?.detail || action.error.message || 'Failed to update DineIn tax';
      })
      .addCase(updateDineInTax.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.snackbarMessage = 'DineIn Tax updated successfully';
        state.snackbarOpen = true;
      })

      // Deactivate
      .addCase(deactivateDineInTax.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
        state.snackbarMessage = 'DineIn Tax deactivated successfully';
        state.snackbarOpen = true;
      })

      // Activate
      .addCase(activateDineInTax.fulfilled, (state, action) => {
        const index = state.deactivatedItems.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
        state.snackbarMessage = 'DineIn Tax activated successfully';
        state.snackbarOpen = true;
      });
  },
});

export const {
  setDineInTaxData,
  setDineInEditIndex,
  setDineInDialogOpen,
  setDineInSnackbarOpen,
  setDineInSnackbarMessage,
  setDineInSearchQuery,
  setDineInShowDeactivated,
  resetDineInTaxData,
} = dineInTaxSlice.actions;

export const selectDineInTax = (state: RootState) => state.dineInTaxes;

export default dineInTaxSlice.reducer;