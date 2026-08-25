import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";

import { DeliveryType, initialState } from "../Models/deliverytypeModels";
import { API_BASE_URL } from "../../../../../../API_URL";

const API_URL = `${API_BASE_URL}/deliverytypes/`; // Adjust this based on your actual API route



// ✅ Fetch all delivery types
export const fetchDeliveryTypes = createAsyncThunk(
  "deliveryTypes/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL);
    //  console.log(response.data);
      
      return response.data;
    } catch (error) {
      const err=error as AxiosError
      return rejectWithValue(
        err.response?.data || "Failed to fetch delivery types"
      );
    }
  }
);

// ✅ Create a new delivery type
export const createDeliveryType = createAsyncThunk(
  "deliveryTypes/create",
  async (deliveryTypeData:Omit< DeliveryType,'deliveryTypeId'>, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, deliveryTypeData);
      return { ...deliveryTypeData, deliveryTypeId: response.data };
    } catch (error) {
      const err=error as AxiosError
      return rejectWithValue(
        err.response?.data || "Failed to create delivery type"
      );
    }
  }
);

// ✅ Update a delivery type
export const updateDeliveryType = createAsyncThunk(
  "deliveryTypes/update",
  async (
    {
      deliveryTypeId,
      updates,
    }: {
      deliveryTypeId: string;
      updates: Partial<DeliveryType>;
    },
    { rejectWithValue }
  ) => {
    try {
      // Clean the updates object before sending
      const cleanedUpdates: Partial<DeliveryType> = {
        ...updates,
        // user: updates.user === "" ? undefined : updates.user,
        remarks: updates.remarks === "" ? undefined : updates.remarks,
      };

      const response = await axios.patch(
        `${API_URL}${deliveryTypeId}`,
        cleanedUpdates
      );
      return response.data;
    } catch (error) {
      const err=error as AxiosError
      return rejectWithValue(
        err.response?.data || "Failed to update delivery type"
      );
    }
  }
);
// #Activate the  Delivery Order
export const activateDeliveryType = createAsyncThunk(
  "deliveryTypes/activate",
  async (deliveryTypeId: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_URL}${deliveryTypeId}/activate`
      );
      return response.data;
    } catch (error) {
      const err=error as AxiosError
      return rejectWithValue(
        err.response?.data || "Failed to Activate delivery type"
      );
    }
  }
);

// #Deactivate the Delivery Order

export const deactivateDeliveryType = createAsyncThunk(
  "deliveryTypes/deactivate",
  async (deliveryTypeId: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_URL}${deliveryTypeId}/deactivate`
      );
      return response.data;
    } catch (error) {
      const err =error as AxiosError
      return rejectWithValue(
        err.response?.data || "Failed to Deactivate delivery type"
      );
    }
  }
);

const deliveryTypeSlice = createSlice({
  name: "deliveryTypes",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeliveryTypes.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchDeliveryTypes.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.types = action.payload;
      })
      .addCase(fetchDeliveryTypes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(createDeliveryType.fulfilled, (state, action) => {
        state.types.push(action.payload);
      })
      .addCase(updateDeliveryType.fulfilled, (state, action) => {
        const index = state.types.findIndex(
          (type) => type.deliveryTypeId === action.payload.deliveryTypeId
        );
        if (index !== -1) {
          state.types[index] = action.payload;
        }
      })
      // Activate delivery type
      .addCase(activateDeliveryType.fulfilled, (state, action) => {
        state.types = state.types.map((type: DeliveryType) =>
          type.deliveryTypeId === action.payload.deliveryTypeId
            ? {
                ...type,
                status: "active",
                updatedDate: action.payload.updatedDate,
              }
            : type
        );
      })
      .addCase(activateDeliveryType.rejected, (state, action) => {
        state.error = action.payload as string;
      })

      // Deactivate delivery type
      .addCase(deactivateDeliveryType.fulfilled, (state, action) => {
        state.types = state.types.map((type:DeliveryType) =>
          type.deliveryTypeId === action.payload.deliveryTypeId
            ? {
                ...type,
                status: "deactivate",
                updatedDate: action.payload.updatedDate,
              }
            : type
        );
      })
      .addCase(deactivateDeliveryType.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});
export default deliveryTypeSlice.reducer;
