






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



export interface Uom {
  uomId: string;
  measurementType: string;
  uom: string;
  status: string;
}

// Interface for SFG
export interface SFG {
  id: string;
  sfgName: string;
  price: number;
  uom: string;
  sfgCode: string;
  shelfLife: number;
  createdDate: Date | null;
  updatedDate: Date | null;
  status: string;
}



// Interface for SFG Slice State
export interface SFGState {
  items: SFG[];
  deactivatedItems: SFG[];
  uoms: Uom[];
  loading: boolean;
  error: string | null;
  sfgData: SFG;
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

// Initial SFG
export const initialSFG: SFG = {
  id: '',
  sfgName: '',
  price: 0,
  uom: "",
  sfgCode: "",
  shelfLife: 0,
  createdDate: null,
  updatedDate: null,
  status: 'active',
};

// Initial State
export const initialState: SFGState = {
  items: [],
  deactivatedItems: [],
  uoms: [],
  loading: false,
  error: null,
  sfgData: initialSFG,
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
