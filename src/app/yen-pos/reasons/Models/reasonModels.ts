


// Interface for Reasons Type (mirrors backend `Reasons` model)
export interface Reasons {
  id: string;
  module: string;
  reason: string[];
  createdDate: Date | null;
  updatedDate: Date | null;
  creatBy: string;
  status: string;
}

// Interface for Reasons Slice State
export interface ReasonState {
  reasons: Reasons[];
  deactivatedReasons: Reasons[];
  loading: boolean;
  successMessage: string | null;
  error: string | null;
  searchQuery: string;
  snackbarOpen: boolean;
  snackbarMessage: string;
  reasonData: Reasons;
  editReasonId: string | null;
  editIndex: number | null;
  dialogOpen: "none" | "edit" | "deactivated" | "add";
  showDeactivated: boolean;
}

// Initial single-record state
export const initialReasonState: Reasons = {
  id: "",
  module: "",
  reason: [],
  createdDate: null,
  updatedDate: null,
  creatBy: "",
  status: "active",
};

// Initial Slice State
export const initialState: ReasonState = {
  reasons: [],
  deactivatedReasons: [],
  loading: false,
  successMessage: null,
  error: null,
  searchQuery: "",
  reasonData: initialReasonState,
  editIndex: null,
  editReasonId: null,
  dialogOpen: "none",
  snackbarOpen: false,
  snackbarMessage: "",
  showDeactivated: false,
};