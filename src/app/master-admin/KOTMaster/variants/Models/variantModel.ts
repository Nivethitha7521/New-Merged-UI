




export interface FetchItemsArgs {
  search: string;
  page?: number;
  limit?: number;
}

export interface FetchItemsResponse {
  results: BranchwiseItems[];
  totalPages: number;
  currentPage: number;
}


export interface BranchwiseItems {
  varianceName: string;
}

// Interface for variant
export interface variant {
  id: string;
  variant: string;
  variantItems: string[];
  status: string;
  variantId: string;
}

// Interface for variant Slice State
export interface variantState {
  items: variant[];
  deactivatedItems: variant[];
  product: BranchwiseItems[];
  loading: boolean;
  error: string | null;
  variantData: variant;
  editIndex: number | null;
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  isFetchingItems: boolean;
  hasMoreItems: boolean;
}

// Initial State
export const initialvariant: variant = {
  id: '',
  variant: '',
  variantItems: [],
  status: 'active',
  variantId: '',
};

export const initialState: variantState = {
  items: [],
  deactivatedItems: [],
  product: [],
  loading: false,
  error: null,
  variantData: initialvariant,
  editIndex: null,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  searchQuery: '',
  showDeactivated: false,
  currentPage: 1,
  totalPages: 1,  
  itemsPerPage: 50,
  isFetchingItems: false,
  hasMoreItems: true,
};
