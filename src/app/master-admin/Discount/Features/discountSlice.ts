
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../../../redux/store";
import { API_BASE_URL } from "../../../../../API_URL";
import { Discount, initialState, initialDiscount } from "../Models/discountModels";
import { ImportResponse } from "../../Items/Category/Models/categoryModels";


// API Base URL
const DISCOUNT_API_URL = `${API_BASE_URL}/discounts/`;


// Fetch all Discounts
export const fetchDiscounts = createAsyncThunk<Discount[]>("discount/fetch", async () => {
  const response = await axios.get(DISCOUNT_API_URL);
  return response.data;
});

// Add a new Discount
export const addDiscount = createAsyncThunk<Discount, Discount>(
  "discount/add",
  async (discount, { rejectWithValue }) => {
    try {
      const response = await axios.post(DISCOUNT_API_URL, discount);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

// Update an existing Discount
export const updateDiscount = createAsyncThunk<Discount, Discount>(
  "discount/update",
  async (discount, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${DISCOUNT_API_URL}${discount.id}`, discount);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

// Deactivate Discount
export const deactivateDiscount = createAsyncThunk<Discount, string>(
  "Discount/deactivate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${DISCOUNT_API_URL}${id}`, { status: "deactivated" });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

// Activate Discount
export const activateDiscount = createAsyncThunk<Discount, string>(
  "discount/activate",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${DISCOUNT_API_URL}${id}`, { status: "active" });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);






// Export CSV
export const discountExport = createAsyncThunk<void, void>(
  "discountExport/fetch",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get(`${DISCOUNT_API_URL}export-csv`, {
        responseType: "blob",
      });

      const fileName = `discount_export.csv`;
      const fileType = "text/csv;charset=utf-8;";

      const blob = new Blob([response.data], { type: fileType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Discount data exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Discount data"));
      throw err;
    }
  }
);

// Import CSV
export const discountImport = createAsyncThunk<ImportResponse, File>(
  "discountImport/add",
  async (file, { dispatch, rejectWithValue }) => {
    if (!file.name.endsWith('.csv')) {
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Please upload a valid CSV file"));
      return rejectWithValue("Invalid file format. Please upload a CSV file.");
    }

    const form = new FormData();
    form.append("file", file);
    try {
      const response = await axios.post(`${DISCOUNT_API_URL}import-csv`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      dispatch(fetchDiscounts()); // Refresh categories after import
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to import Discount data"));
      return rejectWithValue(err.response?.data || "Failed to import Discount data");
    }
  }
);








const discountSlice = createSlice({
  name: "discount",
  initialState,
  reducers: {
    setDiscountData: (state, action: PayloadAction<Discount>) => {
      state.discountData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setDialogOpen: (state, action: PayloadAction<"none" | "edit" | "add" | "deactivated">) => {
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
    resetDiscountData: (state) => {
      state.discountData = initialDiscount;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Discounts
      .addCase(fetchDiscounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscounts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter((item) => item.status === "active");
        state.deactivatedItems = action.payload.filter((item) => item.status === "deactivated");
      })
      .addCase(fetchDiscounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch discounts";
      })

      // Add Discount
      .addCase(addDiscount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addDiscount.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === "active") {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
        state.snackbarMessage = "Discount added successfully";
        state.snackbarOpen = true;
        state.dialogOpen = "none";
      })
      // .addCase(addDiscount.rejected, (state, action) => {
      //   state.loading = false;
      //   state.error = action.error.message ?? "Failed to add discount";
      //   state.snackbarMessage = "Failed to add discount";
      //   state.snackbarOpen = true;
      // })

      .addCase(addDiscount.rejected, (state, action) => {
        state.snackbarOpen = true;
        state.snackbarMessage =
          (action.payload as any)?.detail || action.error.message || "Failed to add Discount";
      })

      // Update Discount
      .addCase(updateDiscount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDiscount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.snackbarMessage = "Discount updated successfully";
        state.snackbarOpen = true;
        state.dialogOpen = "none";
      })
      .addCase(updateDiscount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to update discount";
        state.snackbarMessage = "Failed to update discount";
        state.snackbarOpen = true;
      })

      // Deactivate Discount
      .addCase(deactivateDiscount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateDiscount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
        state.snackbarMessage = "Discount deactivated successfully";
        state.snackbarOpen = true;
      })
      .addCase(deactivateDiscount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to deactivate discount";
        state.snackbarMessage = "Failed to deactivate discount";
        state.snackbarOpen = true;
      })

      // Activate Discount
      .addCase(activateDiscount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateDiscount.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
        state.snackbarMessage = "Discount activated successfully";
        state.snackbarOpen = true;
      })
      .addCase(activateDiscount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to activate discount";
        state.snackbarMessage = "Failed to activate discount";
        state.snackbarOpen = true;
      })





      // Export CSV
      .addCase(discountExport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(discountExport.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(discountExport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export Discount data";
      })



      // Import CSV
      .addCase(discountImport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(discountImport.fulfilled, (state, action) => {
        state.loading = false;
        const { message, duplicates, updated, failed } = action.payload;

        // Update snackbar message with detailed import results
        let snackbarMessage = message;
        if (duplicates.length > 0) {
          snackbarMessage += ` Duplicates skipped: ${duplicates.join(", ")}.`;
        }
        if (failed.length > 0) {
          snackbarMessage += ` ${failed.length} rows failed.`;
        }
        if (updated.length > 0) {
          snackbarMessage += ` ${updated.length} rows updated.`;
        }

        state.snackbarOpen = true;
        state.snackbarMessage = snackbarMessage;

        // Fetch updated categories to reflect changes
        // Note: fetchCategories is already dispatched in the thunk
      })
      .addCase(discountImport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to import Discount data";
        state.snackbarOpen = true;
        state.snackbarMessage = action.payload as string || "Failed to import Discount data";
      });




  },
});

export const {
  setDiscountData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetDiscountData,
} = discountSlice.actions;

export const selectDiscount = (state: RootState) => state.Discounts;

export default discountSlice.reducer;