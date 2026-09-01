// import { DateTime } from "@/app/yen-recipie/RecipeManagement/Models/recipeModels";


// export interface ItemGroup {
//   itemGroupName: string;
// }

// export interface Category {
//   id: string;
//   categoryName: string;
//   subCategory: string[];
// }

// export interface subCategory {
//   subCategoryName: string;
// }


// export interface Tax {
//   taxName: string;
//   taxPercentage: number;
// }

// export interface Uom {
//   measurementType: string | undefined;
//   uom: string;
// }

// export interface Branch {
//   locationId: string;
//   aliasName: string;
//   salesTypes: string[];
// }


// export interface VarianceMaster {
//   itemCode: string;
//   itemName: string;
//   category: string[];
//   subCategory: string;
//   varianceName: string;
//   variance_Defaultprice: number;
//   variance_Uom: string;
// }

// export interface Inventory {
//   inventoryId: string;
//   inventoryType: string;
// }


// export interface OrderType {
//   orderTypeId: string;
//   orderTypeName: string;
// }

// export type SingleItemResponse = {
//   item: {
//     itemImage: string | undefined;
//     branchwiseItemId: string;
//     itemName: string;
//     category: string;
//     subcategory: string;
//     itemGroup: string;
//     itemType: string;
//     itemUom: string;
//     tax: string;
//     itemDefaultprice: number;
//     description: string;
//     hsnCode: string;
//     birthdayCake: boolean;
//     uniqueQr: boolean;
//     stockValidation: boolean;
//     plateItem: boolean;
//     includeTax: boolean;
//     excludeTax: boolean;
//     netPrice: number;
//     taxPrice: number;
//     finalPrice: number;
//     status: string;
//     createdDate: string | null;
//   };
//   variance: Record<string, {
//     createdDate: string | null;
//     itemType: string;
//     itemCode: string;
//     varianceName: string;
//     variance_Defaultprice: number;
//     variance_Uom: string;
//     shelfLife: number;
//     reorderLevel: number;
//     sapCode: string;
//     varianceStatus: string;
//     branchwise: Record<string, any>;
//   }>;
// };






// export interface Item {
//   _id?: string;
//   branchwiseItemId?: string;
//   itemId?: string;
//   itemCode?: string;
//   name?: string;
//   itemName?: string;
//   category?: string;
//   subCategory: string; // Make subCategory required to match API response
//   itemGroup?: string;
//   uom?: string;
//   variance_Uom?: string;
//   item_Uom?: string;
//   tax?: string | number;
//   price?: string | number;
//   netPrice?: string | number;
//   taxPrice?: string | number;
//   finalPrice?: string | number;
//   item_Defaultprice?: string | number;
//   description?: string;
//   itemType?: string;
//   hsnCode?: string;
//   measurementType?: string;
//   reorderLevel?: string | number;
//   shelfLife?: string | number;
//   birthdayCake?: boolean;
//   uniqueQr?: boolean;
//   plateItem?: boolean;
//   variances: Variance[];
//   imageFile?: File;
//   itemImage?: string;
//   status?: string;
//   varianceStatus?: string,
//   includeTax?: boolean;
//   excludeTax?: boolean;
//   stockValidation?: boolean;

//   varianceName?: string;

//   variance_Defaultprice?: string | number;
//   [key: string]: any;
// }



// export interface Variance {
//   itemCode?: string;
//   varianceName?: string;
//   variance_Uom?: string;
//   variance_Defaultprice?: number | string;
//   shelfLife?: number | string;
//   platPrice?: string | number;
//   reorderLevel?: string | number;
//   price?: string;
//   sapCode?: string;
//   birthdayCake?: boolean;
//   uniqueQr?: boolean;
//   varianceStatus?: string,
//   createdDate?: string | null;
//   updatedDate?: string | null;
//   branchwise?: Record<string, { [key: string]: any }>;
//   [key: string]: any;
// }



// export interface Variances {
//   itemCode?: string;
//   varianceName: string;
//   category?: string;
//   subCategory?: string;
//   itemGroup?: string;
//   variance_Uom: string;
//   variance_Defaultprice: number | string;
//   tax?: number;
//   netPrice?: number | string;
//   taxPrice?: number | string;
//   finalPrice?: number | string;
//   reorderLevel: number | string;
//   shelfLife: number | string;
//   sapCode: string;
//   varianceStatus: string;
//   hsnCode?: string | number;
//   birthdayCake?: boolean;
//   uniqueQr?: boolean;
//   plateItem?: boolean;
//   includeTax?: boolean;
//   excludeTax?: boolean;
//   branchwise?: Record<string, any>;
//   uom?: string;
//   price?: number;
// }


// // Define the structure of the API response data
// export interface ApiResponse {
//   data: Record<string, { item: Item; variance: Variance[] }>;
//   total_pages: number;
// }



// // Add this new interface
// export interface FetchDeactivatedItemsResponse {
//   items: Item[];
//   totalPages: number;
// }

// // Add this new params interface
// export interface FetchDeactivatedItemsParams {
//   page: number;
//   limit: number;
//   itemName?: string;
// }


// // Define the slice state - UPDATED with show deactivated functionality
// export interface ItemState {
//   items: Item[];                    // Active items currently displayed
//   deactivatedItems: Item[];         // Separately stored deactivated items
//   itemGroups: ItemGroup[];
//   categories: Category[];
//   subcategories: subCategory[];
//   taxes: Tax[];
//   uoms: Uom[];
//   inventory: Inventory[];
//   orderTypes: OrderType[];
//   branchOptions: string[];
//   branchess: Branch[];
//   variancesMaster: VarianceMaster[];
//   currentItem?: SingleItemResponse;
//   loading: boolean;
//   error: string | null;

//   // Pagination
//   totalPages: number;
//   currentPage: number;
//   itemsPerPage: number;             // e.g., 30 or 50

//   // Infinite scroll / pagination helpers
//   isFetchingItems: boolean;
//   hasMoreItems: boolean;

//   // UI state
//   snackbarOpen: boolean;
//   snackbarMessage: string;
//   searchQuery: string;              // Current search term
//   showDeactivated: boolean;         // Toggle to show deactivated items

//   // Optional: dialog state if you have add/edit modals
//   dialogOpen: "none" | "add" | "edit";

//   deactivatedTotalPages: number;
//   deactivatedCurrentPage: number;
// }

// // Define the initial state - UPDATED
// export const initialState: ItemState = {
//   items: [],
//   deactivatedItems: [],             // Initially empty
//   itemGroups: [],
//   categories: [],
//   subcategories: [],
//   taxes: [],
//   uoms: [],
//   inventory: [],
//   orderTypes: [],
//   branchOptions: [],
//   branchess: [],
//   variancesMaster: [],
//   loading: false,
//   error: null,
//   totalPages: 1,
//   currentPage: 1,
//   itemsPerPage: 30,                 // Adjust as needed
//   isFetchingItems: false,
//   hasMoreItems: true,
//   snackbarOpen: false,
//   snackbarMessage: '',
//   searchQuery: '',
//   showDeactivated: false,           // Default: show only active items
//   dialogOpen: "none",

//   deactivatedTotalPages: 1,
//   deactivatedCurrentPage: 1,
// };





// // Define parameters for the fetch items thunk
// export interface FetchItemsParams {
//   page: number;
//   limit: number;
//   itemName?: string;
// }

// // Define return type for the fetch items thunk
// export interface FetchItemsResponse {
//   items: Item[];
//   totalPages: number;
// }

// // Define parameters for the delete item thunk
// export interface DeleteItemParams {
//   branchwiseItemId: string;
//   page: number;
//   limit: number;
//   itemName?: string;
// }

// // Define parameters for the delete variance thunk
// export interface DeleteVarianceParams {
//   itemCode: string;
//   page: number;
//   limit: number;
//   itemName?: string;
// }




// // Define parameters for activate/deactivate item thunk
// export interface ToggleItemStatusParams {
//   branchwiseItemId: string;
//   page: number;
//   limit: number;
//   itemName?: string;
// }

// // Define parameters for activate/deactivate variance thunk
// export interface ToggleVarianceStatusParams {
//   itemCode: string;
//   page: number;
//   limit: number;
//   itemName?: string;
// }


// export interface UpdateVarianceParams {
//   itemCode: string;
//   updates: Partial<Variance>;
//   page: number;
//   limit: number;
//   itemName?: string;
// }

// export interface UpdateItemParams {
//   branchwiseItemId: string;
//   updates: Partial<Item>;
//   page: number;
//   limit: number;
//   itemName?: string;
// }


// export interface UpdateItemParams {
//   branchwiseItemId: string;
//   updates: Partial<Item>;
//   page: number;
//   limit: number;
//   itemName?: string;
// }


// export interface AddVarianceParams {
//   varianceId: string;
//   variance: Variance;
//   page: number;
//   limit: number;
//   itemName?: string;
// }
























import { DateTime } from "@/app/yen-recipie/RecipeManagement/Models/recipeModels";


export interface ItemGroup {
  itemGroupName: string;
}

export interface Category {
  id: string;
  categoryName: string;
  subCategory: string[];
}

export interface subCategory {
  subCategoryName: string;
}


export interface Tax {
  taxName: string;
  taxPercentage: number;
}

export interface Uom {
  measurementType: string | undefined;
  uom: string;
}

export interface Branch {
  locationId: string;
  aliasName: string;
  salesTypes: string[];
}


export interface VarianceMaster {
  itemCode: string;
  itemName: string;
  category: string[];
  subCategory: string;
  varianceName: string;
  variance_Defaultprice: number;
  variance_Uom: string;
}

// ── New: Variance master item returned by ?item_name= filter ─────────────────
export interface VarianceMasterDetail {
  itemCode: string;
  itemName: string;
  category: string;
  subCategory: string;
  varianceName: string;
  variance_Defaultprice: number;
  variance_Uom: string;
}

export interface Inventory {
  inventoryId: string;
  inventoryType: string;
}


export interface OrderType {
  orderTypeId: string;
  orderTypeName: string;
}

export type SingleItemResponse = {
  item: {
    itemImage: string | undefined;
    branchwiseItemId: string;
    itemId: string;
    itemName: string;
    category: string;
    subcategory: string;
    itemGroup: string;
    itemType: string;
    itemUom: string;
    tax: string;
    itemDefaultprice: number;
    description: string;
    hsnCode: string;
    birthdayCake: boolean;
    uniqueQr: boolean;
    stockValidation: boolean;
    plateItem: boolean;
    includeTax: boolean;
    excludeTax: boolean;
    netPrice: number;
    taxPrice: number;
    finalPrice: number;
    status: string;
    createdDate: string | null;
  };
  variance: Record<string, {
    varianceImage: string | undefined;
    createdDate: string | null;
    itemType: string;
    itemCode: string;
    varianceName: string;
    variance_Defaultprice: number;
    variance_Uom: string;
    shelfLife: number;
    reorderLevel: number;
    sapCode: string;
    varianceStatus: string;
    branchwise: Record<string, any>;
  }>;
};


export interface Item {
  _id?: string;
  branchwiseItemId?: string;
  itemId?: string;
  itemCode?: string;
  name?: string;
  itemName?: string;
  category?: string;
  subCategory: string;
  itemGroup?: string;
  uom?: string;
  variance_Uom?: string;
  item_Uom?: string;
  tax?: string | number;
  price?: string | number;
  netPrice?: string | number;
  taxPrice?: string | number;
  finalPrice?: string | number;
  item_Defaultprice?: string | number;
  description?: string;
  itemType?: string;
  hsnCode?: string;
  measurementType?: string;
  reorderLevel?: string | number;
  shelfLife?: string | number;
  birthdayCake?: boolean;
  uniqueQr?: boolean;
  plateItem?: boolean;
  variances: Variance[];
  imageFile?: File;
  itemImage?: string;
  status?: string;
  varianceStatus?: string;
  includeTax?: boolean;
  excludeTax?: boolean;
  stockValidation?: boolean;
  varianceName?: string;
  variance_Defaultprice?: string | number;
  [key: string]: any;
}


export interface Variance {
  itemCode?: string;
  varianceName?: string;
  variance_Uom?: string;
  variance_Defaultprice?: number | string;
  shelfLife?: number | string;
  platPrice?: string | number;
  reorderLevel?: string | number;
  price?: string;
  sapCode?: string;
  birthdayCake?: boolean;
  uniqueQr?: boolean;
  varianceStatus?: string;
  createdDate?: string | null;
  updatedDate?: string | null;
  varianceImage?: string;
  varianceImageFile?: File;
  varianceImagePreview?: string;
  branchwise?: Record<string, { [key: string]: any }>;
  [key: string]: any;
}


export interface Variances {
  itemCode?: string;
  varianceName: string;
  category?: string;
  subCategory?: string;
  itemGroup?: string;
  variance_Uom: string;
  variance_Defaultprice: number | string;
  tax?: number;
  netPrice?: number | string;
  taxPrice?: number | string;
  finalPrice?: number | string;
  reorderLevel: number | string;
  shelfLife: number | string;
  sapCode: string;
  varianceStatus: string;
  hsnCode?: string | number;
  birthdayCake?: boolean;
  uniqueQr?: boolean;
  plateItem?: boolean;
  includeTax?: boolean;
  excludeTax?: boolean;
  branchwise?: Record<string, any>;
  uom?: string;
  price?: number;
}


export interface ApiResponse {
  data: Record<string, { item: Item; variance: Variance[] }>;
  total_pages: number;
}


export interface FetchDeactivatedItemsResponse {
  items: Item[];
  totalPages: number;
}

export interface FetchDeactivatedItemsParams {
  page: number;
  limit: number;
  itemName?: string;
}


// ── New: Fetch params for the two-stage variance master ──────────────────────
export interface FetchVariancesMasterParams {
  page?: number;
  limit?: number;
  search?: string;
}

export interface FetchVariancesByItemNameParams {
  item_name: string;
  page?: number;
  limit?: number;
}

export interface VariancesMasterResponse {
  items: VarianceMasterDetail[];
  total: number;
  pages: number;
}
// ─────────────────────────────────────────────────────────────────────────────


// ── Updated ItemState ─────────────────────────────────────────────────────────
export interface ItemState {
  items: Item[];
  deactivatedItems: Item[];
  itemGroups: ItemGroup[];
  categories: Category[];
  subcategories: subCategory[];
  taxes: Tax[];
  uoms: Uom[];
  inventory: Inventory[];
  orderTypes: OrderType[];
  branchOptions: string[];
  branchess: Branch[];

  // Existing variance master (flat list, used by combo search)
  variancesMaster: VarianceMaster[];

  // ── New: two-stage dropdown state ──────────────────────────────────────────
  // Stage 1: distinct item names for the item name dropdown
  itemNamesDropdown: string[];

  // Stage 2: variance details filtered by selected item name(s)
  variancesByItemName: VarianceMasterDetail[];
  // ───────────────────────────────────────────────────────────────────────────

  currentItem?: SingleItemResponse;
  loading: boolean;
  error: string | null;

  // Pagination
  totalPages: number;
  currentPage: number;
  itemsPerPage: number;

  // Infinite scroll helpers
  isFetchingItems: boolean;
  hasMoreItems: boolean;

  // UI state
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;

  dialogOpen: "none" | "add" | "edit";

  deactivatedTotalPages: number;
  deactivatedCurrentPage: number;
}


// ── Updated initialState ──────────────────────────────────────────────────────
export const initialState: ItemState = {
  items: [],
  deactivatedItems: [],
  itemGroups: [],
  categories: [],
  subcategories: [],
  taxes: [],
  uoms: [],
  inventory: [],
  orderTypes: [],
  branchOptions: [],
  branchess: [],
  variancesMaster: [],

  // ── New ──────────────────────────────────────────────────────────────────────
  itemNamesDropdown: [],
  variancesByItemName: [],
  // ─────────────────────────────────────────────────────────────────────────────

  loading: false,
  error: null,
  totalPages: 1,
  currentPage: 1,
  itemsPerPage: 30,
  isFetchingItems: false,
  hasMoreItems: true,
  snackbarOpen: false,
  snackbarMessage: '',
  searchQuery: '',
  showDeactivated: false,
  dialogOpen: "none",

  deactivatedTotalPages: 1,
  deactivatedCurrentPage: 1,
};


// ── Thunk param / response types (unchanged) ──────────────────────────────────

export interface FetchItemsParams {
  page: number;
  limit: number;
  itemName?: string;
}

export interface FetchItemsResponse {
  items: Item[];
  totalPages: number;
}

export interface DeleteItemParams {
  branchwiseItemId: string;
  page: number;
  limit: number;
  itemName?: string;
}

export interface DeleteVarianceParams {
  itemCode: string;
  page: number;
  limit: number;
  itemName?: string;
}

export interface ToggleItemStatusParams {
  branchwiseItemId: string;
  page: number;
  limit: number;
  itemName?: string;
}

export interface ToggleVarianceStatusParams {
  itemCode: string;
  page: number;
  limit: number;
  itemName?: string;
}

export interface UpdateVarianceParams {
  itemCode: string;
  updates: Partial<Variance>;
  page: number;
  limit: number;
  itemName?: string;
}

export interface UpdateItemParams {
  branchwiseItemId: string;
  updates: Partial<Item>;
  page: number;
  limit: number;
  itemName?: string;
}

export interface AddVarianceParams {
  varianceId: string;
  variance: Variance;
  page: number;
  limit: number;
  itemName?: string;
}