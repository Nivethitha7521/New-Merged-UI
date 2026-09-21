import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../../redux/store';

import { SubCategory, initialState, initialSubCategory, ImportResponse, ImportPayload } from '../Models/subcategoryModels';
import { API_BASE_URL } from '../../../../../../API_URL';


// API Base URL
const SUBCATEGORY_API_URL = `${API_BASE_URL}/itemsubcategories/`;
const GET_SUBCATEGORY_API_URL = `${API_BASE_URL}/itemsubcategories/master`;

// Fetch all subCategories
export const fetchSubCategories = createAsyncThunk<
  {
    data: SubCategory[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  },
  { search?: string; page?: number }
>(
  'subCategory/fetch',
  async ({ search, page = 1 }) => {
    const response = await axios.get(GET_SUBCATEGORY_API_URL, {
      params: {
        ...(search ? { subcategory_name: search } : {}),
        page,
        limit: 30,
      },
    });

    return response.data;
  }
);

// Add a new subCategory
export const addSubCategory = createAsyncThunk<SubCategory, SubCategory>(
  'subCategory/add',
  async (subCategory, { rejectWithValue }) => {
    try {
      const response = await axios.post(SUBCATEGORY_API_URL, subCategory);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

// Update an existing subCategory
export const updateSubCategory = createAsyncThunk<SubCategory, SubCategory>(
  'subCategory/update',
  async (subCategory, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${SUBCATEGORY_API_URL}${subCategory.id}`, subCategory);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

// Deactivate subCategory
export const deactivateSubCategory = createAsyncThunk<SubCategory, string>(
  'subCategory/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${SUBCATEGORY_API_URL}${id}`, { status: 'deactivated' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

// Activate subCategory
export const activateSubCategory = createAsyncThunk<SubCategory, string>(
  'subCategory/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${SUBCATEGORY_API_URL}${id}`, { status: 'active' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);




export const Exportheader = createAsyncThunk<void, void>(
  "ExportSubcategoryheader/fetch",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/itemsubcategories/export-csv-headers/`, {
        responseType: "blob",
      });

      const fileName = `Subcategory_Header_Export.csv`;
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
      dispatch(setSnackbarMessage("Subcategory Header exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Subcategory Header"));
      throw err;
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

      const fileName = `Subcategory_Export_${date}_${time}.csv`;

      const response = await axios.get(`${SUBCATEGORY_API_URL}export-csv`, {
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
      dispatch(setSnackbarMessage("SubCategory data exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export SubCategory data"));
      throw err;
    }
  }
);


// // Import CSV
export const ImportSubcategory = createAsyncThunk<ImportResponse, ImportPayload>(
  "ImportSubcategorys/add",
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
        `${SUBCATEGORY_API_URL}import-csv?mode=${mode}`,
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
        successMessage = `✓ Replace completed: ${data.inserted_count} Subcategory imported`;
      } else {
        successMessage = `✓ Import completed: ${data.inserted_count} new, ${data.updated_count} updated`;
      }

      // Show warnings if there are errors
      if (data.errorCount > 0) {
        successMessage += ` (${data.errorCount} errors)`;
        dispatch(setSnackbarMessage(successMessage));
        dispatch(setSnackbarOpen(true));
      } else if (data.duplicates.length > 0) {
       // successMessage += ` (${data.duplicates.length} duplicates skipped)`;
       // dispatch(setSnackbarMessage(successMessage));
       // dispatch(setSnackbarOpen(true));
      } else {
        dispatch(setSnackbarMessage(successMessage));
        dispatch(setSnackbarOpen(true));
      }

      dispatch(fetchSubCategories({ search: '', page: 1 })); // Refresh locations after import
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{
        detail: {
          message: string;
          errors: string[];
          error_count: number;
        } | string;
      }>;

      let errorMessage = "Failed to import Subcategory data";
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
export const rollbackSubcategory = createAsyncThunk<
  { message: string; mode: string; restored_count: number },
  void
>(
  "Subcategory/rollback",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`${SUBCATEGORY_API_URL}rollback-subcategories`);

      dispatch(setSnackbarMessage(response.data.message));
      dispatch(setSnackbarOpen(true));
      dispatch(fetchSubCategories({ search: "", page: 1 })); // Refresh locations after rollback

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



const subCategorySlice = createSlice({
  name: 'subCategory',
  initialState,
  reducers: {
    setSubCategoryData: (state, action: PayloadAction<SubCategory>) => {
      state.subCategoryData = action.payload;
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
    resetSubCategoryData: (state) => {
      state.subCategoryData = initialSubCategory;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch SubCategories
      .addCase(fetchSubCategories.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchSubCategories.fulfilled, (state, action) => {
        state.loading = false;

        const { data, total, page, limit, total_pages } = action.payload;

        state.total = total;
        state.page = page;
        state.limit = limit;
        state.totalPages = total_pages;

        state.items = data.filter(item => item.status === 'active');
        state.deactivatedItems = data.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchSubCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch subCategories';
      })

      // Add SubCategory
      .addCase(addSubCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSubCategory.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === 'active') {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
        state.snackbarMessage = 'SubCategory added successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(addSubCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to add subCategory';
        state.snackbarMessage = 'Failed to add subCategory';
        state.snackbarOpen = true;
      })

      // Update SubCategory
      .addCase(updateSubCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSubCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.snackbarMessage = 'SubCategory updated successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(updateSubCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update subCategory';
        state.snackbarMessage = 'Failed to update subCategory';
        state.snackbarOpen = true;
      })

      // Deactivate SubCategory
      .addCase(deactivateSubCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateSubCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
        state.snackbarMessage = 'SubCategory deactivated successfully';
        state.snackbarOpen = true;
      })
      .addCase(deactivateSubCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to deactivate subCategory';
        state.snackbarMessage = 'Failed to deactivate subCategory';
        state.snackbarOpen = true;
      })

      // Activate SubCategory
      .addCase(activateSubCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateSubCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
        state.snackbarMessage = 'SubCategory activated successfully';
        state.snackbarOpen = true;
      })
      .addCase(activateSubCategory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to activate subCategory';
        state.snackbarMessage = 'Failed to activate subCategory';
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
        state.error = action.error.message ?? "Failed to export SubCategory data";
      })

      // // Import CSV
      .addCase(ImportSubcategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(ImportSubcategory.fulfilled, (state, action) => {
        state.loading = false;
        const { message, duplicates = [], updated = [], failed = [] } = action.payload;

        // Update snackbar message with detailed import results
        let snackbarMessage = message || "Import completed";
        if (duplicates.length > 0) {
         // snackbarMessage += ` Duplicates skipped: ${duplicates.join(", ")}.`;
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
      .addCase(ImportSubcategory.rejected, (state, action) => {
        state.loading = false;

        // Handle the error payload properly
        const payload = action.payload as { message: string; errors: string[]; data: any } | undefined;

        if (payload && typeof payload === 'object') {
          // Store only the message string in state.error
          state.error = payload.message || "Failed to import SubCategory data";

          // Only show snackbar if there are no detailed errors (they'll be shown in dialog)
          if (!payload.errors || payload.errors.length === 0) {
            state.snackbarOpen = true;
            state.snackbarMessage = payload.message || "Failed to import SubCategory data";
          }
        } else {
          state.error = "Failed to import SubCategory data";
          state.snackbarOpen = true;
          state.snackbarMessage = "Failed to import SubCategory data";
        }
      });


  },
});

export const {
  setSubCategoryData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetSubCategoryData,
} = subCategorySlice.actions;

export const selectSubCategory = (state: RootState) => state.subCategory;

export default subCategorySlice.reducer;