// for right side details
export interface RecipeItem {
  id: string;
  name: string;
  code: string;
  uom: string;
  type: "SFG" | "RM" | "PACKAGING";
  quantity?: number;
  unitPrice?: number;              
  totalPrice?: number;
  category?: string | null;
  randomId?: string | null;
  takeAway?: boolean | null;
  dineIn?: boolean | null;
  isGramBased?: boolean | null;
  quantityInGrams?: number | null; // ← ADDED: lossless gram storage (e.g. 120 not 0.12)  
  totalKgForPrice?: number | null;
}

// for LEFT list
export interface VersionSummary {
  version: number;
  cost: number;
  status: boolean;
}

export interface RecipeMeta {
  itemName?: string;
  varianceName?: string;
  itemCode?: string;
  item_Uom?: string;
  item_Defaultprice?: number;
  status?: string;
}

// for RIGHT detail
export interface VersionDetail extends VersionSummary {
  recipeId: string;
  recipeName: string;
  items: RecipeItem[];
  createdAt?: string;
  totalItemsCost?: number;
  recipeMeta?: RecipeMeta;
}

export interface RecipeHistoryState {
  recipeId: string;
  versions: VersionSummary[];
  selectedVersion: VersionDetail | null;
}
