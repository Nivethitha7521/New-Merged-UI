


// Interface for Branch
export interface Branch {
branchName: string;
 }

// Interface for OpeningCash
export interface OpeningCash {
  systemOpenCashId: string;
  systemOpenCash: string;
  branches: string;
  createdDate: Date | null;
  updatedDate: Date | null;
  status: string;
}

// Interface for OpeningCash Slice State
export interface OpeningCashState {
  items: OpeningCash[];
  deactivatedItems: OpeningCash[];
  allBranches: string[]; 
  loading: boolean;
  error: string | null;
  openingCashData: OpeningCash;
  editIndex: number | null;
  dialogOpen: "none" | "edit" | "add";
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;
}

// Initial State
export const initialOpeningCash: OpeningCash = {
  systemOpenCashId: "",
  systemOpenCash: "",
  branches: "",
  createdDate: null,
  updatedDate: null,
  status: "active",
};

export const initialState: OpeningCashState = {
  items: [],
  deactivatedItems: [],
  allBranches: [],
  loading: false,
  error: null,
  openingCashData: initialOpeningCash,
  editIndex: null,
  dialogOpen: "none",
  snackbarOpen: false,
  snackbarMessage: "",
  searchQuery: "",
  showDeactivated: false,
};