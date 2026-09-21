




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

// Interface for AddOn
export interface AddOn {
  id: string;
  addOn: string;
  value: number;
  status: string;
  addOnId: string;
  addOnItems: string[];
}


// Interface for AddOn Slice State
export interface AddOnState {
  items: AddOn[];
  deactivatedItems: AddOn[];
  product: BranchwiseItems[];
  loading: boolean;
  error: string | null;
  addOnData: AddOn;
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
export const initialAddOn: AddOn = {
  id: '',
  addOn: '',
  value: 0,
  status: 'active',
  addOnId: '',
  addOnItems: [],
};

export const initialState: AddOnState = {
  items: [],
  deactivatedItems: [],
  product: [],
  loading: false,
  error: null,
  addOnData: initialAddOn,
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