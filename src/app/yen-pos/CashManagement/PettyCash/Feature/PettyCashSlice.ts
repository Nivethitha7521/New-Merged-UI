


import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../../../../redux/store";
import { API_BASE_URL } from "../../../../../../API_URL";
import { PettyCash, initialPettyCash, initialState } from "../Models/pettycashModels";

// API Base URL
const API_URL = `${API_BASE_URL}/pettycashes/`;

const Brach_url = `${API_BASE_URL}/locations/branchnames/`;

// Fetch all PettyCash entries
export const fetchPettyCashs = createAsyncThunk<PettyCash[]>(
  "PettyCashs/fetch",
  async () => {
    const response = await axios.get(API_URL);
    return response.data;
  }
);

// // Fetch all branches
export const fetchBranches = createAsyncThunk<string[]>(
  "PettyCashs/fetchBranches",
  async () => {
    const response = await axios.get(Brach_url);
    return response.data;
  }
);

// Add a new PettyCash entry
export const addPettyCash = createAsyncThunk<PettyCash, PettyCash>(
  "PettyCashs/add",
  async (pettyCash, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, pettyCash);
      return response.data;
    }
    catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);


export const applyAllPettyCash = createAsyncThunk<void, string>(
  "OpeningCash/applyAll",
  async (value, { rejectWithValue }) => {
    try {
      await axios.post(`${API_URL}apply-all`, { pettyCash: value });
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to apply all');
    }
  }
);

// Update an existing PettyCash entry
export const updatePettyCash = createAsyncThunk<PettyCash, PettyCash>(
  "PettyCashs/update",
  async (pettyCash, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${API_URL}${pettyCash.pettyCashId}`,
        pettyCash
      );
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

// Deactivate a PettyCash entry
export const deactivatePettyCash = createAsyncThunk<PettyCash, string>(
  "PettyCashs/deactivate",
  async (pettyCashId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}${pettyCashId}`, {
        status: "deactivated",
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

// Activate a PettyCash entry
export const activatePettyCash = createAsyncThunk<PettyCash, string>(
  "PettyCashs/activate",
  async (pettyCashId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}${pettyCashId}`, {
        status: "active",
      });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

const pettyCashSlice = createSlice({
  name: "PettyCash",
  initialState,
  reducers: {
    setPettyCashData: (state, action: PayloadAction<PettyCash>) => {
      state.pettyCashData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setDialogOpen: (
      state,
      action: PayloadAction<"none" | "edit" | "add">
    ) => {
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
    resetPettyCashData: (state) => {
      state.pettyCashData = initialPettyCash;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch PettyCash entries
      .addCase(fetchPettyCashs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPettyCashs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter((item) => item.status === "active");
        state.deactivatedItems = action.payload.filter(
          (item) => item.status === "deactivated"
        );
      })
      .addCase(fetchPettyCashs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch petty cash data";
      })

      // Fetch Branches
      .addCase(fetchBranches.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading = false;
        state.allBranches = action.payload;
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch branches";
      })

      // // Add PettyCash entry
      .addCase(addPettyCash.pending, (state) => {
        state.loading = true;
      })
      .addCase(addPettyCash.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
        state.snackbarMessage = "Petty cash added successfully!";
        state.snackbarOpen = true;
        state.dialogOpen = "none";
      })
      .addCase(addPettyCash.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to add petty cash";
        state.snackbarMessage = state.error;
        state.snackbarOpen = true;
      })

      // Update PettyCash entry
      .addCase(updatePettyCash.pending, (state) => {
        state.loading = true;
      })
      .addCase(updatePettyCash.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(
          (item) => item.pettyCashId === action.payload.pettyCashId
        );
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.snackbarMessage = "Petty cash updated successfully!";
        state.snackbarOpen = true;
        state.dialogOpen = "none";
      })
      .addCase(updatePettyCash.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to update petty cash";
        state.snackbarMessage = state.error;
        state.snackbarOpen = true;
      })

      // Deactivate PettyCash entry
      .addCase(deactivatePettyCash.pending, (state) => {
        state.loading = true;
      })
      .addCase(deactivatePettyCash.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(
          (item) => item.pettyCashId === action.payload.pettyCashId
        );
        if (index !== -1) {
          const [deactivatedItem] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivatedItem);
        }
        state.snackbarMessage = "Petty cash deactivated successfully!";
        state.snackbarOpen = true;
      })
      .addCase(deactivatePettyCash.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to deactivate petty cash";
        state.snackbarMessage = state.error;
        state.snackbarOpen = true;
      })

      // Activate PettyCash entry
      .addCase(activatePettyCash.pending, (state) => {
        state.loading = true;
      })
      .addCase(activatePettyCash.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(
          (item) => item.pettyCashId === action.payload.pettyCashId
        );
        if (index !== -1) {
          const [activatedItem] = state.deactivatedItems.splice(index, 1);
          state.items.push(activatedItem);
        }
        state.snackbarMessage = "Petty cash activated successfully!";
        state.snackbarOpen = true;
      })
      .addCase(activatePettyCash.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to activate petty cash";
        state.snackbarMessage = state.error;
        state.snackbarOpen = true;
      });
  },
});

export const {
  setPettyCashData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetPettyCashData,
} = pettyCashSlice.actions;


export const selectAllBranches = (state: RootState) => state.PettyCash.allBranches;

export const selectPettyCash = (state: RootState) => state.PettyCash;

export default pettyCashSlice.reducer;






























