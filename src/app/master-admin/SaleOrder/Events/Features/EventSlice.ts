
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../../../../redux/store";

import { Event, initialState } from "../Models/eventModels";
import { API_BASE_URL } from "../../../../../../API_URL";

const API_URL = `${API_BASE_URL}/events/`;

// Fetch all payments
export const fetchEvents = createAsyncThunk<Event[]>("Events/fetch", async () => {
  const response = await axios.get(API_URL);
  return response.data;
});

// Add a new payment
export const addEvent = createAsyncThunk<Event, Event>("Events/add", async (event) => {
  const response = await axios.post(API_URL, event);
  return response.data;
});

// Update an existing payment
export const updateEvent = createAsyncThunk<Event, Event>("Events/update", async (event) => {
  const response = await axios.patch(`${API_URL}${event.eventId}`, event);
  return response.data;
});

// Deactive Payment
export const deactivateEvent = createAsyncThunk<Event, string>(
  "Events/deactivate",
  async (eventId, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}${eventId}`, { status: "deactivated" });
      return response.data; // Ensure response contains updated payment object
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding Events');
    }
  }
);

// Activate a payment
export const activateEvent = createAsyncThunk<Event, string>("Events/activate", async (eventId) => {
  const response = await axios.patch(`${API_URL}${eventId}`, { status: "active" });
  return response.data;
});

const eventSlice = createSlice({
  name: "Events",
  initialState,
  reducers: {
    setEventData: (state, action: PayloadAction<Event>) => {
      state.eventData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setEditeventId: (state, action: PayloadAction<string | null>) => {
      state.editeventId = action.payload;
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
      .addCase(fetchEvents.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload
        // .filter((event) => event.status === "active");
        // state.deactivatedItems = action.payload.filter((event) => event.status === "deactivated");
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch payments";
      })
      .addCase(addEvent.fulfilled, (state, action) => {
        if (action.payload.status === "active") {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
      })
      .addCase(updateEvent.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.eventId === action.payload.eventId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deactivateEvent.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.eventId === action.payload.eventId);
        if (index !== -1) {
          const [deactivatedEvent] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivatedEvent);
        }
      })
      .addCase(activateEvent.fulfilled, (state, action) => {
        const index = state.deactivatedItems.findIndex((p) => p.eventId === action.payload.eventId);
        if (index !== -1) {
          const [activatedEvent] = state.deactivatedItems.splice(index, 1);
          state.items.push(activatedEvent);
        }
      });
  },
});

export const {
  setEventData,
  setEditIndex,
  setEditeventId,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
} = eventSlice.actions;

export const selectEvents = (state: RootState) => state.Event;

export default eventSlice.reducer;
