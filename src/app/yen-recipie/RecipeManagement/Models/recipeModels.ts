



export interface RecipeListItem {
  recipeId: string;
  RECIPEID: string;
  itemType: string;
  varianceName: string;
  category: string;
  subCategory: string;
  profit: number;
  version:number;
  status: string;
  profitPercentage: number;
  createdDate: string | null;
  updatedDate: string | null;
}




// Update FetchRecipeResponse to use RecipeListItem
export interface FetchRecipe {
  results: RecipeListItem[];   // ← changed from Recipe[]
  totalPages: number;
  currentPage: number;
  totalRecipes: number;
  allItemNames: string[];
}


// Add this interface after your imports
export interface FetchRecipeResponse {
  results: Recipe[];
  totalPages: number;
  currentPage: number;
  totalRecipes: number;
  allItemNames: string[];
}

export interface FetchRecipeArgs {
  search?: string;
  page?: number;
  limit?: number;
  status?: 'active' | 'deactivated'; // ✅ ADD THIS
}




export interface PerGramBreakdown {
  itemName: string;
  valueInName: string;
  totalGrams: number;
  gramFormula: string;
  totalCost: number;
  perGramCost: number;
  steps: string[];
}

export interface IngredientItem {
  ingredients: string;
  ingredientName?: string;   // ← add
  qty?: number;
  kitQty: number;
  uom: string;
  batchQty: number;
  perGramCost: number;
  totalCost: number;
  haveIt: boolean;
  GST: number;

  isSubKitSelection?: boolean; // Flag for dropdown row
  isSubKitHeader?: boolean; // New flag to identify subkit name row
  totalRequiredSubkitQty?: number;
}

export interface RecipeIngredient {
  addedIngrediant: IngredientItem[];
}



export interface KitUsingSubkit {
  recipeId: string;
  RECIPEID: string;
  kitName: string;
  itemCode: string;
  itemType: string;
  status: string;
  currentVersion: number;
  perGramWeight: number;
  perPieceWeight: number;
  PcsWeight: number;
  totalIngCost: number;
  totalSellingCost: number;
  profit: number;
  profitPercentage: number;
  subkitName: string;
  totalRequiredSubkitQty: number;
  allIngredients: IngredientItem[];
  createRecipe: {
    itemName: string;
    kitPrepare: number;
    UOM: string;
    totalServings: number;
    gramsOrPcs: number;
  };
  rawMaterial: RawMaterialCost;
  sellingCost: {
    sellingCostKg: number;
    sellingCostPcs: number;
    totalSellingCost: number;
  };
  instruction: Instruction;
  timing: TimePreparation;
  assignFields: AssigningFields;
  remark: string;

   // ✅ ADD THIS FIELD
  afterBaking?: {
    bakingOutputGrams: number;
    bakingOutputPcs: number;
  };
}




export interface Fields {
  category: string;
  subCategory: string;
}

export interface Totals {
  totalQty: number;
  totalKitQty: number;
  totalBatchQty: number;
  totalIngCost: number;
  totalGST: number;
}

export interface ConsumableItem {
  name: string;
  percentage: number;
  price?: number;
}

export interface Consumables {
  items: ConsumableItem[];
}

export interface RawMaterialCost {
  rmcTotalCost: number;
  consumables: Consumables;
  wastage: number;
  wastagePrice?: number; 
  others: number;
  othersPrice?: number;  
  GST: number;
}

export interface Profit {
  profit: number;
  consumablePrice: number;
  gstPrice: number;
  profitPercentage: number;
}

export interface SellingCost {
  sellingCostKg: number;
  sellingCostPcs: number;
  totalSellingCost: number;

}

export interface PerPieceWeight {
  perGramWeight: number;
  perPieceWeight: number;
  PcsWeight: number;
}

export interface ProductOutput {
  productOutputGrams: number;
  productOutputPcs: number;
}

export interface AfterBakingOutput {
  bakingOutputGrams: number;
  bakingOutputPcs: number;
}

export interface DialogRecipe {
  itemName: string;
  kitPrepare: number;
  UOM: string;
  totalServings: number;
  gramsOrPcs: number;
}

export interface TimePreparation {
  preparationTime: string | null;
  cookingTime: string | null;
  totalTime: string | null;
  bakingWeightLoss: number;
}

export interface Instruction {
  stepByStepInstructions: string;
}

export interface AssigningFields {
  nutritionInfo: string[];
  cuisine: string;
  dietaryRestriction: string;
  storageInstruction: string;
}

export interface BranchwiseItems {
  subCategory: string;
  category: string;
  varianceName: string;
  variance_Defaultprice: number;
  variance_Uom: string;
  tax: string;
}

export interface POItems {
  randomId?: string;
  purchaseitemId: string;
  itemName: string;
  uom: string;
  purchasePrice: number;
  purchasetaxName: number;
}





export interface IngredientVarianceChange {
  ingredientId: string;
  ingredientName: string;
  oldPerGramCost: number;
  newPerGramCost: number;
  priceChangePercent: number;
  oldTotalCost: number;
  newTotalCost: number;
  batchQty: number;
}

export interface VarianceNotification {
  id: string;
  recipeId: string;
  alertDate: string;
  perGramWeightVariance: number;
  perPieceWeightVariance: number;
  oldPerGramWeight: number;
  newPerGramWeight: number;
  oldTotalCost: number;
  newTotalCost: number;
  ingredientsChanged: number;
  ingredientChanges: IngredientVarianceChange[];
  message: string;
  status: string;
}

// export interface VarianceState {
//   unreadCount: number;
//   notifications: VarianceNotification[];
// }





// ✅ NEW (add this instead):
export interface VarianceNotification {
  itemName: string;        // ✅ Recipe/Kit name (e.g., "BMFG0463")
  recipeId: string;
  itemType: string;
  variancePercent: number; // ✅ Overall cost change % (e.g., 27.29)
}

export interface VarianceResponse {
  hasAlerts: boolean;
  totalAlerts: number;
  unreadCount: number;
  page: number;
  limit: number;
  totalPages: boolean | number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  notifications: VarianceNotification[];  // ✅ Array of {itemName, variancePercent}
  lastCheckedAt?: string;
  dataSource?: string;
  totalRecipesChecked?: number;
  totalCount?: number;
}

// export interface VarianceState {
//   unreadCount: number;
//   notifications: VarianceNotification[];  // ✅ Updated type
//   hasAlerts?: boolean;
//   lastCheckedAt?: string;
// }


export interface VarianceState {
  unreadCount: number;
  notifications: VarianceNotification[];
  allCachedNotifications: VarianceNotification[]; // ✅ Local cache
  hasAlerts: boolean;
  lastCheckedAt?: string;
  totalAlerts: number;
  hasNextPage: boolean;
  currentPage: number;
  totalCount?: number;
}



// ✅ Add new interface for inline variance display
export interface InlineVarianceEntry {
  oldPerGramCost: number;
  newPerGramCost: number;
  priceChangePercent: number;
  oldTotalCost: number;
  newTotalCost: number;
  oldGST: number;
  newGST: number;
}



export interface Recipe {
  itemType: string;
  recipeId: string;
  RECIPEID: string;
  fields: Fields | null;
  createRecipe: DialogRecipe | null;
  ingredients: RecipeIngredient | null;
  totals: Totals | null;
  instruction: Instruction | null;
  timing: TimePreparation | null;
  productOutput: ProductOutput | null;
  afterBaking: AfterBakingOutput | null;
  perPieceWeight: PerPieceWeight | null;
  sellingCost: SellingCost | null;
  rawMaterial: RawMaterialCost | null;
  profit: Profit | null;
  assignFields: AssigningFields | null;
  createdDate: string | null;
  updatedDate: string | null;
  remark: string;
  status: string;
}

export interface Consumable {
  consumableId: string;
  name: string;
  createdDate: string | null;
}


export interface DateTime {
  current_date: string | null;
  current_time: string | null;
}



export interface RecipeVersionDoc {
  _id: string;
  recipeId: string;
  RECIPEID: string;
  version: number;
  snapshotType: string;
  createdAt: string;
  createdBy: string;
  remarks: string;
  priceCommitted?: boolean;
  createRecipe: {
    itemName: string;
    kitPrepare: number;
    UOM: string;
    totalServings: number;
    gramsOrPcs: number;
  };
  ingredients: {
    ingredientId: string;
    ingredientName: string;
    qty: number;
    batchQty: number;
    uom: string;
    perGramCost: number;
    totalCost: number;
    GST: number;
    haveIt: boolean;
  }[];
  totals?: {
    totalKitQty: number;
    totalBatchQty: number;
    totalIngCost: number;
    totalGST: number;
  };
  profit?: {
    profit: number;
    profitPercentage: number;
  };
  sellingCost?: {
    sellingCostKg: number;
    sellingCostPcs: number;
    totalSellingCost: number;
  };
   // ← ADD THESE TWO
  timing?: {
    bakingWeightLoss?: number;
    preparationTime?: string | null;
    cookingTime?: string | null;
    totalTime?: string | null;
  };
  rawMaterial?: {
    consumables?: {
      items?: {
        name?: string;
        percentage?: number;
      }[];
    };
    wastage?: number;
    others?: number;
    GST?: number;
  };
}




export interface VersionPreviewSnapshot {
  totalCost: number;
  totalGST: number;
  totalQty: number;
  totalEstimateQty: number;
  TotalServKitQty: number;
  afterBakingOutput: number;
  perGramWeight: number;
  perPcsValue: number;
  perPieceWeight: number;
  profitValue: number;
  profitPercentage: number;
  consumablePrice: number;
  GSTPrice: number;
  totalCostValue: number;
  sellingCostKg: number;
  sellingCostPcs: number;
  totalSellingCost: number;
  bakingWeightLoss: number;
}


export interface RecipeState {
  getRecipe: RecipeListItem[],
  deactivatedGetRecipe: RecipeListItem[],
  recipes: Recipe[];
  deactivatedRecipes: Recipe[];
  sfgRecipes: Recipe[];
  currentRecipe: Recipe | null;
  allRecipeItemNames: string[];
  product: BranchwiseItems[];
  poItems: POItems[];
  consumables: Consumable[];
  dateTime: DateTime[];
  loading: boolean;
  error: string | null;
  recipeData: Recipe;
  editIndex: number | null;
  dialogOpen: "none" | "edit" | "add";
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  isFetchingItems: boolean;
  hasMoreItems: boolean;
  currentSearchQuery: string;
  exportLoading: boolean;
  exportError: string | null;

  // Add these new properties for recipe pagination
  currentRecipePage: number;
  totalRecipePages: number;
  totalRecipes: number;
  recipesPerPage: number;

  variance: VarianceState;
  varianceLoading: boolean;

  versionHistory: {
    versions: RecipeVersionDoc[];
    totalVersions: number;
    totalPages: number;
    currentPage: number;
    loading: boolean;
  };


}

export const initialRecipe: Recipe = {
  itemType: "",
  recipeId: "",
  RECIPEID: '',
  fields: { category: "", subCategory: "" },
  createRecipe: null,
  ingredients: null,
  totals: null,
  instruction: null,
  timing: null,
  productOutput: null,
  afterBaking: null,
  perPieceWeight: null,
  sellingCost: null,
  rawMaterial: { rmcTotalCost: 0, consumables: { items: [] }, wastage: 0, others: 0, GST: 0 },
  profit: null,
  assignFields: null,
  createdDate: null,
  updatedDate: null,
  remark: "",
  status: "",
};

export const initialState: RecipeState = {
  getRecipe: [],
  deactivatedGetRecipe: [],
  recipes: [],
  deactivatedRecipes: [],
  sfgRecipes: [],
  allRecipeItemNames: [],
  currentRecipe: null,
  product: [],
  poItems: [],
  consumables: [],
  dateTime: [],
  loading: false,
  error: null,
  showDeactivated: false,
  recipeData: initialRecipe,
  editIndex: null,
  dialogOpen: "none",
  snackbarOpen: false,
  snackbarMessage: "",
  searchQuery: "",
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 50,
  isFetchingItems: false,
  hasMoreItems: true,
  currentSearchQuery: "",
  exportLoading: false, // Initialize export loading
  exportError: null, // Initialize export error




  // Add these new default values for recipe pagination
  currentRecipePage: 1,
  totalRecipePages: 1,
  totalRecipes: 0,
  recipesPerPage: 20,


  //   variance: {
  //     unreadCount: 0,
  //     notifications: [],
  //   },
  //   varianceLoading: false,
  // };
  variance: {
    unreadCount: 0,
    notifications: [],
    allCachedNotifications: [], // ✅ Local cache
    hasAlerts: false,
    lastCheckedAt: undefined,
    totalAlerts: 0,
    hasNextPage: false,
    currentPage: 1,
  },
  varianceLoading: false,

  versionHistory: {
    versions: [],
    totalVersions: 0,
    totalPages: 0,
    currentPage: 1,
    loading: false,
  },
};