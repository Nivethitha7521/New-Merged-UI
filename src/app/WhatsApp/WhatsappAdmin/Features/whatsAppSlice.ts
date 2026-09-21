import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../../../redux/store";
import { WhatsApp, initialState } from "../Models/whatsappAdminModels";
import { API_BASE_URL } from "../../../../../API_URL";

const API_URL = `${API_BASE_URL}/whatsappadmin`;

const preparePayload = (data: WhatsApp): any => {
  return {
    whatsAppRollName: data.whatsAppRollName,
    // Keep mobileNumber as string, do not parseInt!
    mobileNumber: data.mobileNumber ? String(data.mobileNumber) : null,
    status: data.status,
  };
};


const normalizeData = (data: any): WhatsApp[] => {
  return data.map((item: any) => ({
    moduleAdminId: item.whatsAppId || "", // Map backend ID to frontend ID
    whatsAppRollName: item.whatsAppRollName,
    mobileNumber: item.mobileNumber ? String(item.mobileNumber) : "",
    status: item.status || "active",
  }));
};

// Fetch all WhatsApp entries
export const fetchWhatsApps = createAsyncThunk<WhatsApp[]>("WhatsApps/fetch", async () => {
  // Use trailing slash to prevent 307 Redirect
  const response = await axios.get(`${API_URL}/`); 
  return normalizeData(response.data);
});

// Add a new WhatsApp entry
export const addWhatsApp = createAsyncThunk<WhatsApp, WhatsApp>("WhatsApps/add", async (whatsApp, { rejectWithValue }) => {
  try {
    const payload = preparePayload(whatsApp);
    // Backend returns just the ID string on POST
    const response = await axios.post(`${API_URL}/`, payload);
    
    // Construct the full object to update the Redux store immediately
    return {
      ...whatsApp,
      moduleAdminId: response.data // The backend returns the new ID string
    };
  } catch (error: unknown) {
    const err = error as AxiosError;
    // Log detailed error for debugging
    console.error("Add Error:", err.response?.data);
    return rejectWithValue(err.response?.data || 'Error adding');
  }
});

// Update an existing WhatsApp entry
export const updateWhatsApp = createAsyncThunk<WhatsApp, WhatsApp>("WhatsApps/update", async (whatsApp, { rejectWithValue }) => {
  try {
    if (!whatsApp.moduleAdminId) throw new Error("ID missing");
    
    const payload = preparePayload(whatsApp);
    // FIX 3: Construct URL correctly: /api/url/{id}
    // This fixes the 405 Method Not Allowed error
    const response = await axios.patch(`${API_URL}/${whatsApp.moduleAdminId}`, payload);
    
    return normalizeData([response.data])[0];
  } catch (error: unknown) {
    const err = error as AxiosError;
    console.error("Update Error:", err.response?.data);
    return rejectWithValue(err.response?.data || 'Error updating');
  }
});

// Deactivate WhatsApp entry
export const deactivateWhatsApp = createAsyncThunk<WhatsApp, string>(
  "WhatsApps/deactivate",
  async (moduleAdminId, { rejectWithValue }) => {
    try {
      // Correct URL construction
      const response = await axios.patch(`${API_URL}/${moduleAdminId}`, { status: "deactivated" });
      return normalizeData([response.data])[0];
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error deactivating');
    }
  }
);  

// Activate a WhatsApp entry
export const activateWhatsApp = createAsyncThunk<WhatsApp, string>("WhatsApps/activate", async (moduleAdminId) => {
  // Correct URL construction
  const response = await axios.patch(`${API_URL}/${moduleAdminId}`, { status: "active" });
  return normalizeData([response.data])[0];
});

const whatsAppSlice = createSlice({
  name: "WhatsApps",
  initialState,
  reducers: {
    setWhatsAppData: (state, action: PayloadAction<WhatsApp>) => {
      const data = action.payload;
      state.whatsAppData = {
        ...data,
        mobileNumber: data.mobileNumber ? String(data.mobileNumber) : ""
      };
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setEditModuleAdminId: (state, action: PayloadAction<string | null>) => {
      state.editModuleAdminId = action.payload;
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
    resetWhatsAppState: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWhatsApps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWhatsApps.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter((whatsApp) => whatsApp.status === "active");
        state.deactivatedItems = action.payload.filter((whatsApp) => whatsApp.status === "deactivated");
      })
      .addCase(fetchWhatsApps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch WhatsApp entries";
      })
      .addCase(addWhatsApp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addWhatsApp.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === "active") {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
        state.snackbarMessage = "WhatsApp entry added successfully";
        state.snackbarOpen = true;
        state.dialogOpen = "none"; // Close dialog on success
      })
      .addCase(addWhatsApp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to add WhatsApp entry";
      })
      .addCase(updateWhatsApp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateWhatsApp.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((w) => w.moduleAdminId === action.payload.moduleAdminId);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.snackbarMessage = "WhatsApp entry updated successfully";
        state.snackbarOpen = true;
        state.dialogOpen = "none"; // Close dialog on success
      })
      .addCase(updateWhatsApp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to update WhatsApp entry";
      })
      .addCase(deactivateWhatsApp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateWhatsApp.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((w) => w.moduleAdminId === action.payload.moduleAdminId);
        if (index !== -1) {
          const [deactivatedWhatsApp] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivatedWhatsApp);
        }
        state.snackbarMessage = "WhatsApp entry deactivated successfully";
        state.snackbarOpen = true;
      })
      .addCase(deactivateWhatsApp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to deactivate WhatsApp entry";
      })
      .addCase(activateWhatsApp.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateWhatsApp.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex((w) => w.moduleAdminId === action.payload.moduleAdminId);
        if (index !== -1) {
          const [activatedWhatsApp] = state.deactivatedItems.splice(index, 1);
          state.items.push(activatedWhatsApp);
        }
        state.snackbarMessage = "WhatsApp entry activated successfully";
        state.snackbarOpen = true;
      })
      .addCase(activateWhatsApp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to activate WhatsApp entry";
      });
  },
});

export const {
  setWhatsAppData,
  setEditIndex,
  setEditModuleAdminId,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetWhatsAppState,
} = whatsAppSlice.actions;

export const selectWhatsApps = (state: RootState) => state.WhatsApp;

export default whatsAppSlice.reducer;