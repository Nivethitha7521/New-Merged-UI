

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



// Interface for SubCategory
export interface SubCategory {
  id: string;
  subCategoryName: string;
  status: string;
  subCategoryId: string;
}

// Interface for SubCategory Slice State
export interface SubCategoryState {
  items: SubCategory[];
  deactivatedItems: SubCategory[];
  loading: boolean;
  error: string | null;
  subCategoryData: SubCategory;
  editIndex: number | null;
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;


  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Initial SubCategory
export const initialSubCategory: SubCategory = {
  id: '',
  subCategoryName: '',
  status: 'active',
  subCategoryId: '',
};

// Initial State
export const initialState: SubCategoryState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  error: null,
  subCategoryData: initialSubCategory,
  editIndex: null,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  searchQuery: '',
  showDeactivated: false,

  total: 0,
  page: 1,
  limit: 30,
  totalPages: 0,
};
