





// Interface for Charges Type
export interface Charges {
    chargeId: string;
    chargeType: string;
    createdDate: Date | null;
    updatedDate: Date | null;
    createdBy: string;
    status: string;
}

// Interface for Charges Slice State
export interface ChargeState {
  charge: Charges[];
  deactivatedcharge: Charges[];
  loading: boolean;
  successMessage: string | null;
  error: string | null;
  searchQuery: string;
  snackbarOpen: boolean;
  snackbarMessage: string;
  chargeData: Charges;
  description:string;
  editchargeId: string | null;
  editIndex: number | null;
  dialogOpen: "none" | "edit" | "deactivated" | "add";
  showDeactivated: boolean;
}

// Initial State
export const initialChargeState: Charges = {
  chargeId: "",
  chargeType: "",
  createdDate: null,
  updatedDate: null,
  createdBy: '',
  status: "active",
};

export const initialState: ChargeState = {
  charge: [],
  deactivatedcharge: [],
  loading: false,
  successMessage: null,
  error: null,
  searchQuery: "",
  chargeData: initialChargeState,
  description:"",
  editIndex: null,
  editchargeId: null,
  dialogOpen: "none",
  snackbarOpen: false,
  snackbarMessage: "",
  showDeactivated: false,
};
