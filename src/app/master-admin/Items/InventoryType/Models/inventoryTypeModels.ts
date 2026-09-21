



export interface Inventory {
  id: string;
  inventoryType: string ;
  directSale: boolean;
  status: string;
  inventoryId: string;
}

export interface InventoryState {
  items: Inventory[];
  deactivatedItems: Inventory[];
  loading: boolean;
  error: string | null;
  inventoryTypeData: Inventory;
  editIndex: number | null;
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;
}

export const initialInventory: Inventory = {
  id: '',
  inventoryType: '',
  directSale: false,
  status: 'active',
  inventoryId: "",
};

export const initialState: InventoryState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  error: null,
  inventoryTypeData: initialInventory,
  editIndex: null,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  searchQuery: '',
  showDeactivated: false,
};