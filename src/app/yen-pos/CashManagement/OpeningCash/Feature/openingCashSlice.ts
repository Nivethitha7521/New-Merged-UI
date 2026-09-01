


import { RootState } from "@/redux/store";
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import {  OpeningCash, initialOpeningCash, initialState } from "../Models/openingcashModels";
import { API_BASE_URL } from "../../../../../../API_URL";

// API URLs
const API_URL = `${API_BASE_URL}/openingcashes/`;
const BRANCHES_API_URL = `${API_BASE_URL}/locations/branchnames/`;

// Fetch all opening cash entries
export const fetchOpeningCashs = createAsyncThunk<OpeningCash[]>(
  "OpeningCash/fetch",
  async () => {
    const response = await axios.get(API_URL);
  //  console.log(`${response.data}`);
    return response.data;
  }
);


// Fetch all branches
export const fetchBranches = createAsyncThunk<string[]>(
  "branches/fetch",
  async () => {
    const response = await axios.get(BRANCHES_API_URL);
    return response.data;
  }
);

// // Add a new opening cash entry
export const addOpeningCash = createAsyncThunk<OpeningCash, OpeningCash>(
  "OpeningCash/add",
  async (openingCash) => {
    const response = await axios.post(API_URL, openingCash);
    return response.data;
  }
);



export const applyAllOpeningCash = createAsyncThunk<void, string>(
  "OpeningCash/applyAll",
  async (value, { rejectWithValue }) => {
    try {
      await axios.post(`${API_URL}apply-all`, { systemOpenCash: value });
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Failed to apply all');
    }
  }
);

// Update an existing opening cash entry
export const updateOpeningCash = createAsyncThunk<OpeningCash, OpeningCash>(
  "OpeningCash/update",
  async (openingCash) => {
    const response = await axios.patch(`${API_URL}${openingCash.systemOpenCashId}`, openingCash);
    return response.data;
  }
);

// Deactivate opening cash entry
export const deactivateOpeningCash = createAsyncThunk<OpeningCash, string>(
  "OpeningCash/deactivate",
  async (systemOpenCashId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}${systemOpenCashId}`, { status: "deactivated" });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error deactivating opening cash');
    }
  }
);

// Activate opening cash entry
export const activateOpeningCash = createAsyncThunk<OpeningCash, string>(
  "OpeningCash/activate",
  async (systemOpenCashId) => {
    const response = await axios.patch(`${API_URL}${systemOpenCashId}`, { status: "active" });
    return response.data;
  }
);

const openingCashSlice = createSlice({
  name: "OpeningCash",
  initialState,
  reducers: {
    setOpeningCashData: (state, action: PayloadAction<OpeningCash>) => {
      state.openingCashData = action.payload;
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
    resetOpeningCashData: (state) => {
      state.openingCashData = initialOpeningCash;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Opening Cash
      .addCase(fetchOpeningCashs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOpeningCashs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter(item => item.status === "active");
        state.deactivatedItems = action.payload.filter(item => item.status === "deactivated");
      })
      .addCase(fetchOpeningCashs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch opening cash entries";
      })
      // Fetch Branches
      .addCase(fetchBranches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading = false;
        state.allBranches = action.payload;
     //   console.log("Branches loaded:", action.payload);
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch branches";
      })
      // // Add
      .addCase(addOpeningCash.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addOpeningCash.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === "active") {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
      })
      .addCase(addOpeningCash.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to add opening cash entry";
      })
      // Update
      .addCase(updateOpeningCash.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOpeningCash.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.systemOpenCashId === action.payload.systemOpenCashId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(updateOpeningCash.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to update opening cash entry";
      })
      // Deactivate
      .addCase(deactivateOpeningCash.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateOpeningCash.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.systemOpenCashId === action.payload.systemOpenCashId);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
      })
      .addCase(deactivateOpeningCash.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to deactivate opening cash entry";
      })
      // Activate
      .addCase(activateOpeningCash.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateOpeningCash.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(p => p.systemOpenCashId === action.payload.systemOpenCashId);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
      })
      .addCase(activateOpeningCash.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to activate opening cash entry";
      });
  },
});

export const {
  setOpeningCashData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetOpeningCashData,
} = openingCashSlice.actions;

// NEW: Selector to get all branch names
export const selectAllBranches = (state: RootState) => state.OpeningCash.allBranches;

export const selectOpeningCash = (state: RootState) => state.OpeningCash;

export default openingCashSlice.reducer;



