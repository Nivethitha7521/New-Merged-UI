
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../../../../redux/store";

import { Charges, initialState } from "../Models/chargeModels";
import { API_BASE_URL } from "../../../../../../API_URL";

const API_URL = `${API_BASE_URL}/charges/`;

// Fetch all Charges
export const fetchCharges = createAsyncThunk<Charges[]>("Charges/fetch", async () => {
  const response = await axios.get(API_URL);
  return response.data;
});

// Add a new Charges
export const addCharge = createAsyncThunk<Charges, Charges>("Charges/add", async (charge) => {
  const response = await axios.post(API_URL, charge);
  return response.data;
});

// Update an existing Charges
export const updateCharge = createAsyncThunk<Charges, Charges>("Charges/update", async (charge) => {
  const response = await axios.patch(`${API_URL}${charge.chargeId}`, charge);
  return response.data;
});

// Deactive Charges
export const deactivateCharge = createAsyncThunk<Charges, string>(
  "Charges/deactivate",
  async (chargeId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}${chargeId}`, { status: "deactivated" });
      return response.data; 
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding Charges');
    }
  }
);

// Activate a Charges
export const activateCharge = createAsyncThunk<Charges, string>("Charges/activate", async (chargeId) => {
  const response = await axios.patch(`${API_URL}${chargeId}`, { status: "active" });
  return response.data;
});

const chargeSlice = createSlice({
  name: "Charges",
  initialState,
  reducers: {
    setChargeData: (state, action: PayloadAction<Charges>) => {
      state.chargeData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setEditChargeId: (state, action: PayloadAction<string | null>) => {
      state.editchargeId = action.payload;
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

      .addCase(fetchCharges.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCharges.fulfilled, (state, action) => {
        state.loading = false;
        state.charge = action.payload
      })
      .addCase(fetchCharges.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch Charges";
      })
      .addCase(addCharge.fulfilled, (state, action) => {
        if (action.payload.status === "active") {
          state.charge.push(action.payload);
        } else {
          state.deactivatedcharge.push(action.payload);
        }
      })
      .addCase(updateCharge.fulfilled, (state, action) => {
        const index = state.charge.findIndex((p) => p.chargeId === action.payload.chargeId);
        if (index !== -1) {
          state.charge[index] = action.payload;
        }
      })
      .addCase(deactivateCharge.fulfilled, (state, action) => {
        const index = state.charge.findIndex((p) => p.chargeId === action.payload.chargeId);
        if (index !== -1) {
          const [deactivatedCharges] = state.charge.splice(index, 1);
          state.deactivatedcharge.push(deactivatedCharges);
        }
      })
      .addCase(activateCharge.fulfilled, (state, action) => {
        const index = state.deactivatedcharge.findIndex((p) => p.chargeId === action.payload.chargeId);
        if (index !== -1) {
          const [activatedCharges] = state.deactivatedcharge.splice(index, 1);
          state.charge.push(activatedCharges);
        }
      });
  },
});

export const {
  setChargeData,
  setEditIndex,
  setEditChargeId,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
} = chargeSlice.actions;

export const selectCharges = (state: RootState) => state.Charges;

export default chargeSlice.reducer;
