

import { createAsyncThunk } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../../../../redux/store';
import { API_BASE_URL } from "../../../../../API_URL";




import { Uom, initialUom, initialState, Measure } from '../Models/uomModels';


const UOM_API_URL = `${API_BASE_URL}/uoms/`;
const MEASURE_API_URL = `${API_BASE_URL}/uoms/measure/`;



// Fetch All MEasurements
export const fetchAllMeasures = createAsyncThunk<Measure[]>(
  'measures/fetchAll',
  async () => {
    const response = await axios.get(MEASURE_API_URL);
    return response.data;
  }
);


// Fetch Uoms
export const fetchUoms = createAsyncThunk<Uom[]>(
  'uoms/fetch',
  async () => {
    const response = await axios.get(UOM_API_URL);
    return response.data;
  }
);



// Add Uom
export const addUom = createAsyncThunk<Uom, Uom>(
  'uoms/add',
  async (uom, { rejectWithValue }) => {
    try {
      const response = await axios.post(UOM_API_URL, uom);
      return response.data;
    } catch (error) {
      const err=error as AxiosError;
      return rejectWithValue(err.response?.data || 'Error adding UOM');
    }
  }
);


  // Update Uom
export const updateUom = createAsyncThunk<Uom, Uom>(
  'uoms/update',
  async (uom) => {
    const response = await axios.patch(`${UOM_API_URL}${uom.id}`, uom);
    return response.data;
  }
);


// Deactivate Uom
export const deactivateUom = createAsyncThunk<Uom, string>(
  'uoms/deactivate',
  async (id) => {
    const response = await axios.patch(`${UOM_API_URL}${id}`, { status: 'deactivated' });
    return response.data;
  }
);


// Activate Uom
export const activateUom = createAsyncThunk<Uom, string>(
  'uoms/activate',
  async (id) => {
    const response = await axios.patch(`${UOM_API_URL}${id}`, { status: 'active' });
    return response.data;
  }
);

const uomSlice = createSlice({
  name: 'uom',
  initialState,
  reducers: {
    setUomData: (state, action: PayloadAction<Uom>) => {
      state.uomData = action.payload;
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
    setShowDeactivated: (state, action: PayloadAction<boolean>) => {
      state.showDeactivated = action.payload;
    },
    resetUomData: (state) => {
      state.uomData = initialUom;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUoms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUoms.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.filter(item => item.status === 'active');
        state.deactivatedItems = action.payload.filter(item => item.status === 'deactivated');
      })
      .addCase(fetchUoms.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch UOMs';
      })

      /////////////////////////////////////////////////////////

      .addCase(fetchAllMeasures.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllMeasures.fulfilled, (state, action) => {
        state.measurementTypes = action.payload;
      })  
      .addCase(fetchAllMeasures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to fetch UOMs';
      })
      /////////////////////////////////////////////////

      .addCase(addUom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addUom.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === 'active') {
          state.items.push(action.payload);
        } else {
          state.deactivatedItems.push(action.payload);
        }
        state.snackbarMessage = 'UOM added successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(addUom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to add UOM';
        state.snackbarMessage = 'Failed to add UOM';
        state.snackbarOpen = true;
      })
      .addCase(updateUom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUom.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((p: { id: string; }) => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.snackbarMessage = 'UOM updated successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(updateUom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to update UOM';
        state.snackbarMessage = 'Failed to update UOM';
        state.snackbarOpen = true;
      })
      .addCase(deactivateUom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateUom.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.items.findIndex((p: { id: string; }) => p.id === action.payload.id);
        
        if (index !== -1) {
          const [deactivated] = state.items.splice(index, 1);
          state.deactivatedItems.push(deactivated);
        }
        state.snackbarMessage = 'UOM deactivated successfully';
        state.snackbarOpen = true;
      })
      .addCase(deactivateUom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to deactivate UOM';
        state.snackbarMessage = 'Failed to deactivate UOM';
        state.snackbarOpen = true;
      })
      .addCase(activateUom.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateUom.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedItems.findIndex((p: { id: string; }) => p.id === action.payload.id);
        if (index !== -1) {
          const [activated] = state.deactivatedItems.splice(index, 1);
          state.items.push(activated);
        }
        state.snackbarMessage = 'UOM activated successfully';
        state.snackbarOpen = true;
      })
      .addCase(activateUom.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message ?? 'Failed to activate UOM';
        state.snackbarMessage = 'Failed to activate UOM';
        state.snackbarOpen = true;
      });
  },
});

export const {
  setUomData,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setShowDeactivated,
  resetUomData,
} = uomSlice.actions;


export const selectUoms = (state: RootState) => state.uoms;


export default uomSlice.reducer;



