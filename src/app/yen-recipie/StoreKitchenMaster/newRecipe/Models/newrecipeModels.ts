
export interface RecipeItem {
  frontendKey: string;
  realCode: string;
  name: string;
  code: string;
  uom: string;
  type: "SFG" | "RM";
  category?: "Raw" | "Packing" | "FG-External" | "Cleaning";
  quantity: string;
  placeholder: string;
  status: "assigned";
  defaultPrice?: number;
  takeAway?: boolean;
  dineIn?: boolean;
  isNonKgGramEntry?: boolean;
  totalKgForPrice?: number;
  pricePerGram?: number;
  randomId?: string;
}

export interface LatestVersionApiItem {
  id?: string;
  name: string;
  code: string;
  uom: string;
  type: "RM" | "SFG";
  category?: string | null;
  randomId?: string | null;
  quantity?: number;
  quantityInGrams?: number | null;
  unitPrice?: number;
  totalPrice?: number;
  takeAway?: boolean | null;
  dineIn?: boolean | null;
  isGramBased?: boolean | null;
  totalKgForPrice?: number | null;
}

export interface LatestVersionApiResponse {
  itemName?: string;
  recipeName?: string;
  varianceName?: string;
  version: number;
  totalItemsCost?: number;
  recipeMeta?: {
    item_Defaultprice?: number;
    varianceName?: string;
    itemName?: string;
  };
  items: LatestVersionApiItem[];
}

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
  randomId?: string | null;
}

export type RecipeItemType = "RM" | "SFG" | "PACKAGING";

// Shape returned by /allrecipes/{id}/latest-version, normalized in page.tsx
// before being stored in the draft slice.
export interface DraftRecipeItem {
  id?: string;
  name: string;
  code: string;
  uom: string;
  type: "RM" | "SFG";
  category?: string;
  randomId?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  takeAway?: boolean;
  dineIn?: boolean;
  isGramBased?: boolean;
  quantityInGrams?: number;
  totalKgForPrice?: number;
}

export interface DraftRecipe {
  recipeId: string;
  recipeName: string;
  items: DraftRecipeItem[];
  fromVersion?: number;
  totalItemsCost?: number;
  item_Defaultprice?: number;
  cost?: number | string;
}

// Shape sent to createRecipe() in handleSave — built from RecipeItem (UI rows)
// but reshaped for the API, so it needs its own type.
export interface BackendRecipeItemPayload {
  id: string;
  name: string;
  code: string;
  uom: string;
  type: "RM" | "SFG";
  randomId?: string;
  category?: "Raw" | "Packing" | "FG-External" | "Cleaning";
  itemCode?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  quantityInGrams?: number;
  isGramBased?: boolean;
  totalKgForPrice?: number;
  takeAway: boolean | null;
  dineIn: boolean | null;
}

export interface CreateRecipePayload {
  recipeId?: string;
  recipeName?: string;
  cost: number;
  totalItemsCost?: number; 
  items: BackendRecipeItemPayload[];
  recipeMeta?: RecipeName | null;
}

export interface RecipeName {
  itemName?: string;
  varianceName?: string;
  itemCode?: string;
  item_Uom?: string;
  item_Defaultprice?: number;
  status?: "Approved" | "Pending" | "Rejected";
  isUsed?: boolean;   // ← added
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

export interface MaterialsState {
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

export const initialState: MaterialsState = {
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
