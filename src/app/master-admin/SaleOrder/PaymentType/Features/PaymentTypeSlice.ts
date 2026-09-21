
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../../../../redux/store";

import { PaymentType, initialState } from "../Models/paymenttypeModels";
import { API_BASE_URL } from "../../../../../../API_URL";


const API_URL = `${API_BASE_URL}/payments/`;


// Fetch all payments
export const fetchPayments = createAsyncThunk<PaymentType[]>("payments/fetch", async () => {
  const response = await axios.get(API_URL);
  return response.data;
});

// Add a new payment
export const addPayment = createAsyncThunk<PaymentType, PaymentType>("payments/add", async (payment) => {
  const response = await axios.post(API_URL, payment);
  return response.data;
});

// Update an existing payment
export const updatePayment = createAsyncThunk<PaymentType, PaymentType>("payments/update", async (payment) => {
  const response = await axios.patch(`${API_URL}${payment.paymentTypeId}`, payment);
  return response.data;
});

// Deactive Payment
export const deactivatePayment = createAsyncThunk<PaymentType, string>(
  "payments/deactivate",
  async (paymentTypeId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}${paymentTypeId}`, { status: "deactivated" });
      return response.data; // Ensure response contains updated payment object
    } catch (error: unknown) {
          const err = error as AxiosError;
          return rejectWithValue(err.response?.data || 'Error adding addOn');
        }
  }
);  

// Activate a payment
export const activatePayment = createAsyncThunk<PaymentType, string>("payments/activate", async (paymentTypeId) => {
  const response = await axios.patch(`${API_URL}${paymentTypeId}`, { status: "active" });
  return response.data;
});

const paymentSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    setPaymentData: (state, action: PayloadAction<PaymentType>) => {
      state.paymentData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setEditPaymentTypeId: (state, action: PayloadAction<string | null>) => {
      state.editPaymentTypeId = action.payload;
    },
    setDialogOpen: (state, action: PayloadAction<"none" | "edit" | "deactivated" | "add">) => {
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
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter((payment) => payment.status === "active");
        state.deactivatedItems = action.payload.filter((payment) => payment.status === "deactivated");
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch payments";
      })
      .addCase(addPayment.fulfilled, (state, action) => {
        if (action.payload.status === "active") {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
      })
      .addCase(updatePayment.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.paymentTypeId === action.payload.paymentTypeId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deactivatePayment.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.paymentTypeId === action.payload.paymentTypeId);
        if (index !== -1) {
          const [deactivatedPayment] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivatedPayment);
        }
      })
      .addCase(activatePayment.fulfilled, (state, action) => {
        const index = state.deactivatedItems.findIndex((p) => p.paymentTypeId === action.payload.paymentTypeId);
        if (index !== -1) {
          const [activatedPayment] = state.deactivatedItems.splice(index, 1);
          state.items.push(activatedPayment);
        }
      });
  },
});

export const {
  setPaymentData,
  setEditIndex,
  setEditPaymentTypeId,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
} = paymentSlice.actions;

export const selectPayments = (state: RootState) => state.payment;

export default paymentSlice.reducer;
