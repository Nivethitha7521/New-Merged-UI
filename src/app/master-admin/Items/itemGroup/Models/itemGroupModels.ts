




// Interface for itemGroup
export interface ItemGroup {
  id: string;
  itemGroupName: string;
  status: string;
  itemGroupId: string;
}


export interface ImportResponse {
  message: string;
  inserted_ids: string[];
  duplicates: string[];
  updated: Array<{ row: number; data: ItemGroup; message: string }>;
  failed: Array<{ row: number; data: ItemGroup; error: string; missingFields: string[] }>;
  errorCount: number;
  max_id_number: number;
}


// Interface for itemGroup Slice State
export interface itemGroupState {
  items: ItemGroup[];
  deactivatedItems: ItemGroup[];
  loading: boolean;
  error: string | null;
  itemGroupData: ItemGroup;
  editIndex: number | null;
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;
}

// Initial itemGroup
export const initialitemGroup: ItemGroup = {
  id: '',
  itemGroupName: '',
  status: 'active',
  itemGroupId: '',
};

// Initial State
export const initialState: itemGroupState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  error: null,
  itemGroupData: initialitemGroup,
  editIndex: null,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  searchQuery: '',
  showDeactivated: false,
};
