

export interface TaxSplit {
  id?: number;
  taxcodeName: string;
  taxcodePercentage: number;
}

// Interface for tax
export interface Tax {
  id: string;
  taxName: string;
  taxPercentage: number;
  taxCode: string;
  taxSplitup?: TaxSplit[];
  status: string;
  taxId: string;
}

// Interface for tax Slice State
export interface taxState {
  items: Tax[];
  deactivatedItems: Tax[];
  loading: boolean;
  error: string | null;
  taxData: Tax;
  editIndex: number | null;
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;
}

// Initial tax
export const initialtax: Tax = {
  id: '',
  taxName: '',
  taxPercentage: 0,
  taxCode: "",
  taxSplitup: [],
  status: 'active',
  taxId: '',
};

// Initial State
export const initialState: taxState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  error: null,
  taxData: initialtax,
  editIndex: null,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  searchQuery: '',
  showDeactivated: false,
};
