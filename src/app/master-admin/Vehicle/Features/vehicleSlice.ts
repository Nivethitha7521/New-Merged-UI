import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../../../redux/store";
import { API_BASE_URL } from "../../../../../API_URL";

import { Branch, ImportPayload, ImportResponse, Vehicle, initialState } from "../Models/vehicleModel";


// API URL
const VEHICLE_API_URL = `${API_BASE_URL}/vehicles/`;
const GET_VEHICLE_API_URL = `${API_BASE_URL}/vehicles/master`;



// FETCH TEH BRANCHES
export const fetchBranches = createAsyncThunk<Branch[]>("branchs/fetchBranches", async () => {
  const response = await axios.get(`${API_BASE_URL}/locations/table-location`);
  return response.data;
});


//Fetch Vehicles

export const fetchVehicle = createAsyncThunk<
  {
    data: Vehicle[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  },
  { search?: string; page?: number }
>(
  'Vehicle/fetch',
  async ({ search, page = 1 }) => {
    const response = await axios.get(GET_VEHICLE_API_URL, {
      params: {
        ...(search ? { search: search } : {}),
        page,
        limit: 15,
      },
    });

    return response.data;
  }
)

//Add New Vehicle
export const addVehicle = createAsyncThunk<Vehicle, Vehicle>("Vehicle/add", async (vehicle) => {
  const response = await axios.post(VEHICLE_API_URL, vehicle);
  return response.data;
});

//Update the Vehicle
export const updateVehicle = createAsyncThunk<Vehicle, Vehicle>("Vehicle/update", async (vehicle) => {
  const response = await axios.patch(`${VEHICLE_API_URL}${vehicle.id}`, vehicle);
  return response.data;
});

//Deactivate The Vehicle
export const deactivateVehicle = createAsyncThunk<Vehicle, string>("Vehicle/deactivate", async (id) => {
  const response = await axios.patch(`${VEHICLE_API_URL}${id}`, { status: "deactivated" });
  return response.data;
});

//Activate The Vehicle
export const activateVehicle = createAsyncThunk<Vehicle, string>("Vehicle/activate", async (id) => {
  const response = await axios.patch(`${VEHICLE_API_URL}${id}`, { status: "active" });
  return response.data;
});




export const Exportheader = createAsyncThunk<void, void>(
  "ExportVehicleheader/fetch",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/vehicles/export-csv-headers/`, {
        responseType: "blob",
      });

      const fileName = `Vehicles_Header_Export.csv`;
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
      dispatch(setSnackbarMessage("Vehicles Header exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Vehicles Header"));
      throw err;
    }
  }
);


// Export CSV
export const ExportVehicles = createAsyncThunk<void, void>(
  "ExportVehicles/fetch",
  async (_, { dispatch }) => {
    try {
      // get date & time
      const { data: dateTime } = await axios.get(
        "https://yenerp.com/liveapi/datetime"
      );

      const date = dateTime.current_date; // 23-01-2026
      const time = dateTime.current_time.replace(/[: ]/g, "-"); // 10-48-AM

      const fileName = `Vehicles_Export_${date}_${time}.csv`;

      // export csv
      const response = await axios.get(`${VEHICLE_API_URL}export-csv`, {
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
      dispatch(setSnackbarMessage("Vehicles data exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Vehicles data"));
      throw err;
    }
  }
);



// // Import CSV
export const ImportVehicles = createAsyncThunk<ImportResponse, ImportPayload>(
  "ImportVehicles/add",
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
        `${VEHICLE_API_URL}import-csv?mode=${mode}`,
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
        successMessage = `✓ Replace completed: ${data.inserted_count} Vehicles imported`;
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

      dispatch(fetchVehicle({ search: "", page: 1 })); // Refresh locations after import
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{
        detail: {
          message: string;
          errors: string[];
          error_count: number;
        } | string;
      }>;

      let errorMessage = "Failed to import Vehicles data";
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


// Updated extraReducers for Importlocation



// Rollback function (for undoing replace operations)
export const rollbackVehilce = createAsyncThunk<
  { message: string; mode: string; restored_count: number },
  void
>(
  "vehicle/rollback",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`${VEHICLE_API_URL}rollback-vehicles`);

      dispatch(setSnackbarMessage(response.data.message));
      dispatch(setSnackbarOpen(true));
      dispatch(fetchVehicle({ search: "", page: 1 })); // Refresh locations after rollback

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




const VehicleSlice = createSlice({
  name: "Vehicle",
  initialState,
  reducers: {

    setVehicleData: (state, action: PayloadAction<Vehicle>) => {
      state.vehicleData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setEditVehicleId: (state, action: PayloadAction<string | null>) => {
      state.editVehicleId = action.payload;
    },
    setDialogOpen: (state, action: PayloadAction<"none" | "add" | "edit" | "deactivated">) => {
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
    setShowDeactivated: (State, action: PayloadAction<boolean>) => {
      State.showDeactivated = action.payload;
    },
  },

  extraReducers: (builder) => {
    builder


      .addCase(fetchBranches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading = false;
        state.branchOptions = action.payload;
        state.error = null;
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch branches';
      })

      //Fetch Vehicle
      .addCase(fetchVehicle.pending, (state) => {
        state.loading = false;
      })
      .addCase(fetchVehicle.fulfilled, (state, action) => {
        state.loading = false;

        const { data, total, page, limit, total_pages } = action.payload;

        state.total = total;
        state.page = page;
        state.limit = limit;
        state.totalPages = total_pages;

        state.items = data.filter(item => item.status === 'active');
        state.deactivatedItems = data.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchVehicle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed To Fetch Vehicles";
      })

      //Add Vehicle
      .addCase(addVehicle.fulfilled, (state, action) => {
        if (action.payload.status === "active") {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
      })

      //Update Vehicle
      .addCase(updateVehicle.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      //Deactivate vehicle
      .addCase(deactivateVehicle.fulfilled, (state, action) => {
        const index = state.items.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivatedVehicle] = state.items.splice(index, 1);
          state.deactivatedItems.push({ ...deactivatedVehicle, status: 'deactivated' });
        }
      })

      //Activate Vehicle
      .addCase(activateVehicle.fulfilled, (state, action) => {
        const index = state.deactivatedItems.findIndex((p) => p.id === action.payload.id);
        if (index !== -1) {
          const [activatedVehicle] = state.deactivatedItems.splice(index, 1);
          state.items.push({ ...activatedVehicle, status: 'active' });
        }
      });
  },
});


export const {
  setVehicleData,
  setEditIndex,
  setEditVehicleId,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
} = VehicleSlice.actions;

export const selectEvents = (state: RootState) => state.vehicles;

export default VehicleSlice.reducer;