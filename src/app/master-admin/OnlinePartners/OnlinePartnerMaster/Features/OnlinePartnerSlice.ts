import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../../../../redux/store";

import { OnlinePartner, initialState } from "../Models/partnerModels";
import { API_BASE_URL } from "../../../../../../API_URL";

// API Base URL
const API_URL = `${API_BASE_URL}/OnlinePartner`;

// Fetch all online partners
export const fetchOnlinePartners = createAsyncThunk<OnlinePartner[]>("onlinePartners/fetch", async () => {
    const response = await axios.get(API_URL);
    return response.data;
});

// Add a new online partner
export const addOnlinePartner = createAsyncThunk<OnlinePartner, OnlinePartner>(
  "onlinePartners/add",
  async (partner, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, partner);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{ detail: string }>;
      return rejectWithValue(err.response?.data || { detail: 'Error adding partner' });
    }
  }
);


// Update an existing online partner
export const updateOnlinePartner = createAsyncThunk<OnlinePartner, OnlinePartner>("onlinePartners/update", async (partner) => {
    const response = await axios.patch(`${API_URL}/${partner.onlinePartnersId}`, partner);
    return response.data;
});

// Deactivate an online partner
export const deactivateOnlinePartner = createAsyncThunk<OnlinePartner, string>(
    "onlinePartners/deactivate",
    async (partnerId, { rejectWithValue }) => {
        try {
            const response = await axios.patch(`${API_URL}/${partnerId}`, { status: "deactivated" });
            return response.data; // Ensure response contains updated partner object
        } catch (error: unknown) {
              const err = error as AxiosError;
              return rejectWithValue(err.response?.data || 'Error adding addOn');
            }
    }
);

// Activate an online partner
export const activateOnlinePartner = createAsyncThunk<OnlinePartner, string>("onlinePartners/activate", async (partnerId) => {
    const response = await axios.patch(`${API_URL}/${partnerId}`, { status: "active" });
    return response.data;
});

const onlinePartnersSlice = createSlice({
    name: "onlinePartners",
    initialState,
    reducers: {
        setPartnerData: (state, action: PayloadAction<OnlinePartner>) => {
            state.partnerData = action.payload;
        },
        setEditIndex: (state, action: PayloadAction<number | null>) => {
            state.editIndex = action.payload;
        },
        setEditPartnerId: (state, action: PayloadAction<string | null>) => {
            state.editPartnerId = action.payload;
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
            .addCase(fetchOnlinePartners.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchOnlinePartners.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                state.items = action.payload.filter((partner) => partner.status === "active");
                state.deactivatedItems = action.payload.filter((partner) => partner.status === "deactivated");
            })
            .addCase(fetchOnlinePartners.rejected, (state, action) => {
                state.loading = false;
                state.error = action.error.message ?? "Failed to fetch online partners";
            })
            .addCase(addOnlinePartner.fulfilled, (state, action) => {
                if (action.payload.status === "active") {
                    state.items.push(action.payload);
                } else {
                    state.deactivatedItems.push(action.payload);
                }
                state.snackbarMessage = "Partner Created Successfully";
                state.snackbarOpen = true;
            })
            .addCase(updateOnlinePartner.fulfilled, (state, action) => {
                const index = state.items.findIndex((p) => p.onlinePartnersId === action.payload.onlinePartnersId);
                if (index !== -1) {
                    state.items[index] = action.payload;
                    state.snackbarMessage = "Partner Updated successfully";
                    state.snackbarOpen = true;
                }
                
            })
            .addCase(deactivateOnlinePartner.fulfilled, (state, action) => {
                const index = state.items.findIndex((p) => p.onlinePartnersId === action.payload.onlinePartnersId);
                if (index !== -1) {
                    const [deactivatedPartner] = state.items.splice(index, 1);
                    state.deactivatedItems.push(deactivatedPartner);
                    state.snackbarMessage = "Partner Deactivated successfully";
                    state.snackbarOpen = true;
                }
            })
            .addCase(activateOnlinePartner.fulfilled, (state, action) => {
                const index = state.deactivatedItems.findIndex((p) => p.onlinePartnersId === action.payload.onlinePartnersId);
                if (index !== -1) {
                    const [activatedPartner] = state.deactivatedItems.splice(index, 1);
                    state.items.push(activatedPartner);
                    state.snackbarMessage = "Partner Activated successfully";
                    state.snackbarOpen = true;
                }
            });
    },
});

export const {
    setPartnerData,
    setEditIndex,
    setEditPartnerId,
    setDialogOpen,
    setSnackbarOpen,
    setSnackbarMessage,
    setSearchQuery,
    setShowDeactivated,
} = onlinePartnersSlice.actions;

export const selectOnlinePartners = (state: RootState) => state.onlinePartners;

export default onlinePartnersSlice.reducer;