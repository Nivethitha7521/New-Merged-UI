




// Types for Import Response
export interface ImportResponse {
  message: string;
  inserted_count: number;
  updated_count: number;
  errorCount: number;
  successful: Array<{
    row: number;
    branchName: string;
    locationId: string;
    assignedId: string;
  }>;
  updated: Array<{
    row: number;
    branchName: string;
    locationId: string;
    updatedFields: string[];
    changes: Record<string, any>;
  }>;
  failed: Array<{
    row: number;
    error: string;
    data: Record<string, any>;
  }>;
  duplicates: string[];
  max_id_number: number;
}

export interface ImportPayload {
  file: File;
  mode: 'import' | 'merge' | 'replace';
}



export interface Branch {
  branchName: string;
  aliasName: string;
}


// Export The API Fields
export interface Vehicle {
  id: string;
  vehicleId: string;
  vehicleName: string;
  vehicleModel: string;
  vehicleNo: string;
  fuelType: string;
  branchName: string;
  status: string;
}

// Define The Initial State
export interface VehicleState {
  items: Vehicle[];
  deactivatedItems: Vehicle[];
  branchOptions: Branch[];
  loading: boolean;
  error: string | null;
  vehicleData: Vehicle;
  editIndex: number | null;
  editVehicleId: string | null;
  dialogOpen: "none" | "add" | "edit" | "deactivated";
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;


  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

//Initial State Of API Fields
export const initialVehicle: Vehicle = {
  id: '',
  vehicleId: '',
  vehicleName: '',
  vehicleModel: '',
  vehicleNo: '',
  branchName: '',
  fuelType: '',
  status: 'active',
};

//Initial State 
export const initialState: VehicleState = {
  items: [],
  deactivatedItems: [],
  branchOptions: [],
  loading: false,
  error: null,
  vehicleData: initialVehicle,
  editIndex: null,
  editVehicleId: null,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  searchQuery: '',
  showDeactivated: false,

  total: 0,
  page: 1,
  limit: 15,
  totalPages: 0,
};