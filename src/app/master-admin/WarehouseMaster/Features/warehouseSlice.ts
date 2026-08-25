import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";

import { WareHouse, LocationData, PostalApiResponse, initialState } from "../Models/warehouseModels";
import { ImportResponse, ImportPayload } from "../../Locations/Models/locationModels";
import { API_BASE_URL } from "../../../../../API_URL";



const API_URL = `${API_BASE_URL}/warehouses`;
const API_url = `${API_BASE_URL}/warehouses`;

const LOCATIONS_API_URL = `${API_BASE_URL}/warehouses/location-dropdown/`;




// -------------------- Thunks --------------------

export const fetchLocationsForDropdown = createAsyncThunk<LocationData[]>("locationDropdown/fetch", async () => {
  const response = await axios.get(LOCATIONS_API_URL);
  return response.data;
});



// Fetch location by ID
export const fetchLocationById = createAsyncThunk(
  "warehouses/fetchById",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/warehouse/${id}`);
      return {
        ...response.data,
        status: response.data.status === 1 ? "active" : "inactive"
      };
    } catch (error) {
      const err = error as AxiosError;
      const message = err.response?.data && typeof err.response.data === "string"
        ? err.response.data
        : err.message || "Something went wrong";
      return rejectWithValue(message);
    }
  }
);

// Fetch all locations
export const fetchLocation = createAsyncThunk(
  "warehouses/fetch",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;

      // Try to extract a string error message safely
      const message =
        err.response?.data && typeof err.response.data === "string"
          ? err.response.data
          : err.message || "Something went wrong";

      return rejectWithValue(message);
    }
  }
);

// Create new location
export const createLocation = createAsyncThunk(
  "warehouses/create",
  async (newLocation: Omit<WareHouse, "id">, { rejectWithValue }) => {
    try {
      // Ensure payload matches backend expectations
      const payload = {
        ...newLocation,
        country: newLocation.country || "",
        state: newLocation.state || "",
        city: newLocation.city || "",
        postalCode: Number(newLocation.postalCode) || 0,
        latitude: Number(newLocation.latitude) || 0,
        longitude: Number(newLocation.longitude) || 0,
        status: newLocation.status === "active" ? 1 : 0,
      };
    //  console.log("Create Location Payload:", payload); // Debugging
      const response = await axios.post(`${API_URL}/warehouse`, payload);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;

      // Try to extract a string error message safely
      const message =
        err.response?.data && typeof err.response.data === "string"
          ? err.response.data
          : err.message || "Something went wrong";

      return rejectWithValue(message);
    }
  }
);

// Update location
export const updateLocation = createAsyncThunk(
  "warehouses/update",
  async (
    { id, updates }: { id: string; updates: Partial<WareHouse> },
    { rejectWithValue }
  ) => {
    try {
      // Prepare payload carefully
      const payload: any = {
        ...updates,
        country: updates.country || "",
        state: updates.state || "",
        city: updates.city || "",
        postalCode: Number(updates.postalCode) || 0,
        latitude: Number(updates.latitude) || 0,
        longitude: Number(updates.longitude) || 0,
      };
      if (updates.status !== undefined) {
        payload.status = updates.status === "active" ? 1 : 0;
      }
    //  console.log("Update Location Payload:", payload); // Debugging

      // FIX: Add "/" between warehouse and id
      const response = await axios.patch(`${API_URL}/warehouse/${id}`, payload);

      return response.data;
    } catch (error) {
      const err = error as AxiosError;

      // Try to extract a string error message safely
      const message =
        err.response?.data && typeof err.response.data === "string"
          ? err.response.data
          : err.message || "Something went wrong";

      return rejectWithValue(message);
    }
  }
);
// Activate location
export const activateLocation = createAsyncThunk(
  "warehouses/activate",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/warehouse/${id}/activate`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;

      // Try to extract a string error message safely
      const message =
        err.response?.data && typeof err.response.data === "string"
          ? err.response.data
          : err.message || "Something went wrong";

      return rejectWithValue(message);
    }
  }
);
// Deactivate location
export const deactivateLocation = createAsyncThunk(
  "warehouses/deactivate",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${API_URL}/warehouse/${id}/deactivate`);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;

      // Try to extract a string error message safely
      const message =
        err.response?.data && typeof err.response.data === "string"
          ? err.response.data
          : err.message || "Something went wrong";

      return rejectWithValue(message);
    }
  }
);


// Thunk to fetch country data by postal code
export const fetchAllCountry = createAsyncThunk<
  PostalApiResponse[], // Return type
  number,              // Argument (postalCode)
  { rejectValue: string } // Rejection type
>(
  'warehouses/fetchAllCountry',
  async (postalCode, { rejectWithValue }) => {
    try {
      const response = await axios.get<PostalApiResponse[]>(
        `https://api.postalpincode.in/pincode/${postalCode}`
      );
   //   console.log("Postal API Response:", response.data);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      const message =
        err.response?.data && typeof err.response.data === 'string'
          ? err.response.data
          : err.message || 'Something went wrong';
      return rejectWithValue(message);
    }
  }
);


export const Exportheader = createAsyncThunk<void, void>(
  "Exportwarehouseheader/fetch",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/warehouses/export-csv-headers/`, {
        responseType: "blob",
      });

      const fileName = `WareHouse_Header_Export.csv`;
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
      dispatch(setSnackbarMessage("WareHouse Header exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export WareHouse Header"));
      throw err;
    }
  }
);



// Export CSV
export const Exportwarehouse = createAsyncThunk<void, void>(
  "Exportwarehouse/fetch",
  async (_, { dispatch }) => {
    try {
      // get date & time
      const { data: dateTime } = await axios.get(
        "https://yenerp.com/liveapi/datetime"
      );

      // format for filename
      const date = dateTime.current_date; // 23-01-2026
      const time = dateTime.current_time.replace(/[: ]/g, "-"); // 10-48-AM

      const fileName = `WareHouse_Export_${date}_${time}.csv`;

      // export csv
      const response = await axios.get(`${API_url}/export-csv`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], {
        type: "text/csv;charset=utf-8;",
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      window.URL.revokeObjectURL(url);

      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("WareHouse data exported successfully"));
    } catch (error) {
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export WareHouse data"));
      throw error;
    }
  }
);


// // Import CSV
export const Importwarehouse = createAsyncThunk<ImportResponse, ImportPayload>(
  "Importwarehouse/add",
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
        `${API_URL}/import-csv?mode=${mode}`,
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

      dispatch(fetchLocation()); // Refresh locations after import
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{
        detail: {
          message: string;
          errors: string[];
          error_count: number;
        } | string;
      }>;

      let errorMessage = "Failed to import WarfeHouse data";
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
export const rollbackWarehouses = createAsyncThunk<
  { message: string; mode: string; restored_count: number },
  void
>(
  "locations/rollback",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/rollback-warehouses`);

      dispatch(setSnackbarMessage(response.data.message));
      dispatch(setSnackbarOpen(true));
      dispatch(fetchLocation()); // Refresh locations after rollback

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


// -------------------- Slice --------------------

const wareHouse = createSlice({
  name: "warehouses",
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


      //  Fetch locations for dropdown
      .addCase(fetchLocationsForDropdown.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLocationsForDropdown.fulfilled, (state, action) => {
        state.loading = false;
        state.locationdropdown = action.payload;
      })
      .addCase(fetchLocationsForDropdown.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(createLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.wareHouse.push({ ...action.payload, status: action.payload.status === 1 ? "active" : "inactive" });
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
        const index = state.wareHouse.findIndex((loc) => loc.id === action.payload.id);
        if (index !== -1) {
          state.wareHouse[index] = { ...action.payload, status: action.payload.status === 1 ? "active" : "inactive" };
        }
      })
      .addCase(updateLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })

      .addCase(activateLocation.fulfilled, (state, action) => {
        const loc = state.wareHouse.find((loc) => loc.id === action.meta.arg);
        if (loc) loc.status = "active";
      })
      .addCase(deactivateLocation.fulfilled, (state, action) => {
        const loc = state.wareHouse.find((loc) => loc.id === action.meta.arg);
        if (loc) loc.status = "inactive";
      })

      .addCase(fetchLocation.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchLocation.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.wareHouse = action.payload.map((wh: any) => ({
          ...wh,
          status: wh.status === 1 ? "active" : "inactive"
        }));
      })
      .addCase(fetchLocation.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload as string;
      })
      .addCase(fetchAllCountry.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllCountry.fulfilled, (state, action) => {
        state.loading = false;
        state.countryData = action.payload;
      })
      .addCase(fetchAllCountry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })


      // Export CSV
      .addCase(Exportwarehouse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Exportwarehouse.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(Exportwarehouse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export WareHouse data";
      })
      // // Import CSV
      .addCase(Importwarehouse.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Importwarehouse.fulfilled, (state, action) => {
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
      .addCase(Importwarehouse.rejected, (state, action) => {
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

// Exports
export const {
  setSelectedCountry,
  setSelectedState,
  setSelectedCity,
  setPostalCode,
  clearErrors,
  setSnackbarOpen,
  setSnackbarMessage,
} = wareHouse.actions;

export default wareHouse.reducer;
