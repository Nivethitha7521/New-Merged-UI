import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../../redux/store';
import { OrderType, OrderTypeState, initialState, initialOrderType } from '../Models/ordertypeModels';
import { API_BASE_URL } from '../../../../../../API_URL';

const orderType_API_URL = `${API_BASE_URL}/ordertypes/`;

// Fetch all orderTypes
export const fetchOrderTypes = createAsyncThunk<OrderType[], void>(
  'orderType/fetch',
  async () => {
    const response = await axios.get(orderType_API_URL);
    return response.data;
  }
);

// Add a new orderType
export const addOrderType = createAsyncThunk<OrderType, OrderType>(
  'orderType/add',
  async (orderType, { rejectWithValue }) => {
    try {
      const response = await axios.post(orderType_API_URL, orderType);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding orderType');
    }
  }
);

// Update an existing orderType
export const updateOrderType = createAsyncThunk<OrderType, OrderType>(
  'orderType/update',
  async (orderType, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${orderType_API_URL}${orderType.id}`, orderType);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error updating orderType');
    }
  }
);

// Deactivate orderType
export const deactivateOrderType = createAsyncThunk<OrderType, string>(
  'orderType/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${orderType_API_URL}${id}`, { status: 'deactivated' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error deactivating orderType');
    }
  }
);

// Activate orderType
export const activateOrderType = createAsyncThunk<OrderType, string>(
  'orderType/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${orderType_API_URL}${id}`, { status: 'active' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error activating orderType');
    }
  }
);

const orderTypeSlice = createSlice({
  name: 'orderType',
  initialState,
  reducers: {
    setOrderTypeData: (state, action: PayloadAction<OrderType>) => {
      state.orderTypeData = action.payload;
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
    resetOrderTypeData: (state) => {
      state.orderTypeData = initialOrderType;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch orderTypes
      .addCase(fetchOrderTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter(item => item.status === 'active');
        state.deactivatedItems = action.payload.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchOrderTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch orderTypes';
      })

      // Add orderType
      .addCase(addOrderType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addOrderType.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === 'active') {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
        state.snackbarMessage = 'OrderType added successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(addOrderType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to add orderType';
        state.snackbarMessage = 'Failed to add orderType';
        state.snackbarOpen = true;
      })

      // Update orderType
      .addCase(updateOrderType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderType.fulfilled, (state, action) => {
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
        state.snackbarMessage = 'OrderType updated successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(updateOrderType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update orderType';
        state.snackbarMessage = 'Failed to update orderType';
        state.snackbarOpen = true;
      })

      // Deactivate orderType
      .addCase(deactivateOrderType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateOrderType.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
        state.snackbarMessage = 'OrderType deactivated successfully';
        state.snackbarOpen = true;
      })
      .addCase(deactivateOrderType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to deactivate orderType';
        state.snackbarMessage = 'Failed to deactivate orderType';
        state.snackbarOpen = true;
      })

      // Activate orderType
      .addCase(activateOrderType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateOrderType.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
        state.snackbarMessage = 'OrderType activated successfully';
        state.snackbarOpen = true;
      })
      .addCase(activateOrderType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to activate orderType';
        state.snackbarMessage = 'Failed to activate orderType';
        state.snackbarOpen = true;
      });
  },
});

export const {
  setOrderTypeData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetOrderTypeData,
} = orderTypeSlice.actions;

export const selectOrderType = (state: RootState) => state.orderType;

export default orderTypeSlice.reducer;