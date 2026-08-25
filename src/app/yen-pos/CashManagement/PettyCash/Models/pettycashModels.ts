




// Interface for PettyCash
export interface PettyCash {
  pettyCashId: string;
  pettyCash: string;
  branches: string;
  createdDate: Date | null;
  updatedDate: Date | null;
  status: string; // "active" or "deactivated"
}

// Interface for Branch
export interface Branch {
  branchName: string;
}

// Interface for PettyCash Slice State
export interface PettyCashState {
  items: PettyCash[];
  deactivatedItems: PettyCash[];
  allBranches: string[];
  loading: boolean;
  error: string | null;
  pettyCashData: PettyCash;
  editIndex: number | null;
  searchQuery: string;
  dialogOpen: "none" | "edit" | "add";
  snackbarOpen: boolean;
  snackbarMessage: string;
  showDeactivated: boolean;
}

// Initial State for a single PettyCash object
export const initialPettyCash: PettyCash = {
  pettyCashId: "",
  pettyCash: "",
  branches: "",
  createdDate: null,
  updatedDate: null,
  status: "active",
};

// Initial State for the slice
export const initialState: PettyCashState = {
  items: [],
  deactivatedItems: [],
  allBranches: [],
  loading: false,
  error: null,
  pettyCashData: initialPettyCash,
  editIndex: null,
  searchQuery: "",
  dialogOpen: "none",
  snackbarOpen: false,
  snackbarMessage: "",
  showDeactivated: false,
};