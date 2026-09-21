

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../../../../redux/store";
import { Branch, AdvanceAmount, initialAdvanceAmount, initialState } from "../Models/advanceamountModels";
import { API_BASE_URL } from "../../../../../../API_URL";

// API Base URL
const BRANCHES_API_URL = `${API_BASE_URL}/locations/branchnames/`  
const API_URL = `${API_BASE_URL}/advanceamounts/`;



// Fetch all advance amounts
export const fetchAdvanceAmounts = createAsyncThunk<AdvanceAmount[]>(
  "AdvanceAmount/fetch",
  async () => {
    const response = await axios.get(API_URL);
    return response.data;
  }
);


// Fetch all branches
export const fetchBranches = createAsyncThunk<string[]>(
  "branch/fetch",
  async () => {
    const response = await axios.get(BRANCHES_API_URL);
    return response.data;
  }
);


// Add a new advance amount
export const addAdvanceAmount = createAsyncThunk<AdvanceAmount, AdvanceAmount>(
  "AdvanceAmount/add",
  async (advanceAmount) => {
    const response = await axios.post(API_URL, advanceAmount);
    return response.data;
  }
);


export const applyAllamounts = createAsyncThunk<void, string>(
  "advance/applyAll",
  async (value, { rejectWithValue }) => {
    try {
      await axios.post(`${API_URL}apply-all`, { percentage: value });
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to apply all');
    }
  }
);

// Update an existing advance amount
export const updateAdvanceAmount = createAsyncThunk<AdvanceAmount, AdvanceAmount>(
  "AdvanceAmount/update",
  async (advanceAmount) => {
    const response = await axios.patch(`${API_URL}${advanceAmount.amountId}`, advanceAmount);
    return response.data;
  }
);

// Deactivate advance amount
export const deactivateAdvanceAmount = createAsyncThunk<AdvanceAmount, string>(
  "AdvanceAmount/deactivate",
  async (amountId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}${amountId}`, { status: "deactivated" });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }

  }
);

// Activate advance amount
export const activateAdvanceAmount = createAsyncThunk<AdvanceAmount, string>(
  "AdvanceAmount/activate",
  async (amountId) => {
    const response = await axios.patch(`${API_URL}${amountId}`, { status: "active" });
    return response.data;
  }
);



const advanceAmountSlice = createSlice({
  name: "AdvanceAmount",
  initialState,
  reducers: {
    setAdvanceAmountData: (state, action: PayloadAction<AdvanceAmount>) => {
      state.advanceAmountData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setDialogOpen: (state, action: PayloadAction<"none" | "edit" | "add">) => {
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
    resetAdvanceAmountData: (state) => {
      state.advanceAmountData = initialAdvanceAmount;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Advance Amounts
      .addCase(fetchAdvanceAmounts.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchAdvanceAmounts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter(item => item.status === "active");
        state.deactivatedItems = action.payload.filter(item => item.status === "deactivated");
      })
      .addCase(fetchAdvanceAmounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch advance amounts";
      })

      // Fetch Branches
      .addCase(fetchBranches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading = false;
        state.allBranch = action.payload;
     //   console.log("Branches loaded:", action.payload);
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch branches";
      })

      // Add Advance Amount
      .addCase(addAdvanceAmount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addAdvanceAmount.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === "active") {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
        state.snackbarMessage = "AdvanceAmount Created successfully";
        state.snackbarOpen = true;
      })
      .addCase(addAdvanceAmount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string ?? "Failed to add advance amount";
      })

      // Update Advance Amount
      .addCase(updateAdvanceAmount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateAdvanceAmount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.amountId === action.payload.amountId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.snackbarMessage = "AdvanceAmount Updated successfully";
        state.snackbarOpen = true;
      })
      .addCase(updateAdvanceAmount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string ?? "Failed to update advance amount";
      })

      // Deactivate Advance Amount
      .addCase(deactivateAdvanceAmount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateAdvanceAmount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.amountId === action.payload.amountId);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
      })
      .addCase(deactivateAdvanceAmount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string ?? "Failed to deactivate advance amount";
      })

      // Activate Advance Amount
      .addCase(activateAdvanceAmount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateAdvanceAmount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(p => p.amountId === action.payload.amountId);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
      })
      .addCase(activateAdvanceAmount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string ?? "Failed to activate advance amount";
      });
  },
});

export const {
  setAdvanceAmountData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetAdvanceAmountData,
} = advanceAmountSlice.actions;

export const selectAdvanceAmount = (state: RootState) => state.AdvanceAmount;
export const selectAllBranches = (state: RootState) => state.AdvanceAmount.allBranch;

export default advanceAmountSlice.reducer;