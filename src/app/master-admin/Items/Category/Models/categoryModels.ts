



export interface FetchSubcatArgs {
  search: string;
  page?: number;
  limit?: number;
}

export interface FetchSubcatResponse {
  results: Subcategory[];
  totalPages: number;
  currentPage: number;
}

// Interface for Subcategory
export interface Subcategory {
  id: string;
  subCategoryName: string;
}

// Interface for Category
export interface Category {
  id: string;
  categoryName: string;
  subCategory: string[];
  status: string;
  categoryId: string;
}


// Interface for Category Post (for creation)
export interface CategoryPost {
  categoryName: string;
  subCategory: string[];
  status: string;
}

// Interface for Category Slice State
export interface CategoryState {
  items: Category[];
  deactivatedItems: Category[];
  allSubcategories: Subcategory[];
  loading: boolean;
  error: string | null;
  categoryData: Category;
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


  total: number;
  page: number;
  limit: number;
  totalPage: number;
}



// Types for Import Response
export interface ImportResponse {
  message: string;
  inserted_count: number;
  updated_count: number;
  errorCount: number;
  successful: Array<{
    row: number;
    branchName: string;
    locationId: string;
    assignedId: string;
  }>;
  updated: Array<{
    row: number;
    branchName: string;
    locationId: string;
    updatedFields: string[];
    changes: Record<string, any>;
  }>;
  failed: Array<{
    row: number;
    error: string;
    data: Record<string, any>;
  }>;
  duplicates: string[];
  max_id_number: number;
}

export interface ImportPayload {
  file: File;
  mode: 'import' | 'merge' | 'replace';
}


// Initial Category
export const initialCategory: Category = {
  id: "",
  categoryName: "",
  subCategory: [],
  status: "active",
  categoryId: "",
};

// Initial State
export const initialState: CategoryState = {
  items: [],
  deactivatedItems: [],
  allSubcategories: [],
  loading: false,
  error: null,
  categoryData: initialCategory,
  dialogOpen: "none",
  snackbarOpen: false,
  snackbarMessage: "",
  searchQuery: "",
  showDeactivated: false,



  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 30,
  isFetchingItems: false,
  hasMoreItems: true,

  total: 0,
  page: 1,
  limit: 15,
  totalPage: 0,
};