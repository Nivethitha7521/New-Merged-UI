export interface Brand {
  mongoId: string;      // MongoDB ObjectId as string
  brandId: string;      // Sequential ID like BR001
  brandName: string;
  status: string;
  createdDate?: string;
  lastUpdatedDate?: string;
  createdBy?: string;
  editedBy?: string;
}

export interface ImportResult {
  message?: string;
  inserted_count?: number;
  updated_count?: number;
  successful?: Array<{ row: number; data: Record<string, string> }>;
  updated?: Array<{ row: number; data: Record<string, string>; error?: string }>;
  failed?: Array<{ row: number | string; data: Record<string, string>; error: string; missingFields?: string[] }>;
  errorCount?: number;
  detail?: { message: string; missing?: string[]; required?: string[] };
}

export interface BrandState {
  items: Brand[];
  deactivatedItems: Brand[];
  loading: boolean;
  importing: boolean;
  exporting: boolean;
  importSuccess: boolean;
  exportSuccess: boolean;
  importError: string | null;
  exportError: string | null;
  importResult: ImportResult | null;
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  editIndex: number | null;
  dialogOpen: 'none' | 'edit' | 'deactivated';
  showDeactivated: boolean;
  showImportResultDialog: boolean;
  brandData: Brand;
}

export const initialState: BrandState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  importing: false,
  exporting: false,
  importSuccess: false,
  exportSuccess: false,
  importError: null,
  exportError: null,
  importResult: null,
  snackbarOpen: false,
  snackbarMessage: '',
  searchQuery: '',
  editIndex: null,
  dialogOpen: 'none',
  showDeactivated: false,
  showImportResultDialog: false,
  brandData: {
    mongoId: '',
    brandId: '',
    brandName: '',
    status: 'active',
  },
};