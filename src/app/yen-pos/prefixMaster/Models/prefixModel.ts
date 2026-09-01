







export interface prefix {
  id: string;
  invoicePrefix: string ;
  status: string;
  invoicePrefixId: string;
}

export interface PrefixState {
  items: prefix[];
  deactivatedItems: prefix[];
  loading: boolean;
  error: string | null;
  PrefixData: prefix;
  editIndex: number | null;
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;
}

export const initialPrefix: prefix = {
  id: '',
  invoicePrefix: '',
  status: 'active',
  invoicePrefixId: "",
};

export const initialState: PrefixState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  error: null,
  PrefixData: initialPrefix,
  editIndex: null,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  searchQuery: '',
  showDeactivated: false,
};