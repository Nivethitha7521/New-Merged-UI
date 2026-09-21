


import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../../../redux/store";

import { Reasons, initialState } from "../Models/reasonModels";
import { API_BASE_URL } from "../../../../../API_URL";

const API_URL = `${API_BASE_URL}/reasons/`;

// Fetch all Reasons
export const fetchReasons = createAsyncThunk<Reasons[]>("Reasons/fetch", async () => {
  const response = await axios.get(API_URL);
  return response.data;
});

// Add a new Reason
// NOTE: backend's create_reason returns just the new record's id (a string),
// so after adding we re-fetch the full list from the page rather than relying
// on this thunk's payload.
export const addReason = createAsyncThunk<string, Reasons>("Reasons/add", async (reasonData) => {
  const { id, ...payload } = reasonData; // ReasonPost has no id field
  const response = await axios.post(API_URL, payload);
  return response.data;
});

// Update an existing Reason
export const updateReason = createAsyncThunk<Reasons, Reasons>("Reasons/update", async (reasonData) => {
  const response = await axios.patch(`${API_URL}${reasonData.id}`, reasonData);
  return response.data;
});

// Deactivate a Reason
export const deactivateReason = createAsyncThunk<Reasons, string>(
  "Reasons/deactivate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}${id}`, { status: "deactivated" });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || "Error deactivating Reason");
    }
  }
);

// Activate a Reason
export const activateReason = createAsyncThunk<Reasons, string>("Reasons/activate", async (id) => {
  const response = await axios.patch(`${API_URL}${id}`, { status: "active" });
  return response.data;
});

const reasonSlice = createSlice({
  name: "Reasons",
  initialState,
  reducers: {
    setReasonData: (state, action: PayloadAction<Reasons>) => {
      state.reasonData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setEditReasonId: (state, action: PayloadAction<string | null>) => {
      state.editReasonId = action.payload;
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
      .addCase(fetchReasons.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReasons.fulfilled, (state, action) => {
        state.loading = false;
        //state.reasons = action.payload.filter((r) => r.status !== "active");
        state.reasons = action.payload;
        state.deactivatedReasons = action.payload.filter((r) => r.status === "deactivated");
      })
      .addCase(fetchReasons.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch Reasons";
      })
      .addCase(updateReason.fulfilled, (state, action) => {
        const activeIndex = state.reasons.findIndex((r) => r.id === action.payload.id);
        if (activeIndex !== -1) {
          state.reasons[activeIndex] = action.payload;
        }
      })
      .addCase(deactivateReason.fulfilled, (state, action) => {
        const index = state.reasons.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.reasons.splice(index, 1);
          state.deactivatedReasons.push({ ...deactivated, status: "deactivated" });
        }
      })
      .addCase(activateReason.fulfilled, (state, action) => {
        const index = state.deactivatedReasons.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedReasons.splice(index, 1);
          state.reasons.push({ ...activated, status: "active" });
        }
      });
  },
});

export const {
  setReasonData,
  setEditIndex,
  setEditReasonId,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
} = reasonSlice.actions;

export const selectReasons = (state: RootState) => state.Reasons;

export default reasonSlice.reducer;