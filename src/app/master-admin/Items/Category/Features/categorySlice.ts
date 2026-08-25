
import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios, { AxiosError } from "axios";
import { RootState } from "../../../../../redux/store";
import { Category, CategoryPost, FetchSubcatArgs, FetchSubcatResponse, initialState, initialCategory, ImportResponse, ImportPayload } from "../Models/categoryModels";
import { API_BASE_URL } from "../../../../../../API_URL";


const GET_API_URL = `${API_BASE_URL}/itemcategories/master`;
const API_URL = `${API_BASE_URL}/itemcategories/`;
const SUBCATEGORIES_API_URL = `${API_BASE_URL}/itemcategories/subcat-dropdown`;



// FETCH CATEGORY
export const fetchCategories = createAsyncThunk<
  {
    data: Category[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  },
  { search?: string; page?: number }
>(
  'category/fetch',
  async ({ search, page = 1 }) => {
    const response = await axios.get(GET_API_URL, {
      params: {
        ...(search ? { category_name: search } : {}),
        page,
        limit: 15,
      },
    });

    return response.data;
  }
);


// FETCH SUBCATEGORY
export const fetchSubcategories = createAsyncThunk<
  FetchSubcatResponse,
  FetchSubcatArgs
>(
  "subcat/fetch",
  async ({ page = 1, limit = 30, search = "" }) => {
    const url = `${SUBCATEGORIES_API_URL}?page=${page}&limit=${limit}&search=${search}`;
    const response = await axios.get(url);

    return {
      results: response.data.results ?? [],
      totalPages: response.data.pages ?? 0,
      currentPage: response.data.page ?? 1,
    };
  }
);



// ADD CATEGORY
export const addCategory = createAsyncThunk<Category, CategoryPost>(
  "category/add",
  async (category, { rejectWithValue }) => {
    try {
      const response = await axios.post(API_URL, category);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || "Failed to add category");
    }
  }
);


// Update an existing category
export const updateCategory = createAsyncThunk<Category, Category>(
  "category/update",
  async (category) => {
    const response = await axios.patch(`${API_URL}${category.id}`, category);
    return response.data;
  }
);

// Deactivate category
export const deactivateCategory = createAsyncThunk<Category, string>(
  "category/deactivate",
  async (id, { rejectWithValue }) => {
    try {
      const categoryResponse = await axios.get(`${API_URL}${id}`);
      const categoryData = categoryResponse.data;
      const updatedCategory = { ...categoryData, status: "deactivated" };
      const response = await axios.patch(`${API_URL}${id}`, updatedCategory);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error deactivating category');
    }
  }
);

// Activate category
export const activateCategory = createAsyncThunk<Category, string>(
  "category/activate",
  async (id, { rejectWithValue }) => {
    try {
      const categoryResponse = await axios.get(`${API_URL}${id}`);
      const categoryData = categoryResponse.data;
      const updatedCategory = { ...categoryData, status: "active" };
      const response = await axios.patch(`${API_URL}${id}`, updatedCategory);
      return response.data;
    } catch (error) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error activating category');
    }
  }
);



export const Exportheader = createAsyncThunk<void, void>(
  "Exportcategoryheader/fetch",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/itemcategories/export-csv-headers/`, {
        responseType: "blob",
      });

      const fileName = `Category_Header_Export.csv`;
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
      dispatch(setSnackbarMessage("Category Header exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Category Header"));
      throw err;
    }
  }
);


// EXPORT CATEGORY
export const ExportData = createAsyncThunk<void, void>(
  "ExportData/fetch",
  async (_, { dispatch }) => {
    try {
      // get date & time
      const { data: dateTime } = await axios.get(
        "https://yenerp.com/liveapi/datetime"
      );

      const date = dateTime.current_date; // 23-01-2026
      const time = dateTime.current_time.replace(/[: ]/g, "-"); // 10-48-AM

      const fileName = `Category_Export_${date}_${time}.csv`;

      const response = await axios.get(`${API_URL}export-csv`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);

      dispatch(setSnackbarMessage("Category data exported successfully"));
      dispatch(setSnackbarOpen(true));
    } catch (error) {
      dispatch(setSnackbarMessage("Failed to export Category data"));
      dispatch(setSnackbarOpen(true));
      throw error;
    }
  }
);


// // Import CSV
export const Importcategory = createAsyncThunk<ImportResponse, ImportPayload>(
  "Importcategorys/add",
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
        successMessage = `✓ Replace completed: ${data.inserted_count} Category imported`;
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

      dispatch(fetchCategories({ search: "", page: 1 })); // Refresh locations after import
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{
        detail: {
          message: string;
          errors: string[];
          error_count: number;
        } | string;
      }>;

      let errorMessage = "Failed to import Category data";
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
export const rollbackcategory = createAsyncThunk<
  { message: string; mode: string; restored_count: number },
  void
>(
  "category/rollback",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}rollback-categories`);

      dispatch(setSnackbarMessage(response.data.message));
      dispatch(setSnackbarOpen(true));
      dispatch(fetchCategories({ search: "", page: 1 })); // Refresh locations after rollback

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




const categorySlice = createSlice({
  name: "category",
  initialState,
  reducers: {
    setCategoryData: (state, action: PayloadAction<Category>) => {
      state.categoryData = action.payload;
    },
    setDialogOpen: (state, action: PayloadAction<"none" | "edit" | "add">) => {
      state.dialogOpen = action.payload;
    },
    setSnackbarOpen: (state, action: PayloadAction<boolean>) => {
      state.snackbarOpen = action.payload;
    },
    setSnackbarMessage: (state, action: PayloadAction<string>) => {
      state.snackbarMessage = action.payload;
    },
    setShowDeactivated: (state, action: PayloadAction<boolean>) => {
      state.showDeactivated = action.payload;
    },
    resetCategoryData: (state) => {
      state.categoryData = initialCategory;
      // Reset subcategory pagination when dialog resets
      state.allSubcategories = [];
      state.currentPage = 1;
      state.totalPages = 0;
      state.hasMoreItems = true;
    },
    incrementPage: (state) => {
      state.currentPage += 1;
    },
    resetPagination: (state) => {
      state.allSubcategories = [];
      state.currentPage = 1;
      state.totalPages = 0;
      state.hasMoreItems = true;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Categories
      .addCase(fetchCategories.pending, (state) => {
        state.loading = false;
      })
      .addCase(fetchCategories.fulfilled, (state, action) => {
        state.loading = false;

        const { data, total, page, limit, total_pages } = action.payload;

        state.total = total;
        state.page = page;
        state.limit = limit;
        state.totalPages = total_pages;

        state.items = data.filter(item => item.status === 'active');
        state.deactivatedItems = data.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to fetch categories";
      })

      // Fetch Subcategories (Infinite Scroll + Search)
      .addCase(fetchSubcategories.pending, (state) => {
        state.isFetchingItems = false;
        state.error = null;
      })
      .addCase(fetchSubcategories.fulfilled, (state, action) => {
        state.isFetchingItems = false;
        state.allSubcategories =
          action.payload.currentPage === 1
            ? action.payload.results
            : [...state.allSubcategories, ...action.payload.results];
        state.currentPage = action.payload.currentPage;
        state.totalPages = action.payload.totalPages;
        state.hasMoreItems = state.currentPage < state.totalPages;
      })
      .addCase(fetchSubcategories.rejected, (state, action) => {
        state.isFetchingItems = false;
        state.error = action.error.message ?? "Failed to fetch all items";
        state.hasMoreItems = false;
      })

      // Add / Update / Activate / Deactivate
      .addCase(addCategory.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === "active") {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
      })


      .addCase(updateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.snackbarMessage = "Category updated successfully";
        state.snackbarOpen = true;
      })

      .addCase(deactivateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
      })
      .addCase(activateCategory.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
      })


      // Export CSV
      .addCase(ExportData.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(ExportData.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(ExportData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export Category data";
      })


      // // Import CSV
      .addCase(Importcategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Importcategory.fulfilled, (state, action) => {
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
      .addCase(Importcategory.rejected, (state, action) => {
        state.loading = false;

        // Handle the error payload properly
        const payload = action.payload as { message: string; errors: string[]; data: any } | undefined;

        if (payload && typeof payload === 'object') {
          // Store only the message string in state.error
          state.error = payload.message || "Failed to import Category data";

          // Only show snackbar if there are no detailed errors (they'll be shown in dialog)
          if (!payload.errors || payload.errors.length === 0) {
            state.snackbarOpen = true;
            state.snackbarMessage = payload.message || "Failed to import Category data";
          }
        } else {
          state.error = "Failed to import Category data";
          state.snackbarOpen = true;
          state.snackbarMessage = "Failed to import Category data";
        }
      });

  },
});

export const {
  setCategoryData,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  resetCategoryData,
  incrementPage,
  resetPagination,
  setShowDeactivated
} = categorySlice.actions;

export const selectCategory = (state: RootState) => state.Category;

export default categorySlice.reducer;