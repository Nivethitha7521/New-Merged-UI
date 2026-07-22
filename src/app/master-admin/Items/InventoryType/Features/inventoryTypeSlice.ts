



import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../../redux/store';
import { Inventory, initialState, initialInventory } from '../Models/inventoryTypeModels';
import { API_BASE_URL } from '../../../../../../API_URL';

const inventory_API_URL = `${API_BASE_URL}/inventorytypes/`;

// Fetch all inventories
export const fetchInventories = createAsyncThunk<Inventory[], void>(
  'inventory/fetch',
  async () => {
    const response = await axios.get(inventory_API_URL);
    return response.data;
  }
);

// Add a new inventory
export const addInventory = createAsyncThunk<Inventory, Inventory>(
  'inventory/add',
  async (inventory, { rejectWithValue }) => {
    try {
      const response = await axios.post(inventory_API_URL, inventory);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding inventory');
    }
  }
);

// Update an existing inventory
export const updateInventory = createAsyncThunk<Inventory, Inventory>(
  'inventory/update',
  async (inventory, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${inventory_API_URL}${inventory.id}`, inventory);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error updating inventory');
    }
  }
);

// Deactivate inventory
export const deactivateInventory = createAsyncThunk<Inventory, string>(
  'inventory/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${inventory_API_URL}${id}`, { status: 'deactivated' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error deactivating inventory');
    }
  }
);

// Activate inventory
export const activateInventory = createAsyncThunk<Inventory, string>(
  'inventory/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${inventory_API_URL}${id}`, { status: 'active' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error activating inventory');
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setInventoryTypeData: (state, action: PayloadAction<Inventory>) => {
      state.inventoryTypeData = action.payload;
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
    resetInventoryTypeData: (state) => {
      state.inventoryTypeData = initialInventory;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch inventories
      .addCase(fetchInventories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventories.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter(item => item.status === 'active');
        state.deactivatedItems = action.payload.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchInventories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch inventories';
      })

      // Add inventory
      .addCase(addInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addInventory.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === 'active') {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
        state.snackbarMessage = 'Inventory added successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(addInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to add inventory';
        state.snackbarMessage = 'Failed to add inventory';
        state.snackbarOpen = true;
      })

      // Update inventory
      .addCase(updateInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateInventory.fulfilled, (state, action) => {
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
        state.snackbarMessage = 'Inventory updated successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(updateInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update inventory';
        state.snackbarMessage = 'Failed to update inventory';
        state.snackbarOpen = true;
      })

      // Deactivate inventory
      .addCase(deactivateInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateInventory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
        state.snackbarMessage = 'Inventory deactivated successfully';
        state.snackbarOpen = true;
      })
      .addCase(deactivateInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to deactivate inventory';
        state.snackbarMessage = 'Failed to deactivate inventory';
        state.snackbarOpen = true;
      })

      // Activate inventory
      .addCase(activateInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateInventory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
        state.snackbarMessage = 'Inventory activated successfully';
        state.snackbarOpen = true;
      })
      .addCase(activateInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to activate inventory';
        state.snackbarMessage = 'Failed to activate inventory';
        state.snackbarOpen = true;
      });
  },
});

export const {
  setInventoryTypeData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetInventoryTypeData,
} = inventorySlice.actions;

export const selectInventory = (state: RootState) => state.inventoryType;

export default inventorySlice.reducer;