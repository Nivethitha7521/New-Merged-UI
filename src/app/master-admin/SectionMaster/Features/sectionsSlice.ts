

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../redux/store';
import { ImportPayload, ImportResponse, Sections, initialSections, initialState } from '../Models/sectionsModels';
import { API_BASE_URL } from "../../../../../API_URL";

const sections_API_URL = `${API_BASE_URL}/sections/`;
const GET_sections_API_URL = `${API_BASE_URL}/sections/master`;


// // Fetch all sections with optional search
export const fetchSections = createAsyncThunk<
  {
    data: Sections[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  },
  { search?: string; page?: number }
>(
  'sections/fetch',
  async ({ search, page = 1 }) => {
    const response = await axios.get(GET_sections_API_URL, {
      params: {
        ...(search ? { sections_name: search } : {}),
        page,
        limit: 30,
      },
    });

    return response.data;
  }
);


// Add a new section
export const addSection = createAsyncThunk<Sections, Sections>(
  'sections/add',
  async (section, { rejectWithValue }) => {
    try {
      const response = await axios.post(sections_API_URL, section);
    //  console.log('API Response (addSection):', response.data); // Debug response
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('Error adding section:', err.response?.data); // Debug error
      return rejectWithValue(err.response?.data || 'Error adding section');
    }
  }
);

// Update an existing section
export const updateSection = createAsyncThunk<Sections, Sections>(
  'sections/update',
  async (section, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${sections_API_URL}${section.id}`, section);
   //   console.log('API Response (updateSection):', response.data); // Debug response
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('Error updating section:', err.response?.data); // Debug error
      return rejectWithValue(err.response?.data || 'Error updating section');
    }
  }
);

// Deactivate section
export const deactivateSection = createAsyncThunk<Sections, string>(
  'sections/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${sections_API_URL}${id}`, { status: 'deactivated' });
   //   console.log('API Response (deactivateSection):', response.data); // Debug response
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('Error deactivating section:', err.response?.data); // Debug error
      return rejectWithValue(err.response?.data || 'Error deactivating section');
    }
  }
);

// Activate section
export const activateSection = createAsyncThunk<Sections, string>(
  'sections/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${sections_API_URL}${id}`, { status: 'active' });
    //  console.log('API Response (activateSection):', response.data); // Debug response
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      console.error('Error activating section:', err.response?.data); // Debug error
      return rejectWithValue(err.response?.data || 'Error activating section');
    }
  }
);





export const Exportheader = createAsyncThunk<void, void>(
  "ExportSectionheader/fetch",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/sections/export-csv-headers/`, {
        responseType: "blob",
      });

      const fileName = `Sections_Header_Export.csv`;
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
      dispatch(setSnackbarMessage("Sections Header exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Sections Header"));
      throw err;
    }
  }
);


// Export CSV
export const ExportSections = createAsyncThunk<void, void>(
  "Exportsection/fetch",
  async (_, { dispatch }) => {
    try {
      // get date & time
      const { data: dateTime } = await axios.get(
        "https://yenerp.com/liveapi/datetime"
      );

      const date = dateTime.current_date; // 23-01-2026
      const time = dateTime.current_time.replace(/[: ]/g, "-"); // 10-48-AM

      const fileName = `Section_Export_${date}_${time}.csv`;

      // export csv
      const response = await axios.get(`${sections_API_URL}export-csv`, {
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
      dispatch(setSnackbarMessage("Section data exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export Section data"));
      throw err;
    }
  }
);



// // Import CSV
export const ImportSections = createAsyncThunk<ImportResponse, ImportPayload>(
  "Importsections/add",
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
        `${sections_API_URL}import-csv?mode=${mode}`,
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
        successMessage = `✓ Replace completed: ${data.inserted_count} sections imported`;
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

      //dispatch(fetchSections()); // Refresh locations after import
      dispatch(fetchSections({ search: '', page: 1 }));
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError<{
        detail: {
          message: string;
          errors: string[];
          error_count: number;
        } | string;
      }>;

      let errorMessage = "Failed to import Sections data";
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
export const rollbackSections = createAsyncThunk<
  { message: string; mode: string; restored_count: number },
  void
>(
  "sections/rollback",
  async (_, { dispatch, rejectWithValue }) => {
    try {
      const response = await axios.post(`${sections_API_URL}rollback-sections`);

      dispatch(setSnackbarMessage(response.data.message));
      dispatch(setSnackbarOpen(true));
     // dispatch(fetchSections()); // Refresh locations after rollback
     dispatch(fetchSections({ search: '', page: 1 }));

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



const sectionsSlice = createSlice({
  name: 'sections',
  initialState,
  reducers: {
    setSectionsData: (state, action: PayloadAction<Sections>) => {
      state.sectionsData = action.payload;
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
    setSnackbarSeverity: (state, action: PayloadAction<'success' | 'error' | 'info'>) => {
      state.snackbarSeverity = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setShowDeactivated: (state, action: PayloadAction<boolean>) => {
      state.showDeactivated = action.payload;
    },
    resetSectionsData: (state) => {
      state.sectionsData = initialSections;
    },
    setSelectedSectionId: (state, action: PayloadAction<string | null>) => {
      state.selectedSectionId = action.payload;
    },
    setActionType: (state, action: PayloadAction<'deactivate' | 'activate' | null>) => {
      state.actionType = action.payload;
    },
    setConfirmationDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.confirmationDialogOpen = action.payload;
    },
    setEditConfirmationDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.editConfirmationDialogOpen = action.payload;
    },
    setCloseConfirmationDialogOpen: (state, action: PayloadAction<boolean>) => {
      state.closeConfirmationDialogOpen = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch sections
      .addCase(fetchSections.pending, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchSections.fulfilled, (state, action) => {
        state.loading = false;

        const { data, total, page, limit, total_pages } = action.payload;

        state.total = total;
        state.page = page;
        state.limit = limit;
        state.totalPages = total_pages;

        state.items = data.filter(item => item.status === 'active');
        state.deactivatedItems = data.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchSections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch sections';
        state.snackbarMessage = 'Failed to fetch sections';
        state.snackbarSeverity = 'error';
        state.snackbarOpen = true;
      })

      // Add section
      .addCase(addSection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSection.fulfilled, (state, action) => {
        state.loading = false;
       // console.log('Adding section to state:', action.payload); // Debug payload
        // Temporarily add to state for immediate UI feedback
        if (action.payload.status === 'active') {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
          state.showDeactivated = true; // Show deactivated items if new section is deactivated
        }
     //   console.log('Updated items after add:', state.items); // Debug state
     //   console.log('Updated deactivatedItems after add:', state.deactivatedItems); // Debug state
        state.snackbarMessage = 'Section added successfully';
        state.snackbarSeverity = 'success';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
        state.sectionsData = initialSections;
      })
      .addCase(addSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to add section';
        state.snackbarMessage = action.payload as string || 'Failed to add section';
        state.snackbarSeverity = 'error';
        state.snackbarOpen = true;
      })

      // Update section
      .addCase(updateSection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSection.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        } else {
          const deactivatedIndex = state.deactivatedItems.findIndex(p => p.id === action.payload.id);
          if (deactivatedIndex !== -1) {
            state.deactivatedItems[deactivatedIndex] = action.payload;
          }
        }
        state.snackbarMessage = 'Section updated successfully';
        state.snackbarSeverity = 'success';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
        state.sectionsData = initialSections;
      })
      .addCase(updateSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update section';
        state.snackbarMessage = action.payload as string || 'Failed to update section';
        state.snackbarSeverity = 'error';
        state.snackbarOpen = true;
      })

      // Deactivate section
      .addCase(deactivateSection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateSection.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
        state.snackbarMessage = 'Section deactivated successfully';
        state.snackbarSeverity = 'success';
        state.snackbarOpen = true;
        state.confirmationDialogOpen = false;
      })
      .addCase(deactivateSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to deactivate section';
        state.snackbarMessage = action.payload as string || 'Failed to deactivate section';
        state.snackbarSeverity = 'error';
        state.snackbarOpen = true;
      })

      // Activate section
      .addCase(activateSection.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateSection.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
        state.snackbarMessage = 'Section activated successfully';
        state.snackbarSeverity = 'success';
        state.snackbarOpen = true;
        state.confirmationDialogOpen = false;
      })
      .addCase(activateSection.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to activate section';
        state.snackbarMessage = action.payload as string || 'Failed to activate section';
        state.snackbarSeverity = 'error';
        state.snackbarOpen = true;
      })

      // Export CSV
      .addCase(ExportSections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(ExportSections.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(ExportSections.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export Sections data";
      })


      // // Import CSV
      .addCase(ImportSections.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(ImportSections.fulfilled, (state, action) => {
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
      .addCase(ImportSections.rejected, (state, action) => {
        state.loading = false;

        // Handle the error payload properly
        const payload = action.payload as { message: string; errors: string[]; data: any } | undefined;

        if (payload && typeof payload === 'object') {
          // Store only the message string in state.error
          state.error = payload.message || "Failed to import Sections data";

          // Only show snackbar if there are no detailed errors (they'll be shown in dialog)
          if (!payload.errors || payload.errors.length === 0) {
            state.snackbarOpen = true;
            state.snackbarMessage = payload.message || "Failed to import Sections data";
          }
        } else {
          state.error = "Failed to import Sections data";
          state.snackbarOpen = true;
          state.snackbarMessage = "Failed to import Sections data";
        }
      });
  },
});

export const {
  setSectionsData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSnackbarSeverity,
  setSearchQuery,
  setShowDeactivated,
  resetSectionsData,
  setSelectedSectionId,
  setActionType,
  setConfirmationDialogOpen,
  setEditConfirmationDialogOpen,
  setCloseConfirmationDialogOpen,
} = sectionsSlice.actions;

export const selectSections = (state: RootState) => state.sections;

export default sectionsSlice.reducer;