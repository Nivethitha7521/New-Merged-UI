export interface OrderType {
  id: string;
  orderTypeName: string;
  status: string;
  orderTypeId: string;
  editStatus: boolean;
}

export interface OrderTypeState {
  items: OrderType[];
  deactivatedItems: OrderType[];
  loading: boolean;
  error: string | null;
  orderTypeData: OrderType;
  editIndex: number | null;
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;
}

export const initialOrderType: OrderType = {
  id: '',
  orderTypeName: '',
  status: 'active',
  orderTypeId: "",
  editStatus: true,
};

export const initialState: OrderTypeState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  error: null,
  orderTypeData: initialOrderType,
  editIndex: null,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  searchQuery: '',
  showDeactivated: false,
};