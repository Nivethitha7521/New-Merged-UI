import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../../redux/store';

import { SFG, Uom, initialState, initialSFG, ImportResponse, ImportPayload } from '../Models/sfgModels';
import { API_BASE_URL } from '../../../../../../API_URL';


// API Base URL
const SFG_API_URL = `${API_BASE_URL}/sfg/`;
const GET_SFG_API_URL = `${API_BASE_URL}/sfg/master`;


// Fetch all SFG
export const fetchSfg = createAsyncThunk<
  {
    data: SFG[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  },
  { search?: string; page?: number }
>(
  'sfg/fetch',
  async ({ search, page = 1 }) => {
    const response = await axios.get(GET_SFG_API_URL, {
      params: {
        ...(search ? { sfg_name: search } : {}),
        page,
        limit: 30,
      },
    });

    return response.data;
  }
);

//Fetch All Uoms
export const fetchUoms = createAsyncThunk<Uom[]>("uomss/fetch", async () => {
  const response = await axios.get(`${API_BASE_URL}/itemmasters/uoms`);
  return response.data;
});


// Add a new SFG
export const addSfg = createAsyncThunk<SFG, SFG>(
  'sfg/add',
  async (sfg, { rejectWithValue }) => {
    try {
      const response = await axios.post(SFG_API_URL, sfg);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding sfg');
    }
  }
);

// Update an existing SFG
export const updateSfg = createAsyncThunk<SFG, SFG>(
  'sfg/update',
  async (sfg, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${SFG_API_URL}${sfg.id}`, sfg);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding sfg');
    }
  }
);

// Deactivate SFG
export const deactivateSfg = createAsyncThunk<SFG, string>(
  'sfg/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${SFG_API_URL}${id}`, { status: 'deactivated' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding sfg');
    }
  }
);

// Activate SFG
export const activateSfg = createAsyncThunk<SFG, string>(
  'sfg/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${SFG_API_URL}${id}`, { status: 'active' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding sfg');
    }
  }
);



// Export CSV
export const ExportCSV = createAsyncThunk<void, void>(
  "ExportCSV/fetch",
  async (_, { dispatch }) => {
    try {
      // get date & time
      const { data: dateTime } = await axios.get(
        "https://yenerp.com/liveapi/datetime"
      );

      const date = dateTime.current_date; // 23-01-2026
      const time = dateTime.current_time.replace(/[: ]/g, "-"); // 10-48-AM

      const fileName = `SFG_Export_${date}_${time}.csv`;

      // export csv
      const response = await axios.get(`${SFG_API_URL}export-csv`, {
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
      dispatch(setSnackbarMessage("SFG data exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export SFG data"));
      throw err;
    }
  }
);


export const ExportSfgheader = createAsyncThunk<void, void>(
  "ExportSfgheader/fetch",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get(`${SFG_API_URL}export-csv-headers`, {
        responseType: "blob",
      });

      const fileName = `SFG_Header_Export.csv`;
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
      dispatch(setSnackbarMessage("SFG Header exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export SFG Header"));
      throw err;
    }
  }
);




// // Import CSV
export const ImportSfg = createAsyncThunk<ImportResponse, ImportPayload>(
  "Importsfgs/add",
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
        `${SFG_API_URL}import-csv?mode=${mode}`,
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
        successMessage = `✓ Replace completed: ${data.inserted_count} SFG's imported`;
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

      dispatch(fetchSfg({ search: '', page: 1 })); // Refresh locations after import
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{
        detail: {
          message: string;
          errors: string[];
          error_count: number;
        } | string;
      }>;

      let errorMessage = "Failed to import SFG's data";
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
export const rollbackSfg = createAsyncThunk<
  { message: string; mode: string; restored_count: number },
  void
>(
  "Sfg/rollback",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`${SFG_API_URL}rollback-sfg`);

      dispatch(setSnackbarMessage(response.data.message));
      dispatch(setSnackbarOpen(true));
      dispatch(fetchSfg({ search: '', page: 1 })); // Refresh locations after rollback

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



const sfgSlice = createSlice({
  name: 'sfg',
  initialState,
  reducers: {
    setSfgData: (state, action: PayloadAction<SFG>) => {
      state.sfgData = action.payload;
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
    resetSfgData: (state) => {
      state.sfgData = initialSFG;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch SFG
      .addCase(fetchSfg.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchSfg.fulfilled, (state, action) => {
        state.loading = false;

        const { data, total, page, limit, total_pages } = action.payload;

        state.total = total;
        state.page = page;
        state.limit = limit;
        state.totalPages = total_pages;

        state.items = data.filter(item => item.status === 'active');
        state.deactivatedItems = data.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchSfg.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch SFG';
      })


      .addCase(fetchUoms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUoms.fulfilled, (state, action) => {
        state.loading = false;
        state.uoms = action.payload; // Store fetched item groups
        state.error = null;
      })
      .addCase(fetchUoms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch uoms';
      })


      // Add SFG
      .addCase(addSfg.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSfg.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === 'active') {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
        state.snackbarMessage = 'SFG added successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(addSfg.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to add SFG';
        state.snackbarMessage = 'Failed to add SFG';
        state.snackbarOpen = true;
      })

      // Update SFG
      .addCase(updateSfg.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSfg.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.snackbarMessage = 'SFG updated successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(updateSfg.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update SFG';
        state.snackbarMessage = 'Failed to update SFG';
        state.snackbarOpen = true;
      })

      // Deactivate SFG
      .addCase(deactivateSfg.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateSfg.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
        state.snackbarMessage = 'SFG deactivated successfully';
        state.snackbarOpen = true;
      })
      .addCase(deactivateSfg.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to deactivate SFG';
        state.snackbarMessage = 'Failed to deactivate SFG';
        state.snackbarOpen = true;
      })

      // Activate SFG
      .addCase(activateSfg.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateSfg.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
        state.snackbarMessage = 'SFG activated successfully';
        state.snackbarOpen = true;
      })
      .addCase(activateSfg.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to activate SFG';
        state.snackbarMessage = 'Failed to activate SFG';
        state.snackbarOpen = true;
      })



      // Export CSV
      .addCase(ExportCSV.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(ExportCSV.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(ExportCSV.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export SFG data";
      })
      // // Import CSV
      .addCase(ImportSfg.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(ImportSfg.fulfilled, (state, action) => {
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
      .addCase(ImportSfg.rejected, (state, action) => {
        state.loading = false;

        // Handle the error payload properly
        const payload = action.payload as { message: string; errors: string[]; data: any } | undefined;

        if (payload && typeof payload === 'object') {
          // Store only the message string in state.error
          state.error = payload.message || "Failed to import SFG's data";

          // Only show snackbar if there are no detailed errors (they'll be shown in dialog)
          if (!payload.errors || payload.errors.length === 0) {
            state.snackbarOpen = true;
            state.snackbarMessage = payload.message || "Failed to import SFG's data";
          }
        } else {
          state.error = "Failed to import SFG's data";
          state.snackbarOpen = true;
          state.snackbarMessage = "Failed to import SFG's data";
        }
      });


  },
});

export const {
  setSfgData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetSfgData,
} = sfgSlice.actions;

export const selectSfg = (state: RootState) => state.sfg;

export default sfgSlice.reducer;