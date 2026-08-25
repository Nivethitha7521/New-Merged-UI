



export interface TablePosition {
  tableNumber: string;
  seats: number;
  position?: { x: number; y: number } | null;
}


export interface Area {
  name: string;
  count: number;
}


export interface EditValidationErrors {
  newAreaName: string;
  newAreaCount: string;
}


export interface TableMasterData {
  _id?: string;
  locationName: string;
  type: string;
  tableCount: number;
  areaName?: string;
  areaCount?: number;
  areas: { name: string; count: number }[];
  tableNumber?: string;
  customTableName?: string;
}

export interface ValidationErrors {
  locationName: string;
  type: string;
  tableCount: string;
  areaName: string;
  areaCount: string;
}

export interface LocationErrors {
  locationName: string | null;
}



// Interface for Branch
export interface Branch {
  branchId: string;
  branchName: string;
  aliasName: string;
}

// Interface for Table
export interface TableData {
  _id: string;
  location?: string;
  seats: number;
  seatDetails?: string[];
  areaName?: string;
  tableNumber: string;
  status?: string;
  customTableName?: string;
}

// Interface for Table Slice State
export interface TableState {
  status: string;
  tables: any[];
  deactivatedTables: any[];
  deactivatedBranch: Branch[];
  loading: boolean;
  error: string | null;
  currentTable: {
    customTableName: string;
    tableId: string;
    type: string;
    tableName: string;
    tableCount: number;
    locationName: string;
    areas: { name: string; count: number }[];
    areaName?: string;
    areaCount?: number;
  };
  allBranch: Branch[];
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  showDeactivated: boolean;
}

// Initial Table
export const initialTable: TableData = {
  _id: '',
  location: '',
  seats: 4,
  seatDetails: [],
  areaName: '',
  tableNumber: '',
  status: 'active',
};

// Initial Current Table
export const initialCurrentTable = {
  tableId: '',
  type: 'predefined',
  tableName: '',
  tableCount: 0,
  locationName: '',
  areas: [],
  areaName: '',
  areaCount: 0,
  customTableName: '',
};

// Initial State
export const initialState: TableState = {
  tables: [],
  deactivatedTables: [],
  deactivatedBranch: [],
  loading: false,
  error: null,
  currentTable: initialCurrentTable,
  allBranch: [],
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  showDeactivated: false,
  status: ''
};