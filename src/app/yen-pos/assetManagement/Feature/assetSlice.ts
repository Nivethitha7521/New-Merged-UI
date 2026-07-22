

// export default assetSlice.reducer;
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { RootState } from '../../../../redux/store';

import { Asset, initialState, initialAsset } from "../Models/assetModels";


const ASSET_API_URL = 'https://yenerp.com/fastapi/assetmanagements/';



export const fetchassets = createAsyncThunk<Asset[]>('asset/fetchassets', async () => {
  const response = await axios.get(ASSET_API_URL);
//  console.log(`${response.data}`);
  
  return response.data;
});

export const addasset = createAsyncThunk<Asset, Asset>('asset/addasset', async (asset, { rejectWithValue }) => {
  try {
    const response = await axios.post(ASSET_API_URL, asset);
    return response.data;
  } catch (error) {
    const err=error as AxiosError;
    return rejectWithValue(err.response?.data || 'Failed to add asset');
  }
});

export const updateasset = createAsyncThunk<Asset, Asset>('asset/updateasset', async (asset, { rejectWithValue }) => {
  try {
    const response = await axios.put(`${ASSET_API_URL}${asset.assetId}`, asset);
    return response.data;
  } catch (error) {
    const err=error as AxiosError;
    return rejectWithValue(err.response?.data || 'Failed to update asset');
  }
});

export const deactivateasset = createAsyncThunk<Asset, string>('asset/deactivateasset', async (assetId, { rejectWithValue }) => {
  try {
    const response = await axios.patch(`${ASSET_API_URL}${assetId}`, { status: '0' });
    return response.data;
  } catch (error) {
    const err= error as AxiosError;
    return rejectWithValue(err.response?.data || 'Failed to deactivate asset');
  }
});

export const activateasset = createAsyncThunk<Asset, string>('asset/activateasset', async (assetId, { rejectWithValue }) => {
  try {
    const response = await axios.patch(`${ASSET_API_URL}${assetId}`, { status: '1' });
    return response.data;
  } catch (error) {
    const err=error as AxiosError;
    return rejectWithValue(err.response?.data || 'Failed to activate asset');
  }
});

const assetSlice = createSlice({
  name: 'asset',
  initialState,
  reducers: {
    setAssetData: (state, action: PayloadAction<Asset>) => {
      state.assetData = action.payload;
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
    resetAssetData: (state) => {
      state.assetData = initialAsset;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchassets.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchassets.fulfilled, (state, action) => {
        state.loading = false;
        state.assets = action.payload.filter(item => item.status === '1');
        state.deactivatedAssets = action.payload.filter(item => item.status === '0');
      })
      .addCase(fetchassets.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch assets';
      })
      .addCase(addasset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addasset.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.status === '1') {
          state.assets.push(action.payload);
        } else {
          state.deactivatedAssets.push(action.payload);
        }
        state.snackbarMessage = 'Asset added successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(addasset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add asset';
        state.snackbarMessage = 'Failed to add asset';
        state.snackbarOpen = true;
      })
      .addCase(updateasset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateasset.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.assets.findIndex(p => p.assetId === action.payload.assetId);
        if (index !== -1) {
          state.assets[index] = action.payload;
        }
        state.snackbarMessage = 'Asset updated successfully';
        state.snackbarOpen = true;
        state.dialogOpen = 'none';
      })
      .addCase(updateasset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update asset';
        state.snackbarMessage = 'Failed to update asset';
        state.snackbarOpen = true;
      })
      .addCase(deactivateasset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deactivateasset.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.assets.findIndex(p => p.assetId === action.payload.assetId);
        if (index !== -1) {
          const [deactivated] = state.assets.splice(index, 1);
          state.deactivatedAssets.push(deactivated);
        }
        state.snackbarMessage = 'Asset deactivated successfully';
        state.snackbarOpen = true;
      })
      .addCase(deactivateasset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to deactivate asset';
        state.snackbarMessage = 'Failed to deactivate asset';
        state.snackbarOpen = true;
      })
      .addCase(activateasset.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(activateasset.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.deactivatedAssets.findIndex(p => p.assetId === action.payload.assetId);
        if (index !== -1) {
          const [activated] = state.deactivatedAssets.splice(index, 1);
          state.assets.push(activated);
        }
        state.snackbarMessage = 'Asset activated successfully';
        state.snackbarOpen = true;
      })
      .addCase(activateasset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to activate asset';
        state.snackbarMessage = 'Failed to activate asset';
        state.snackbarOpen = true;
      });
  },
});

export const {
  setAssetData,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  setShowDeactivated,
  resetAssetData,
} = assetSlice.actions;

export const selectAssets = (state: RootState) => state.asset;

export default assetSlice.reducer;

