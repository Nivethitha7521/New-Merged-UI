import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";

const BASE_URL = "    https://yenerp.com/recipeapi/newrecipe";

export interface SFGMaterial {
  itemCode: string;
  sapCode: string;
  varianceName: string;
  variance_Uom: string;
  category?: string;
  variance_Defaultprice?: number;
}

export interface RawMaterial {
  itemName: string;
  uom: string;
  purchaseitemId: string | null;
  itemCode: string | null;
  purchasecategoryName?: string | null;
  purchasePrice?: number | null;
}

export type RecipeItemType = "RM" | "SFG" | "PACKAGING";

export interface RecipeItem {
  id: string;
  name: string;
  code: string;
  uom: string;
  type: RecipeItemType;
  category?: string | null;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  takeAway?: boolean | null;
  dineIn?: boolean | null;
  isGramBased?: boolean;
  quantityInGrams?: number;
  totalKgForPrice?: number;
  randomId?: string | null;      // ← ADD THIS
  pricePerGram?: number | null;
}

export interface CreateRecipePayload {
  recipeId?: string;
  recipeName?: string;
  cost: number;
  items: RecipeItem[];
  recipeMeta?: RecipeName | null;
}

export interface RecipeName {
  itemName?: string;
  varianceName?: string;
  itemCode?: string;
  item_Uom?: string;
  item_Defaultprice?: number;
  status?: "Approved" | "Pending" | "Rejected";
}

// ─── Gram price types ─────────────────────────────────────────────────────────
export interface GramPriceRequest {
  itemId: string;
  totalKg: number;
}

export interface GramPriceResponse {
  itemId: string;
  purchasePrice: number;
  totalKg: number;
  totalGrams: number;
  pricePerGram: number;  // ← backend computed, never calculated on frontend
}

interface MaterialsState {
  sfgList: SFGMaterial[];
  rawList: RawMaterial[];
  recipeNamesLoading: boolean;
  recipeNames: RecipeName[];
  selectedRecipe: RecipeName | null;
draftRecipe: DraftRecipe | null;
  sfgLoading: boolean;
  rawLoading: boolean;
  packingList: RawMaterial[];
  packingLoading: boolean;
  // gram price
  gramPriceLoading: boolean;
  gramPriceError: string | null;
}

const initialState: MaterialsState = {
  sfgList: [],
  rawList: [],
  recipeNamesLoading: false,
  recipeNames: [],
  selectedRecipe: null,
  draftRecipe: null,
  sfgLoading: false,
  rawLoading: false,
  packingList: [],
  packingLoading: false,
  gramPriceLoading: false,
  gramPriceError: null,
};
interface DraftRecipe {
  recipeId: string;
  recipeName: string;
  items: RecipeItem[];
  fromVersion?: number;
  totalItemsCost?: number;
  item_Defaultprice?: number;
   cost?: number | string;
}
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
    const res = await axios.get<RecipeName[]>(" https://yenerp.com/recipeapi/recipenames", { params: { search } });
    return res.data;
  }
);

export const createRecipe = createAsyncThunk<void, CreateRecipePayload>(
  "recipes/create", async (payload) => {
    await axios.post(`${BASE_URL}`, payload);
  }
);

// ─── NEW: POST to backend → backend fetches purchasePrice → returns pricePerGram
// Frontend NEVER computes pricePerGram itself.
export const calculateGramPrice = createAsyncThunk<GramPriceResponse, GramPriceRequest>(
  "materials/calculateGramPrice",
  async (payload, { rejectWithValue }) => {
    try {
      // Keep the endpoint the same but payload now has itemId
      const res = await axios.post<GramPriceResponse>(`${BASE_URL}/calculate-gram-price`, payload);
      return res.data;
    } catch (err: unknown) {
      const detail = axios.isAxiosError(err)
        ? err.response?.data?.detail ?? "Failed to calculate price. Check item ID."
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
      .addCase(fetchSFGMaterials.pending,   (s) => { s.sfgLoading = true; })
      .addCase(fetchSFGMaterials.fulfilled, (s, a) => { s.sfgList = a.payload; s.sfgLoading = false; })
      .addCase(fetchSFGMaterials.rejected,  (s) => { s.sfgLoading = false; })

      .addCase(fetchRawMaterials.pending,   (s) => { s.rawLoading = true; })
      .addCase(fetchRawMaterials.fulfilled, (s, a) => { s.rawList = a.payload; s.rawLoading = false; })
      .addCase(fetchRawMaterials.rejected,  (s) => { s.rawLoading = false; })

      .addCase(fetchRecipeNames.pending,   (s) => { s.recipeNamesLoading = true; })
      .addCase(fetchRecipeNames.fulfilled, (s, a) => { s.recipeNames = a.payload; s.recipeNamesLoading = false; })
      .addCase(fetchRecipeNames.rejected,  (s) => { s.recipeNamesLoading = false; })

      .addCase(fetchPackingMaterials.pending,   (s) => { s.packingLoading = true; })
      .addCase(fetchPackingMaterials.fulfilled, (s, a) => { s.packingList = a.payload; s.packingLoading = false; })
      .addCase(fetchPackingMaterials.rejected,  (s) => { s.packingLoading = false; })

      // gram price — result used directly in page, not stored in Redux
      .addCase(calculateGramPrice.pending,   (s) => { s.gramPriceLoading = true; s.gramPriceError = null; })
      .addCase(calculateGramPrice.fulfilled, (s) => { s.gramPriceLoading = false; })
      .addCase(calculateGramPrice.rejected,  (s, a) => { s.gramPriceLoading = false; s.gramPriceError = a.payload as string; });
  },
});

export const { setNewRecipeDraft, clearNewRecipeDraft, setSelectedRecipe, clearGramPriceError } = materialsSlice.actions;
export default materialsSlice.reducer;