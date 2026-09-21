import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../redux/store';

import { Tax, initialtax, initialState } from '../Models/taxModels';
import { API_BASE_URL } from "../../../../../API_URL";

// API Base URL
const tax_API_URL = `${API_BASE_URL}/taxes/`;


//Fetch All Taxes
export const fetchtaxs = createAsyncThunk<Tax[]>("tax/fetch", async () => {
  const response = await axios.get(tax_API_URL);
  return response.data;
});

//Add New Tax
export const addtax = createAsyncThunk<Tax, Tax, { rejectValue: any }>(
  "tax/add",
  async (tax, { rejectWithValue }) => {
    try {
      const response = await axios.post(tax_API_URL, tax);
      return response.data;
    } catch (error) {
      let err: AxiosError = error as AxiosError;
      return rejectWithValue(err.response?.data ?? { detail: err.message });
    }
  }
);

//Update the Tax
export const updatetax = createAsyncThunk<Tax, Tax, { rejectValue: any }>(
  "tax/update",
  async (tax, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${tax_API_URL}${tax.id}`, tax);
      return response.data;
    } catch (error) {
      let err: AxiosError = error as AxiosError;
      return rejectWithValue(err.response?.data ?? { detail: err.message });
    }
  }
);


//Deactivate Tax
export const deactivatetax = createAsyncThunk<Tax, string>("tax/deactivate", async (id) => {
  const response = await axios.patch(`${tax_API_URL}${id}`, { status: "deactivated" });
  return response.data;
})

//Activate Tax
export const activatetax = createAsyncThunk<Tax, string>("tax/activate", async (id) => {
  const response = await axios.patch(`${tax_API_URL}${id}`, { status: "active" });
  return response.data;
});




const taxSlice = createSlice({
  name: 'tax',
  initialState,
  reducers: {
    settaxData: (state, action: PayloadAction<Tax>) => {
      state.taxData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setDialogOpen: (state, action: PayloadAction<'none' | 'edit' | 'add'>) => {
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
    resettaxData: (state) => {
      state.taxData = initialtax;
    },
  },


  extraReducers: (builder) => {
    builder


      // Fetch taxs
      .addCase(fetchtaxs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchtaxs.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter(item => item.status === 'active');
        state.deactivatedItems = action.payload.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchtaxs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch taxs';
      })


      //Add Tax

      // Add Tax
      .addCase(addtax.rejected, (state, action) => {
        state.snackbarOpen = true;
        state.snackbarMessage =
          (action.payload as any)?.detail || action.error.message || "Failed to add tax";
      })

      .addCase(addtax.fulfilled, (state, action) => {
        if (action.payload.status === "active") {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
          state.snackbarMessage = "Tax added successfully";
          state.snackbarOpen = true;
        }
      })


      //Update Tax

      .addCase(updatetax.rejected, (state, action) => {
        state.snackbarOpen = true;
        state.snackbarMessage =
          (action.payload as any)?.detail || action.error.message || "Failed to update tax";
      })
      .addCase(updatetax.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.snackbarMessage = "Tax updated successfully";
        state.snackbarOpen = true;
      })

      //Deactivate Tax
      .addCase(deactivatetax.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index != -1) {
          const [deactivatedTax] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivatedTax);
        }
        state.snackbarMessage = "Tax deactivated successfully";
        state.snackbarOpen = true;
      })

      //Activate Tax
      .addCase(activatetax.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index != -1) {
          const [activatedTax] = state.items.splice(index, 1);
          state.items.push(activatedTax);
        }
        state.snackbarMessage = "Tax activated successfully";
        state.snackbarOpen = true;
      });

  },
});

export const {
  settaxData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resettaxData,
} = taxSlice.actions;

export const selecttax = (state: RootState) => state.taxes;

export default taxSlice.reducer;