



import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../../redux/store';
import { MeasurementType, initialState, initialMeasurementType } from '../Models/measurementTypeModels';
import { API_BASE_URL } from '../../../../../../API_URL';

const measurementType_API_URL = `${API_BASE_URL}/measurementtypes/`;

// Fetch all measurementTypes
export const fetchMeasurementTypes = createAsyncThunk<MeasurementType[], void>(
  'measurementType/fetch',
  async () => {
    const response = await axios.get(measurementType_API_URL);
    return response.data;
  }
);

// Add a new measurementType
export const addMeasurementType = createAsyncThunk<MeasurementType, MeasurementType>(
  'measurementType/add',
  async (measurementType, { rejectWithValue }) => {
    try {
      const response = await axios.post(measurementType_API_URL, measurementType);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding measurementType');
    }
  }
);

// Update an existing measurementType
export const updateMeasurementType = createAsyncThunk<MeasurementType, MeasurementType>(
  'measurementType/update',
  async (measurementType, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${measurementType_API_URL}${measurementType.id}`, measurementType);
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error updating measurementType');
    }
  }
);

// Deactivate measurementType
export const deactivateMeasurementType = createAsyncThunk<MeasurementType, string>(
  'measurementType/deactivate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${measurementType_API_URL}${id}`, { status: 'deactivated' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error deactivating measurementType');
    }
  }
);

// Activate measurementType
export const activateMeasurementType = createAsyncThunk<MeasurementType, string>(
  'measurementType/activate',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`${measurementType_API_URL}${id}`, { status: 'active' });
      return response.data;
    } catch (error: unknown) {
      const err = error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error activating measurementType');
    }
  }
);

const measurementTypeSlice = createSlice({
  name: 'measurementType',
  initialState,
  reducers: {
    setMeasurementTypeData: (state, action: PayloadAction<MeasurementType>) => {
      state.measurementTypeData = action.payload;
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
    resetMeasurementTypeData: (state) => {
      state.measurementTypeData = initialMeasurementType;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch measurementTypes
      .addCase(fetchMeasurementTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMeasurementTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter(item => item.status === 'active');
        state.deactivatedItems = action.payload.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchMeasurementTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch measurementTypes';
      })

      // Add measurementType
      .addCase(addMeasurementType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addMeasurementType.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === 'active') {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
        state.snackbarMessage = 'MeasurementType added successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(addMeasurementType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to add measurementType';
        state.snackbarMessage = 'Failed to add measurementType';
        state.snackbarOpen = true;
      })

      // Update measurementType
      .addCase(updateMeasurementType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateMeasurementType.fulfilled, (state, action) => {
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
        state.snackbarMessage = 'MeasurementType updated successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(updateMeasurementType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update measurementType';
        state.snackbarMessage = 'Failed to update measurementType';
        state.snackbarOpen = true;
      })

      // Deactivate measurementType
      .addCase(deactivateMeasurementType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateMeasurementType.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
        state.snackbarMessage = 'MeasurementType deactivated successfully';
        state.snackbarOpen = true;
      })
      .addCase(deactivateMeasurementType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to deactivate measurementType';
        state.snackbarMessage = 'Failed to deactivate measurementType';
        state.snackbarOpen = true;
      })

      // Activate measurementType
      .addCase(activateMeasurementType.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateMeasurementType.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
        state.snackbarMessage = 'MeasurementType activated successfully';
        state.snackbarOpen = true;
      })
      .addCase(activateMeasurementType.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to activate measurementType';
        state.snackbarMessage = 'Failed to activate measurementType';
        state.snackbarOpen = true;
      });
  },
});

export const {
  setMeasurementTypeData,
  setEditIndex,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setSearchQuery,
  setShowDeactivated,
  resetMeasurementTypeData,
} = measurementTypeSlice.actions;

export const selectMeasurementType = (state: RootState) => state.measurementType;

export default measurementTypeSlice.reducer;