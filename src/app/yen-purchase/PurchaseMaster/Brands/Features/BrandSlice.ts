'use client';
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import purchaseApi from '@/utils/api';
import { Brand, BrandState, ImportResult, initialState } from '../Models/BrandModel';

// Async thunks
export const fetchBrands = createAsyncThunk(
  'brand/fetchBrands',
  async (showDeactivated: boolean = false, { rejectWithValue }) => {
    try {
      const url = showDeactivated 
        ? '/brands?include_inactive=true'
        : '/brands/';
      const response = await purchaseApi.get(url);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const addBrand = createAsyncThunk(
  'brand/addBrand',
  async (brand: Partial<Brand>, { rejectWithValue }) => {
    try {
      const response = await purchaseApi.post('/brands/', brand);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const updateBrand = createAsyncThunk(
  'brand/updateBrand',
  async ({ id, data }: { id: string; data: Partial<Brand> }, { rejectWithValue }) => {
    try {
      const response = await purchaseApi.patch(`/brands/${id}`, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const deactivateBrand = createAsyncThunk(
  'brand/deactivateBrand',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await purchaseApi.patch(
        `/brands/${id}/status`,
        { status: 'deactivated' }
      );
      return { id, response: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const activateBrand = createAsyncThunk(
  'brand/activateBrand',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await purchaseApi.patch(
        `/brands/${id}/status`,
        { status: 'active' }
      );
      return { id, response: response.data };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const importCSV = createAsyncThunk(
  'brand/importCSV',
  async (file: File, { dispatch, rejectWithValue }) => { // Added dispatch
    if (!file || file.size === 0) {
      return rejectWithValue('Please select a CSV file to import');
    }
    if (!file.name.endsWith('.csv')) {
      return rejectWithValue('Invalid file format. Please upload a CSV file');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await purchaseApi.post('/brands/import-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      // Fetch brands after successful import
      await dispatch(fetchBrands(false));
      
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data);
    }
  }
);

export const exportCSV = createAsyncThunk(
  'brand/exportCSV',
  async (_, { rejectWithValue }) => {
    try {
      const username = localStorage.getItem('username');
      const response = await purchaseApi.get('/brands/export-csv', {
        responseType: 'blob',
        headers: {
          'x-username': username
        }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'brands_export.csv';
      if (contentDisposition) {
        const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (match && match[1]) {
          filename = match[1].replace(/['"]/g, '');
        }
      }
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true };
    } catch (error: any) {
      console.error('Export CSV error:', error);
      if (error.response?.data) {
        const blob = error.response.data;
        let errorMessage = 'Failed to export CSV';
        try {
          const text = await new Response(blob).text();
          try {
            const parsed = JSON.parse(text);
            errorMessage = parsed.detail || errorMessage;
          } catch {
            errorMessage = text || errorMessage;
          }
        } catch {
          errorMessage = 'Unable to parse error response';
        }
        return rejectWithValue(errorMessage);
      }
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

const brandSlice = createSlice({
  name: 'brand',
  initialState,
  reducers: {
    setBrandData: (state, action: PayloadAction<Brand>) => {
      state.brandData = action.payload;
    },
    setEditIndex: (state, action: PayloadAction<number | null>) => {
      state.editIndex = action.payload;
    },
    setDialogOpen: (state, action: PayloadAction<'none' | 'edit' | 'deactivated'>) => {
      state.dialogOpen = action.payload;
    },
    setShowDeactivated: (state, action: PayloadAction<boolean>) => {
      state.showDeactivated = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSnackbarMessage: (state, action: PayloadAction<string>) => {
      state.snackbarMessage = action.payload;
    },
    setSnackbarOpen: (state, action: PayloadAction<boolean>) => {
      state.snackbarOpen = action.payload;
    },
    resetImportState: (state) => {
      state.importing = false;
      state.importSuccess = false;
      state.importResult = null;
      state.importError = null;
      state.showImportResultDialog = false;
    },
    setShowImportResultDialog: (state, action: PayloadAction<boolean>) => {
      state.showImportResultDialog = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch brands
      .addCase(fetchBrands.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBrands.fulfilled, (state, action) => {
        state.loading = false;
        const allItems = action.payload || [];
        state.items = allItems.filter((item: Brand) => item.status === 'active');
        state.deactivatedItems = allItems.filter((item: Brand) => item.status === 'deactivated');
      })
      .addCase(fetchBrands.rejected, (state, action) => {
        state.loading = false;
        state.snackbarMessage = action.payload as string || 'Failed to fetch brands';
        state.snackbarOpen = true;
      })
      // Add brand
      .addCase(addBrand.pending, (state) => {
        state.loading = true;
      })
      .addCase(addBrand.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addBrand.rejected, (state, action) => {
        state.loading = false;
        state.snackbarMessage = action.payload as string || 'Failed to add brand';
        state.snackbarOpen = true;
      })
      // Update brand
      .addCase(updateBrand.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateBrand.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateBrand.rejected, (state, action) => {
        state.loading = false;
        state.snackbarMessage = action.payload as string || 'Failed to update brand';
        state.snackbarOpen = true;
      })
      // Import CSV
      .addCase(importCSV.pending, (state) => {
        state.importing = true;
        state.importError = null;
        state.importSuccess = false;
      })
      .addCase(importCSV.fulfilled, (state, action) => {
        state.importing = false;
        state.importSuccess = true;
        state.importResult = action.payload;
        state.showImportResultDialog = true;
      })
      .addCase(importCSV.rejected, (state, action) => {
        state.importing = false;
        state.importSuccess = false;
        state.importError = action.payload as string;
        state.importResult = action.payload as ImportResult;
        state.showImportResultDialog = true;
      })
      // Export CSV
      .addCase(exportCSV.pending, (state) => {
        state.exporting = true;
        state.exportError = null;
      })
      .addCase(exportCSV.fulfilled, (state) => {
        state.exporting = false;
        state.exportSuccess = true;
      })
      .addCase(exportCSV.rejected, (state, action) => {
        state.exporting = false;
        state.exportSuccess = false;
        state.exportError = action.payload as string;
        state.snackbarMessage = `Export failed: ${action.payload}`;
        state.snackbarOpen = true;
      })
      // Deactivate brand
      .addCase(deactivateBrand.fulfilled, (state) => {
        state.snackbarMessage = 'Brand deactivated successfully';
        state.snackbarOpen = true;
      })
      .addCase(deactivateBrand.rejected, (state, action) => {
        state.snackbarMessage = action.payload as string || 'Failed to deactivate brand';
        state.snackbarOpen = true;
      })
      // Activate brand
      .addCase(activateBrand.fulfilled, (state) => {
        state.snackbarMessage = 'Brand activated successfully';
        state.snackbarOpen = true;
      })
      .addCase(activateBrand.rejected, (state, action) => {
        state.snackbarMessage = action.payload as string || 'Failed to activate brand';
        state.snackbarOpen = true;
      });
  },
});

// Selectors
export const selectBrands = (state: { brand: BrandState }) => state.brand;

export const {
  setBrandData,
  setEditIndex,
  setDialogOpen,
  setShowDeactivated,
  setSearchQuery,
  setSnackbarMessage,
  setSnackbarOpen,
  resetImportState,
  setShowImportResultDialog,
} = brandSlice.actions;

export default brandSlice.reducer;