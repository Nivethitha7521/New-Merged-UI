import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";

import { ImportPayload, Location, initialState, OrderType } from "../Models/locationModels";
import { ImportResponse } from "../Models/locationModels";
import { RootState } from "@/redux/store";
import { API_BASE_URL } from "../../../../../API_URL";



// API URL
const API_URL = `${API_BASE_URL}/locations/`;
const GET_API_URL = `${API_BASE_URL}/locations/master`;



// FETCH THE ORDER TYPES
export const fetchOrderType = createAsyncThunk<OrderType[]>("orderType/fetchOrderType", async () => {
  const response = await axios.get( `${API_BASE_URL}/locations/orderTypes` );
  return response.data;
});



// // Fetch all Locations with optional search
export const fetchLocation = createAsyncThunk<
  {
    data: Location[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  },
  { search?: string; page?: number }
>(
  'locationAll/fetch',
  async ({ search, page = 1 }) => {
    const response = await axios.get(GET_API_URL, {
      params: {
        ...(search ? { branch_name: search } : {}),
        page,
        limit: 15,
      },
    });

    return response.data;
  }
);



export const createLocation = createAsyncThunk(
  "locations/create",
  async (newLocation: Omit<Location, "branchId">, { rejectWithValue }) => {
    try {
      const payload = {
        ...newLocation,
        country: newLocation.country || "",
        state: newLocation.state || "",
        city: newLocation.city || "",
        postalCode: Number(newLocation.postalCode) || 0,
        latitude: Number(newLocation.latitude) || 0,
        longitude: Number(newLocation.longitude) || 0,
      };

      const response = await axios.post(`${API_URL}location`, payload);
      return { ...response.data, branchId: response.data.branchId || response.data._id };
    } catch (error) {
      const err = error as AxiosError;
      const message =
        (err.response?.data as { message?: string })?.message ||
        err.message ||
        "Failed to create location";
      return rejectWithValue(message);
    }
  }
);

export const updateLocation = createAsyncThunk(
  "locations/update",
  async (
    { branchId, updates }: { branchId: string; updates: Partial<Location> },
    { rejectWithValue }
  ) => {
    try {
      const payload = {
        ...updates,
        country: updates.country || "",
        state: updates.state || "",
        city: updates.city || "",
        postalCode: Number(updates.postalCode) || 0,
        latitude: Number(updates.latitude) || 0,
        longitude: Number(updates.longitude) || 0,
      };

      const response = await axios.patch(`${API_URL}location/${branchId}`, payload);
      return { ...response.data, branchId: response.data.branchId || response.data._id };
    } catch (error) {
      const err = error as AxiosError;
      const message =
        (err.response?.data as { message?: string })?.message ||
        err.message ||
        "Failed to update location";
      return rejectWithValue(message);
    }
  }
);

export const activateLocation = createAsyncThunk(
  "locations/activate",
  async (branchId: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}location/${branchId}/activate`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      const message =
        (err.response?.data as { message?: string })?.message ||
        err.message ||
        "Failed to activate";
      return rejectWithValue(message);
    }
  }
);

export const deactivateLocation = createAsyncThunk(
  "locations/deactivate",
  async (branchId: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}location/${branchId}/deactivate`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      const message =
        (err.response?.data as { message?: string })?.message ||
        err.message ||
        "Failed to deactivate";
      return rejectWithValue(message);
    }
  }
);



export const Exportheader = createAsyncThunk<void, void>(
  "Exportlocationheader/fetch",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/locations/export-csv-headers/`, {
        responseType: "blob",
      });

      const fileName = `Location_Header_Export.csv`;
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
      dispatch(setSnackbarMessage("Location Header exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Location Header"));
      throw err;
    }
  }
);


// Export CSV
export const Exportlocation = createAsyncThunk<void, void>(
  "Exportlocation/fetch",
  async (_, { dispatch }) => {
    try {
      // get date & time
      const { data: dateTime } = await axios.get(
        "https://yenerp.com/liveapi/datetime"
      );

      const date = dateTime.current_date; // 23-01-2026
      const time = dateTime.current_time.replace(/[: ]/g, "-"); // 10-48-AM

      const fileName = `Location_Export_${date}_${time}.csv`;

      // export csv
      const response = await axios.get(`${API_URL}export-csv`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Location data exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Location data"));
      throw err;
    }
  }
);



// // Import CSV
export const Importlocation = createAsyncThunk<ImportResponse, ImportPayload>(
  "Importlocation/add",
  async ({ file, mode }, { dispatch, rejectWithValue }) => {
    // Validate file format (CSV or Excel)
    const validExtensions = ['.csv', '.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validExtensions.includes(fileExtension)) {
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Please upload a valid CSV or Excel file"));
      return rejectWithValue({
        message: "Invalid file format. Please upload a CSV or Excel file.",
        errors: [],
        data: null
      });
    }

    const form = new FormData();
    form.append("file", file);

    try {
      const response = await axios.post<ImportResponse>(
        `${API_URL}import-csv?mode=${mode}`,
        form,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Show success message based on mode
      let successMessage = '';
      const data = response.data;

      if (mode === 'replace') {
        successMessage = `✓ Replace completed: ${data.inserted_count} locations imported`;
      } else {
        successMessage = `✓ Import completed: ${data.inserted_count} new, ${data.updated_count} updated`;
      }

      // Show warnings if there are errors
      if (data.errorCount > 0) {
        successMessage += ` (${data.errorCount} errors)`;
        dispatch(setSnackbarMessage(successMessage));
        dispatch(setSnackbarOpen(true));
      } else if (data.duplicates.length > 0) {
        successMessage += ` (${data.duplicates.length} duplicates skipped)`;
        dispatch(setSnackbarMessage(successMessage));
        dispatch(setSnackbarOpen(true));
      } else {
        dispatch(setSnackbarMessage(successMessage));
        dispatch(setSnackbarOpen(true));
      }

      dispatch(fetchLocation({ search: '', page: 1 })); // Refresh locations after import
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{
        detail: {
          message: string;
          errors: string[];
          error_count: number;
        } | string;
      }>;

      let errorMessage = "Failed to import Location data";
      let detailedErrors: string[] = [];

      // Handle validation errors with detailed row/column information
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;

        if (typeof detail === 'object' && 'message' in detail) {
          errorMessage = detail.message;
          detailedErrors = detail.errors || [];
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      }

      // Only show snackbar for non-validation errors
      if (detailedErrors.length === 0) {
        dispatch(setSnackbarOpen(true));
        dispatch(setSnackbarMessage(errorMessage));
      }

      // Return properly structured error object
      return rejectWithValue({
        message: errorMessage,
        errors: detailedErrors,
        data: err.response?.data
      });
    }
  }
);




// Rollback function (for undoing replace operations)
export const rollbackLocations = createAsyncThunk<
  { message: string; mode: string; restored_count: number },
  void
>(
  "locations/rollback",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}rollback-locations`);

      dispatch(setSnackbarMessage(response.data.message));
      dispatch(setSnackbarOpen(true));
      dispatch(fetchLocation({ search: '', page: 1 })); // Refresh locations after rollback

      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{ detail: string }>;
      const errorMessage = err.response?.data?.detail || "Rollback failed";

      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage(errorMessage));

      return rejectWithValue(errorMessage);
    }
  }
);








const locationSlice = createSlice({
  name: "locations",
  initialState,
  reducers: {
    setSelectedCountry(state, action: PayloadAction<string>) {
      state.selectedCountry = action.payload;
    },
    setSelectedState(state, action: PayloadAction<string>) {
      state.selectedState = action.payload;
    },
    setSelectedCity(state, action: PayloadAction<string>) {
      state.selectedCity = action.payload;
    },
    setPostalCode(state, action: PayloadAction<string>) {
      state.postalCode = action.payload;
    },
    clearErrors(state) {
      state.error = null;
    },

    setSnackbarOpen: (state, action: PayloadAction<boolean>) => {
      state.snackbarOpen = action.payload;
    },
    setSnackbarMessage: (state, action: PayloadAction<string>) => {
      state.snackbarMessage = action.payload;
    },

  },
  extraReducers: (builder) => {
    builder


      .addCase(fetchOrderType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderType.fulfilled, (state, action) => {
        state.loading = false;
        state.orderType = action.payload;
        state.error = null;
      })
      .addCase(fetchOrderType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch OrderTypes';
      })

      .addCase(createLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.locations.push(action.payload);
      })
      .addCase(createLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.locations.findIndex(
          (loc) => loc.branchId === action.payload.branchId
        );
        if (index !== -1) {
          state.locations[index] = action.payload;
        }
      })
      .addCase(updateLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(activateLocation.fulfilled, (state, action) => {
        const loc = state.locations.find(
          (loc) => loc.branchId === action.meta.arg
        );
        if (loc) loc.status = "active";
      })
      .addCase(deactivateLocation.fulfilled, (state, action) => {
        const loc = state.locations.find(
          (loc) => loc.branchId === action.meta.arg
        );
        if (loc) loc.status = "inactive";
      })
      .addCase(fetchLocation.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })

      .addCase(fetchLocation.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.loading = false;

        const { data, total, page, limit, total_pages } = action.payload;

        state.total = total;
        state.page = page;
        state.limit = limit;

        // ✅ Use API value OR calculate it as fallback
        state.totalPages = total_pages || Math.ceil(total / limit);

        state.locations = data;
      })

      .addCase(fetchLocation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })


      // Export CSV
      .addCase(Exportlocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Exportlocation.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(Exportlocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export Location data";
      })


      // // Import CSV
      .addCase(Importlocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Importlocation.fulfilled, (state, action) => {
        state.loading = false;
        const { message, duplicates = [], updated = [], failed = [] } = action.payload;

        // Update snackbar message with detailed import results
        let snackbarMessage = message || "Import completed";
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
      })
      .addCase(Importlocation.rejected, (state, action) => {
        state.loading = false;

        // Handle the error payload properly
        const payload = action.payload as { message: string; errors: string[]; data: any } | undefined;

        if (payload && typeof payload === 'object') {
          // Store only the message string in state.error
          state.error = payload.message || "Failed to import Location data";

          // Only show snackbar if there are no detailed errors (they'll be shown in dialog)
          if (!payload.errors || payload.errors.length === 0) {
            state.snackbarOpen = true;
            state.snackbarMessage = payload.message || "Failed to import Location data";
          }
        } else {
          state.error = "Failed to import Location data";
          state.snackbarOpen = true;
          state.snackbarMessage = "Failed to import Location data";
        }
      });
  },
});

export const {
  setSelectedCountry,
  setSelectedState,
  setSelectedCity,
  setPostalCode,
  clearErrors,
  setSnackbarOpen,
  setSnackbarMessage,
} = locationSlice.actions;

export const selectLocations = (state: RootState) => state.locations;

export default locationSlice.reducer;