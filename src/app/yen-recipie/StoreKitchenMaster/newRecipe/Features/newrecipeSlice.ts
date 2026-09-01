

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import {
  CreateRecipePayload,
  DraftRecipe,
  GramPriceRequest,
  GramPriceResponse,
  initialState,
  RawMaterial,
  RecipeName,
  SFGMaterial,
} from "../Models/newrecipeModels";

const BASE_URL = "    http://127.0.0.1:8000/yenerpapi/newrecipe";

export const fetchSFGMaterials = createAsyncThunk<SFGMaterial[], string>(
  "materials/fetchSFG", async (search) => {
    const res = await axios.get<SFGMaterial[]>(`${BASE_URL}/sfg`, { params: { skip: 0, limit: 50, search } });
    return res.data;
  }
);

export const fetchRawMaterials = createAsyncThunk<RawMaterial[], string>(
  "materials/fetchRaw", async (search) => {
    const res = await axios.get<RawMaterial[]>(`${BASE_URL}/raw`, { params: { search } });
    return res.data;
  }
);

export const fetchPackingMaterials = createAsyncThunk<RawMaterial[], string>(
  "materials/fetchPacking", async (search) => {
    const res = await axios.get<RawMaterial[]>(`${BASE_URL}/packing`, { params: { search } });
    return res.data;
  }
);

export const fetchRecipeNames = createAsyncThunk<RecipeName[], string>(
  "recipes/fetchNames", async (search) => {
    const res = await axios.get<RecipeName[]>(" http://127.0.0.1:8000/yenerpapi/recipenames", { params: { search } });
    return res.data;
  }
);

export const createRecipe = createAsyncThunk<void, CreateRecipePayload>(
  "recipes/create", async (payload) => {
    await axios.post(`${BASE_URL}`, payload);
  }
);

// ─── POST to backend → backend fetches purchasePrice → returns pricePerGram
// Frontend NEVER computes pricePerGram itself.
export const calculateGramPrice = createAsyncThunk<GramPriceResponse, GramPriceRequest>(
  "materials/calculateGramPrice",
  async (payload, { rejectWithValue }) => {
    try {
      const res = await axios.post<GramPriceResponse>(`${BASE_URL}/calculate-gram-price`, payload);
      return res.data;
    } catch (err: unknown) {
      const detail =
        axios.isAxiosError(err) && err.response?.data?.detail
          ? (err.response.data.detail as string)
          : "Failed to calculate price. Check item ID.";
      return rejectWithValue(detail);
    }
  }
);

const materialsSlice = createSlice({
  name: "materials",
  initialState,
  reducers: {
    setNewRecipeDraft(state, action: PayloadAction<DraftRecipe>) {
      state.draftRecipe = action.payload;
    },
    setSelectedRecipe(state, action: PayloadAction<RecipeName>) {
      state.selectedRecipe = action.payload;
    },
    clearNewRecipeDraft(state) {
      state.draftRecipe = null;
    },
    clearGramPriceError(state) {
      state.gramPriceError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSFGMaterials.pending, (s) => { s.sfgLoading = true; })
      .addCase(fetchSFGMaterials.fulfilled, (s, a) => { s.sfgList = a.payload; s.sfgLoading = false; })
      .addCase(fetchSFGMaterials.rejected, (s) => { s.sfgLoading = false; })

      .addCase(fetchRawMaterials.pending, (s) => { s.rawLoading = true; })
      .addCase(fetchRawMaterials.fulfilled, (s, a) => { s.rawList = a.payload; s.rawLoading = false; })
      .addCase(fetchRawMaterials.rejected, (s) => { s.rawLoading = false; })

      .addCase(fetchRecipeNames.pending, (s) => { s.recipeNamesLoading = true; })
      .addCase(fetchRecipeNames.fulfilled, (s, a) => { s.recipeNames = a.payload; s.recipeNamesLoading = false; })
      .addCase(fetchRecipeNames.rejected, (s) => { s.recipeNamesLoading = false; })

      .addCase(fetchPackingMaterials.pending, (s) => { s.packingLoading = true; })
      .addCase(fetchPackingMaterials.fulfilled, (s, a) => { s.packingList = a.payload; s.packingLoading = false; })
      .addCase(fetchPackingMaterials.rejected, (s) => { s.packingLoading = false; })

      // gram price — result used directly in page, not stored in Redux
      .addCase(calculateGramPrice.pending, (s) => { s.gramPriceLoading = true; s.gramPriceError = null; })
      .addCase(calculateGramPrice.fulfilled, (s) => { s.gramPriceLoading = false; })
      .addCase(calculateGramPrice.rejected, (s, a) => { s.gramPriceLoading = false; s.gramPriceError = a.payload as string; });
  },
});

export const { setNewRecipeDraft, clearNewRecipeDraft, setSelectedRecipe, clearGramPriceError } = materialsSlice.actions;
export default materialsSlice.reducer;