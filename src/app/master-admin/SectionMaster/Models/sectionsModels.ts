




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



export interface Sections {
  id: string;
  sectionsName: string;
  aliasName: string;
  status: string;
  sectionsId: string;
  address: string;
  // country: string | null;
  // state: any | null;
  // city: string | null;
  // postalCode: any | null;
  // phoneNumber: any | null;
  // email: string | null;
  // latitude: any | null;
  // longitude: any | null;
  // description: string | null;
  // openingHours: any | null;
  // managerName: string | null;
  // managerContact: any | null;
  createdDate: Date | null;
  lastUpdatedDate: Date | null;
  code: string;
  location: string;
  //  Section: string | null;
  createdBy: string;
}

export const initialSections: Sections = {
  id: '',
  sectionsName: '',
  aliasName: "",
  status: 'active',
  sectionsId: '',
  address: '',
  // country: null,
  // state: null,
  // city: null,
  // postalCode: null,
  // phoneNumber: null,
  // email: null,
  // latitude: null,
  // longitude: null,
  // description: null,
  // openingHours: null,
  // managerName: null,
  // managerContact: null,
  createdDate: null,
  lastUpdatedDate: null,
  code: '',
  location: '',
  //  Section: '',
  createdBy: "",
};


export interface SectionsState {
  items: Sections[];
  deactivatedItems: Sections[];
  loading: boolean;
  error: string | null;
  sectionsData: Sections;
  editIndex: number | null;
  dialogOpen: 'none' | 'edit' | 'add';
  snackbarOpen: boolean;
  snackbarMessage: string;
  snackbarSeverity: 'success' | 'error' | 'info';
  searchQuery: string;
  showDeactivated: boolean;
  selectedSectionId: string | null;
  actionType: 'deactivate' | 'activate' | null;
  confirmationDialogOpen: boolean;
  editConfirmationDialogOpen: boolean;
  closeConfirmationDialogOpen: boolean;

  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const initialState: SectionsState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  error: null,
  sectionsData: initialSections,
  editIndex: null,
  dialogOpen: 'none',
  snackbarOpen: false,
  snackbarMessage: '',
  snackbarSeverity: 'info',
  searchQuery: '',
  showDeactivated: false,
  selectedSectionId: null,
  actionType: null,
  confirmationDialogOpen: false,
  editConfirmationDialogOpen: false,
  closeConfirmationDialogOpen: false,

  total: 0,
  page: 1,
  limit: 30,
  totalPages: 0,
};