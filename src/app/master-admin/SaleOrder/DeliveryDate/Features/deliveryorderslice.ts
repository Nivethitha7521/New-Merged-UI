

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { API_BASE_URL } from "../../../../../../API_URL";

const API_URL = `${API_BASE_URL}/deliveryorders/`;

// Define interfaces for delivery order and state
export interface DeliveryOrderItem {
  deliveryOrderId: string;
  configId: string;
  configures: Config[];
  configName: string;
  noOfDates: number;
  createdDate: string;
  updatedDate: string;
  noOfChangeableDates: string;
  remarks: string;
  status: 'enabled' | 'disabled';
}


export interface Config {
  description: string;
  configId: string;
  configName:string
  noOfChangeableDate: number;
  createdDate: string;
  updatedDate: string;
  status: 'enabled' | 'disabled';
}

interface DeliveryOrderState {
  items: DeliveryOrderItem[];
  loading: boolean;
  error: string | null;
  enabledOrderId: string | null; // Changed from configId to be more descriptive
}

// Initial state
const initialState: DeliveryOrderState = {
  items: [],
  loading: false,
  error: null,
  enabledOrderId: null,
};

// Async Thunks
export const fetchDeliveryOrders = createAsyncThunk<DeliveryOrderItem[]>(
  'deliveryOrders/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL);
    //  console.log(`responsedata${response.data}`);
      
      return response.data;
    } catch(error){
      const err=error as AxiosError;
      const errorMessage=err.response?.data || "failed to fetch"
      return rejectWithValue(errorMessage)
    }
  }
);
  
export const deactivateOrder = createAsyncThunk<DeliveryOrderItem, string>(
  "deliveryOrders/deactivateOrder",
  async (deliveryOrderId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}disabled/${deliveryOrderId}`);
      return response.data;
    } catch (error) {
      const err=error as AxiosError;
      const errorMessage = err.response?.data  || "Deactivation failed";
      return rejectWithValue(errorMessage);
    }
  }
);

export const activateOrder = createAsyncThunk(
  "deliveryOrders/activateOrder",
  async (deliveryOrderId: string, { rejectWithValue })=> {
    try {
      const response = await axios.patch(`${API_URL}activate/${deliveryOrderId}`);
      return response.data;
    } catch (error) {
      const err=error as AxiosError;
      return rejectWithValue(err.response?.data || "Activation failed");
    }
  }
);

export const updateConfigInOrder = createAsyncThunk(
  "deliveryOrder/updateConfigInOrder",
  async ({
    orderId,
    configId,
    updatedConfig,
  }: {
    orderId: string;
    configId: string;
    updatedConfig: Partial<Config>;
  }) => {
     await axios.patch(
      `${API_URL}delivery-orders/${orderId}/configs/${configId}`,
      updatedConfig
    );
    return {
      ...updatedConfig,
      orderId,
      configId,
    };
  }
);
const deliveryOrderSlice = createSlice({
  name: 'deliveryOrder',
  initialState,
  reducers: {
    setEnabledOrderId(state, action: PayloadAction<string | null>) {
      state.enabledOrderId = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Orders
      .addCase(fetchDeliveryOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeliveryOrders.fulfilled, (state, action: PayloadAction<DeliveryOrderItem[]>) => {
        state.loading = false;
        state.items = action.payload;
        // Find and set the enabled order ID
        // const enabledOrder = action.payload.find(order => order.status === 'enabled');
        // state.enabledOrderId = enabledOrder?.deliveryOrderId || null;
      })
      .addCase(fetchDeliveryOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Activate Order
      .addCase(activateOrder.pending, (state) => {
        state.error = null;
      })
      .addCase(activateOrder.fulfilled, (state, action: PayloadAction<DeliveryOrderItem>) => {
        state.loading = false;
        state.items = state.items.map(order => ({
          ...order,
          status: order.deliveryOrderId === action.payload.deliveryOrderId ? 'enabled' : 'disabled'
        }));
        state.enabledOrderId = action.payload.deliveryOrderId;
      })
      .addCase(activateOrder.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      // Deactivate Order
      .addCase(deactivateOrder.pending, (state) => {
        // state.loading = true;
        state.error = null;
      })
      .addCase(deactivateOrder.fulfilled, (state, action: PayloadAction<DeliveryOrderItem>) => {
        state.loading = false;
        state.items = state.items.map(order => 
          order.deliveryOrderId === action.payload.deliveryOrderId 
            ? { ...order, status: 'disabled' } 
            : order
        );
        if (state.enabledOrderId === action.payload.deliveryOrderId) {
          state.enabledOrderId = null;
        }
      })
      .addCase(deactivateOrder.rejected, (state, action) => {
        // state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(updateConfigInOrder.fulfilled, (state, action) => {
        // Same as before, but no loading state change
        const { orderId, configId, ...updatedFields } = action.payload;
        const order = state.items.find(order => order.deliveryOrderId === orderId);
        if (order) {
          const config = order.configures.find(cfg => cfg.configId === configId);
          if (config) {
            Object.assign(config, updatedFields);
          }
        }
      })
            
      .addCase(updateConfigInOrder.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setEnabledOrderId } = deliveryOrderSlice.actions;

export default deliveryOrderSlice.reducer;