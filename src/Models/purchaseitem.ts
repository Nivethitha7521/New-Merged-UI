import { format } from "date-fns";
import { PurchaseItemSearchAdd } from "./purchaseModel";

export interface ImportPayload {
  file: File;
  mode: 'merge' | 'replace' | 'rollback';
}

export interface PurchaseItem {
  purchaseitemId: string;
  itemName: string;
  itemCode?: string;
  randomId: string;
  purchasecategoryId: string;
  purchasesubcategoryId: string;
  itemgroupId: string;
  uomId: string;
  taxId: string;
  itemTypeId: string;
  locationId: string;
  stockQuantity: number;
  supplier: string;
  purchasePrice: number;
  sellingPrice?: number;
  saleType: boolean;
  reorderLevel: number;
  hsnCode: string;
  shelfLife: string;
  vendorTag: string[];
  barcode: number;
  description: string;
  status: string;
  createdDate: Date | null;
  lastUpdatedDate: Date | null;
  purchasecategoryName?: string;
  purchasesubcategoryName?: string;
  itemgroupName?: string;
  uom?: string;
  taxPercentage?: number;
  taxName?: string;
  itemType?: string;
  locationName?: string;
}

export interface PurchaseItemPost {
  itemName: string;
  itemCode?: string;
  purchasecategoryId: string;
  purchasesubcategoryId: string;
  itemgroupId: string;
  uomId: string;
  taxId: string;
  itemTypeId: string;
  locationId: string;
  stockQuantity: number;
  supplier: string;
  purchasePrice: number;
  sellingPrice?: number;
  saleType: boolean;
  reorderLevel: number;
  hsnCode: string;
  shelfLife: string;
  vendorTag: string[];
  barcode: number;
  description: string;
  status?: string;
}

export interface ImportResponse {
  message: string;
  inserted_count?: number;
  updated_count?: number;
  backup_count?: number;
  mode: string;
  successful?: Array<{ row: number; data: Record<string, string> }>;
  updated?: Array<{ row: number; data: Record<string, string>; error?: string }>;
  failed?: Array<{ row: number; data: Record<string, string>; error: string; missingFields: string[] }>;
  errorCount?: number;
}

export interface PurchaseItemSearch {
  purchaseitemId: string;
  itemName: string;
}

export interface SearchResponse {
  total: number;
  items: PurchaseItemSearchAdd[];
}

export const formatDateTime = (date: Date): string => {
  return format(date, "dd:MM:yyyy hh:mm a");
};

export interface UOM {
  uomId: string;
  uom: string;
  status: string;
}

export interface Tax {
  taxId: string;
  taxPercentage: number;
  taxName: string;
  status: string;
}

export interface StorageLocationItem {
  locationId: string;
  locationName: string;
  status?: string;
  randomId?: string;
}

export interface PurchaseGroupItem {
  itemgroupId: string;
  itemgroupName: string;
  status?: string;
  randomId?: string;
}

export interface PurchaseItemType {
  itemtypeId: string;
  itemtypeName: string;
  randomId: string;
  variance_Defaultprice?: number;
}

export interface PurchaseCategory {
  purchasecategoryId: string;
  purchasecategoryName: string;
  randomId?: string;
  subcategories: Array<{
    purchasesubcategoryId: string;
    purchasesubcategoryName: string;
    randomId: string;
  }>;
  status?: string;
}

export interface Vendor {
  vendorId: string;
  vendorName: string;
}

export interface PurchaseItemState {
  items: PurchaseItem[];
  deactivatedItems: PurchaseItem[];
  loading: boolean;
  successMessage: string | null;
  error: string | null;
  searchQuery: string;
  categories: PurchaseCategory[];
  uoms: UOM[];
  taxes: Tax[];
  locations: StorageLocationItem[];
  groupitems: PurchaseGroupItem[];
  itemtypes: PurchaseItemType[];
  vendors: Vendor[];
  snackbarOpen: boolean;
  snackbarMessage: string;
  editIndex: number | null;
  dialogOpen: 'none' | 'edit' | 'deactivated';
  showDeactivated: boolean;
  itemData: PurchaseItem;
  itemToActivate: PurchaseItem | null;
  deactivateDialogOpen: boolean;
  activateDialogOpen: boolean;
  itemToDeactivate: PurchaseItem | null;
  tags: string[];
  currentPage: number;
  pageSize: number;
  totalItems: number;
  importStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  exportStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  exportError: string | null;
  filters: {
    itemName: string;
    purchasecategoryName: string;
    purchasesubcategoryName: string;
  };
  importError: string | null;
  importMessage: string | null;
  importResults: {
    successful: Array<{ row: number; data: Record<string, string> }>;
    updated: Array<{ row: number; data: Record<string, string>; error?: string }>;
    failed: Array<{ row: number; data: Record<string, string>; error: string; missingFields: string[] }>;
  };
}

export const initialState: PurchaseItemState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  successMessage: null,
  error: null,
  searchQuery: '',
  categories: [],
  uoms: [],
  taxes: [],
  locations: [],
  groupitems: [],
  itemtypes: [],
  vendors: [],
  snackbarOpen: false,
  snackbarMessage: '',
  editIndex: null,
  dialogOpen: 'none',
  showDeactivated: false,
  itemToActivate: null,
  deactivateDialogOpen: false,
  activateDialogOpen: false,
  itemToDeactivate: null,
  tags: [],
  currentPage: 1,
  pageSize: 50,
  totalItems: 0,
  itemData: {
    purchaseitemId: '',
    itemName: '',
    purchasecategoryId: '',
    purchasesubcategoryId: '',
    itemgroupId: '',
    uomId: '',
    taxId: '',
    itemTypeId: '',
    locationId: '',
    randomId: '',
    stockQuantity: 0,
    supplier: '',
    purchasePrice: 0,
    sellingPrice: 0,
    saleType: false,
    reorderLevel: 0,
    hsnCode: '',
    shelfLife: '',
    vendorTag: [],
    barcode: 0,
    description: '',
    status: '',
    createdDate: null,
    lastUpdatedDate: null,
    purchasecategoryName: '',
    purchasesubcategoryName: '',
    itemgroupName: '',
    uom: '',
    taxPercentage: 0,
    taxName: '',
    itemType: '',
    locationName: '',
  },
  exportStatus: 'idle',
  exportError: null,
  filters: {
    itemName: '',
    purchasecategoryName: '',
    purchasesubcategoryName: ''
  },
  importError: null,
  importMessage: null,
  importStatus: 'idle',
  importResults: {
    successful: [],
    updated: [],
    failed: []
  }
};