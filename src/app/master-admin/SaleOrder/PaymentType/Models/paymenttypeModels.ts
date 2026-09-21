


// Interface for Payment Type
export interface PaymentType {
  paymentTypeId: string;
  paymentType: string;
  description: string;
  createdDate: Date | null;
  updatedDate: Date | null;
  status: string; // "active" or "inactive"
  editStatus: boolean;
}

// Interface for Payment Slice State
export interface PaymentState {
  items: PaymentType[];
  deactivatedItems: PaymentType[];
  loading: boolean;
  successMessage: string | null;
  error: string | null;
  searchQuery: string;
  snackbarOpen: boolean;
  snackbarMessage: string;
  paymentData: PaymentType;
  description:string;
  editPaymentTypeId: string | null;
  editIndex: number | null;
  dialogOpen: "none" | "edit" | "deactivated" | "add";
  showDeactivated: boolean;
}

// Initial State
export const initialPaymentState: PaymentType = {
  paymentTypeId: "",
  paymentType: "",
  description: "",
  createdDate: null,
  updatedDate: null,
  status: "active",
  editStatus: true ,
};

export const initialState: PaymentState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  successMessage: null,
  error: null,
  searchQuery: "",
  paymentData: initialPaymentState,
  description:"",
  editIndex: null,
  editPaymentTypeId: null,
  dialogOpen: "none",
  snackbarOpen: false,
  snackbarMessage: "",
  showDeactivated: false,
};
