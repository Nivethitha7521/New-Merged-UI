import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../../redux/store';


import { ItemGroup, initialState, initialitemGroup, ImportResponse } from '../Models/itemGroupModels';
import { API_BASE_URL } from '../../../../../../API_URL';


const itemGroup_API_URL = `${API_BASE_URL}/itemGroupsadmin/`; 

// Fetch all itemGroups
export const fetchitemGroups = createAsyncThunk<ItemGroup[]>(
  'itemGroup/fetch',
  async () => {
    const response = await axios.get(itemGroup_API_URL);
    return response.data;
  }
);

// Add a new itemGroup
export const additemGroup = createAsyncThunk<ItemGroup, ItemGroup>(
  'itemGroup/add',
  async (itemGroup, { rejectWithValue }) => {
    try {
      const response = await axios.post(itemGroup_API_URL, itemGroup);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

// Update an existing itemGroup
export const updateitemGroup = createAsyncThunk<ItemGroup, ItemGroup>(
  'itemGroup/update',
  async (itemGroup, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${itemGroup_API_URL}${itemGroup.id}`, itemGroup);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

// Deactivate itemGroup
export const deactivateitemGroup = createAsyncThunk<ItemGroup, string>(
  'itemGroup/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${itemGroup_API_URL}${id}`, { status: 'deactivated' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);

// Activate itemGroup
export const activateitemGroup = createAsyncThunk<ItemGroup, string>(
  'itemGroup/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${itemGroup_API_URL}${id}`, { status: 'active' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding addOn');
    }
  }
);





// Export CSV
export const Exportitemgroup = createAsyncThunk<void, void>(
  "Exportitemgroup/fetch",
  async (_, { dispatch }) => {
    try {
      const response = await axios.get(`${itemGroup_API_URL}export-csv`, {
        responseType: "blob",
      });

      const fileName = `Itemgroup_export.csv`;
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
      dispatch(setSnackbarMessage("ItemGroup data exported successfully"));
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to export ItemGroup data"));
      throw err;
    }
  }
);

// Import CSV
export const Importitemgroup = createAsyncThunk<ImportResponse, File>(
  "Importitemgroup/add",
  async (file, { dispatch, rejectWithValue }) => {
    if (!file.name.endsWith('.csv')) {
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Please upload a valid CSV file"));
      return rejectWithValue("Invalid file format. Please upload a CSV file.");
    }

    const form = new FormData();
    form.append("file", file);
    try {
      const response = await axios.post(`${itemGroup_API_URL}import-csv`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      dispatch(fetchitemGroups()); // Refresh categories after import
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      dispatch(setSnackbarOpen(true));
      dispatch(setSnackbarMessage("Failed to import ItemGroup data"));
      return rejectWithValue(err.response?.data || "Failed to import ItemGroup data");
    }
  }
);


const itemGroupSlice = createSlice({
  name: 'itemGroup',
  initialState,
  reducers: {
    setitemGroupData: (state, action: PayloadAction<ItemGroup>) => {
      state.itemGroupData = action.payload;
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
    resetitemGroupData: (state) => {
      state.itemGroupData = initialitemGroup;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch itemGroups
      .addCase(fetchitemGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchitemGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter(item => item.status === 'active');
        state.deactivatedItems = action.payload.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchitemGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch itemGroups';
      })

      // Add itemGroup
      .addCase(additemGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(additemGroup.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === 'active') {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
        state.snackbarMessage = 'itemGroup added successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(additemGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to add itemGroup';
        state.snackbarMessage = 'Failed to add itemGroup';
        state.snackbarOpen = true;
      })

      // Update itemGroup
      .addCase(updateitemGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateitemGroup.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.snackbarMessage = 'itemGroup updated successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(updateitemGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update itemGroup';
        state.snackbarMessage = 'Failed to update itemGroup';
        state.snackbarOpen = true;
      })

      // Deactivate itemGroup
      .addCase(deactivateitemGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateitemGroup.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
        state.snackbarMessage = 'itemGroup deactivated successfully';
        state.snackbarOpen = true;
      })
      .addCase(deactivateitemGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to deactivate itemGroup';
        state.snackbarMessage = 'Failed to deactivate itemGroup';
        state.snackbarOpen = true;
      })

      // Activate itemGroup
      .addCase(activateitemGroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateitemGroup.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
        state.snackbarMessage = 'itemGroup activated successfully';
        state.snackbarOpen = true;
      })
      .addCase(activateitemGroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to activate itemGroup';
        state.snackbarMessage = 'Failed to activate itemGroup';
        state.snackbarOpen = true;
      })


      // Export CSV
      .addCase(Exportitemgroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Exportitemgroup.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(Exportitemgroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? "Failed to export ItemGroup data";
      })



      // Import CSV
      .addCase(Importitemgroup.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(Importitemgroup.fulfilled, (state, action) => {
        state.loading = false;
        const { message, inserted_ids, duplicates, updated, failed } = action.payload;

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
      .addCase(Importitemgroup.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to import ItemGroup data";
        state.snackbarOpen = true;
        state.snackbarMessage = action.payload as string || "Failed to import ItemGroup data";
      });

  },
});

export const {
  setitemGroupData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetitemGroupData,
} = itemGroupSlice.actions;

export const selectitemGroup = (state: RootState) => state.itemGroup;

export default itemGroupSlice.reducer;