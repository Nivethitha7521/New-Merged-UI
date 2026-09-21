

export interface Branch {
      branchName: string;
 }

export interface AdvanceAmount {
  amountId: string;
//  name: string;
  createdDate: Date | null;
  updatedDate: Date | null;
  percentage: string;
  //remarks: string;
  status: string;
  branches: string;
}

export interface AdvanceAmountState {
  items: AdvanceAmount[];
  deactivatedItems: AdvanceAmount[];
  allBranch: string[];
  loading: boolean;
  error: string | null;
  advanceAmountData: AdvanceAmount;
  editIndex: number | null;
  dialogOpen: "none" | "edit" | "add";
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;
}

export const initialAdvanceAmount: AdvanceAmount = {
  amountId: "",
//  name: "",
  createdDate: null,
  updatedDate: null,
  percentage: "",
//  remarks: "",
  status: "active",
  branches: "",
};

export const initialState: AdvanceAmountState = {
  items: [],
  deactivatedItems: [],
  allBranch: [],
  loading: false,
  error: null,
  advanceAmountData: initialAdvanceAmount,
  editIndex: null,
  dialogOpen: "none",
  snackbarOpen: false,
  snackbarMessage: "",
  searchQuery: "",
  showDeactivated: false,
};