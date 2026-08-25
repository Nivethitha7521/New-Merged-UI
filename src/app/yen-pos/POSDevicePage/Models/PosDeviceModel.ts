



export interface Aliases {
  branchId: string;
  branchName: string;
  aliasName: string;
}


export interface Device {
  id: string;
  tillId: string;
  companyName: string;
  deviceCode: string;
  deviceName: string;
  branchName: string;
  aliasName: string;
  description: string;
  createdBy: string;
  updatedBy: string;
  createdDate: Date | null;
  updatedDate: Date | null;
  dcStatus: string;
  isServer: boolean;
  status: string;
  deviceCodeId: string;

}


export interface PosDeviceState {
  devices: Device[];
  deactivatedDevices: Device[];
  branches: Aliases[];
  loading: boolean;
  error: string | null;
  deviceData: Device;
  editIndex: number | null;
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;

  total: number;
  page: number;
  limit: number;
  totalPages: number;

  // In PosDeviceState interface
  serverConflict: {
    existingDevice: Device | null;
    pendingSubmit: (() => void) | null;
  } | null;
}



export interface PaginatedDeviceResponse {
  data: Device[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}


// Initial tax
export const initialdevice: Device = {
  id: '',
  tillId: '',
  companyName: '',
  deviceCode: "",
  deviceName: '',
  branchName: '',
  aliasName: '',
  description: '',
  createdBy: '',
  updatedBy: '',
  isServer: false,
  createdDate: null,
  updatedDate: null,
  dcStatus: 'active',
  status: 'active',
  deviceCodeId: '',

};

export const initialState: PosDeviceState = {
  devices: [],
  deactivatedDevices: [],
  branches: [],
  loading: false,
  error: null,
  deviceData: initialdevice,
  editIndex: null,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  searchQuery: '',
  showDeactivated: false,

  total: 0,
  page: 1,
  limit: 15,
  totalPages: 0,

  // In initialState
  serverConflict: null,
};
