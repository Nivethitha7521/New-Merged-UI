









import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../redux/store';
import { prefix, initialState, initialPrefix } from '../Models/prefixModel';
import { API_BASE_URL } from '../../../../../API_URL';

const PREFIX_API_URL = `${API_BASE_URL}/prefix/`;

// Fetch all prefix
export const fetchPrefix = createAsyncThunk<prefix[], void>(
  'prefix/fetch',
  async () => {
    const response = await axios.get(PREFIX_API_URL);
    return response.data;
  }
);

// Add a new prefix
export const addPrefix = createAsyncThunk<prefix, prefix>(
  'prefix/add',
  async (prefix, { rejectWithValue }) => {
    try {
      const response = await axios.post(PREFIX_API_URL, prefix);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding prefix');
    }
  }
);

// Update an existing prefix
export const updatePrefix = createAsyncThunk<prefix, prefix>(
  'prefix/update',
  async (prefix, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${PREFIX_API_URL}${prefix.id}`, prefix);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error updating prefix');
    }
  }
);

// Deactivate prefix
export const deactivatePrefix = createAsyncThunk<prefix, string>(
  'prefix/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${PREFIX_API_URL}${id}`, { status: 'deactivated' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error deactivating prefix');
    }
  }
);

// Activate prefix
export const activatePrefix = createAsyncThunk<prefix, string>(
  'prefix/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${PREFIX_API_URL}${id}`, { status: 'active' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error activating prefix');
    }
  }
);

const prefixSlice = createSlice({
  name: 'prefix',
  initialState,
  reducers: {
    setPrefixData: (state, action: PayloadAction<prefix>) => {
      state.PrefixData = action.payload;
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
    resetPrefixData: (state) => {
      state.PrefixData = initialPrefix;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch inventories
      .addCase(fetchPrefix.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPrefix.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter(item => item.status === 'active');
        state.deactivatedItems = action.payload.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchPrefix.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch inventories';
      })

      // Add Prefix
      .addCase(addPrefix.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addPrefix.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === 'active') {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
        state.snackbarMessage = 'Prefix added successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(addPrefix.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to add Prefix';
        state.snackbarMessage = 'Failed to add Prefix';
        state.snackbarOpen = true;
      })

      // Update Prefix
      .addCase(updatePrefix.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePrefix.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          const deactivatedIndex = state.deactivatedItems.findIndex(p => p.id === action.payload.id);
          if (deactivatedIndex !== -1) {
            state.deactivatedItems[deactivatedIndex] = action.payload;
          }
        }
        state.snackbarMessage = 'Prefix updated successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(updatePrefix.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update Prefix';
        state.snackbarMessage = 'Failed to update Prefix';
        state.snackbarOpen = true;
      })

      // Deactivate Prefix
      .addCase(deactivatePrefix.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivatePrefix.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
        state.snackbarMessage = 'Prefix deactivated successfully';
        state.snackbarOpen = true;
      })
      .addCase(deactivatePrefix.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to deactivate Prefix';
        state.snackbarMessage = 'Failed to deactivate Prefix';
        state.snackbarOpen = true;
      })

      // Activate Prefix
      .addCase(activatePrefix.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activatePrefix.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
        state.snackbarMessage = 'Prefix activated successfully';
        state.snackbarOpen = true;
      })
      .addCase(activatePrefix.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to activate Prefix';
        state.snackbarMessage = 'Failed to activate Prefix';
        state.snackbarOpen = true;
      });
  },
});

export const {
  setPrefixData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetPrefixData,
} = prefixSlice.actions;

export const selectPrefix = (state: RootState) => state.prefixType;

export default prefixSlice.reducer;