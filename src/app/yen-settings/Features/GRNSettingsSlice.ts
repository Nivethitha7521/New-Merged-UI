// Features/GRNSettingsSlice.ts - FIXED with purchaseApi
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import purchaseApi from '@/utils/api';  // ← Use the same API instance

export interface GRNSettings {
  isActive: boolean;
  maxPercentageAbove: number;
}

export interface GRNPriceValidationResult {
  valid: boolean;
  message: string;
  isActive: boolean;
  hold?: boolean;
  poPrice?: number;
  grnPrice?: number;
  maxAllowed?: number;
  maxPercentage?: number;
  percentageDifference?: number;
  note?: string;
  exceededBy?: number;
  percentageAbove?: number;
}

interface GRNSettingsState {
  settings: GRNSettings | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  validationResult: GRNPriceValidationResult | null;
  lastUpdated: string | null;
}

const initialState: GRNSettingsState = {
  settings: null,
  loading: false,
  saving: false,
  error: null,
  validationResult: null,
  lastUpdated: null,
};

const getTenantId = (): string | null => {
  return sessionStorage.getItem("tenant_id");
};

// ✅ FIXED: Use purchaseApi instead of axios
export const fetchGRNPriceSettings = createAsyncThunk(
  'grnPriceSettings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const tenantId = getTenantId();
      const response = await purchaseApi.get('/purchasesettings/grn-settings/', {
        headers: { 'x-tenant-id': tenantId }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch settings');
    }
  }
);

// ✅ FIXED: Use purchaseApi instead of axios
export const saveGRNPriceSettings = createAsyncThunk(
  'grnPriceSettings/save',
  async (settings: { isActive: boolean; maxPercentageAbove: number }, { rejectWithValue }) => {
    try {
      const tenantId = getTenantId();
      const response = await purchaseApi.patch('/purchasesettings/grn-settings/', settings, {
        headers: { 'x-tenant-id': tenantId }
      });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Failed to save settings');
    }
  }
);

// ✅ FIXED: Use purchaseApi instead of axios
export const validateGRNPrice = createAsyncThunk(
  'grnPriceSettings/validate',
  async (data: { poPrice: number; grnPrice: number; itemName: string }, { rejectWithValue }) => {
    try {
      const tenantId = getTenantId();
      const response = await purchaseApi.post('/purchasesettings/grn-settings/validate-price/', data, {
        headers: { 'x-tenant-id': tenantId }
      });
      return response.data as GRNPriceValidationResult;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || 'Validation failed');
    }
  }
);

const grnSettingsSlice = createSlice({
  name: 'grnPriceSettings',
  initialState,
  reducers: {
    updateIsActive: (state, action: PayloadAction<boolean>) => {
      if (state.settings) {
        state.settings.isActive = action.payload;
      }
    },
    updateMaxPercentageAbove: (state, action: PayloadAction<number>) => {
      if (state.settings) {
        state.settings.maxPercentageAbove = action.payload;
      }
    },
    clearError: (state) => {
      state.error = null;
    },
    clearValidationResult: (state) => {
      state.validationResult = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGRNPriceSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGRNPriceSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.settings = action.payload;
        state.lastUpdated = action.payload.lastUpdated;
      })
      .addCase(fetchGRNPriceSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(saveGRNPriceSettings.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(saveGRNPriceSettings.fulfilled, (state, action) => {
        state.saving = false;
        if (state.settings) {
          state.settings.isActive = action.payload.data.isActive;
          state.settings.maxPercentageAbove = action.payload.data.maxPercentageAbove;
        }
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(saveGRNPriceSettings.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload as string;
      })
      .addCase(validateGRNPrice.fulfilled, (state, action) => {
        state.validationResult = action.payload;
      })
      .addCase(validateGRNPrice.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { updateIsActive, updateMaxPercentageAbove, clearError, clearValidationResult } = grnSettingsSlice.actions;
export default grnSettingsSlice.reducer;