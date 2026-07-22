



export interface DineInTaxSplit {
  id?: number;
  taxcodeName: string;
  taxcodePercentage: number;
}

export interface DineInTax {
  id: string;
  DineInTaxName: string;
  DineInTaxPercentage: number;
  taxCode: string;
  taxSplitup?: DineInTaxSplit[];
  DineInhsnCode: number;
  status: string;
}

export interface DineInTaxState {
  items: DineInTax[];
  deactivatedItems: DineInTax[];
  loading: boolean;
  error: string | null;
  dineInTaxData: DineInTax;
  editIndex: number | null;
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;
}

export const initialDineInTax: DineInTax = {
  id: '',
  DineInTaxName: '',
  DineInTaxPercentage: 0,
  taxCode: '',
  taxSplitup: [],
  DineInhsnCode: 0,
  status: 'active',
};

export const dineInTaxInitialState: DineInTaxState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  error: null,
  dineInTaxData: initialDineInTax,
  editIndex: null,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  searchQuery: '',
  showDeactivated: false,
};