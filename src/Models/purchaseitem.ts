import { format } from "date-fns";
import { PurchaseItemSearchAdd } from "./purchaseModel";
import { Brand } from "@/app/yen-purchase/PurchaseMaster/Brands/Models/BrandModel";

export interface ImportPayload {
  file: File;
  mode: 'merge' | 'replace';
}

export interface BackupInfo {
  backup_id: string;
  created_at: string;
  purchase_count: number;
  master_count: number;
}

export interface RollbackResponse {
  message: string;
  purchase_items_restored: number;
  master_items_restored: number;
  backup_id: string;
}

export interface PurchaseItem {
  purchaseitemId: string;
  itemName: string;
  itemCode?: string;
  randomId: string;
  aliasName?: string;
  brandId?: string;
  brandName?: string;
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
  hsnCode: number | null;
  shelfLife: number | null;
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
  includeTax?: boolean;
  excludeTax?: boolean;
  finalPrice?: number;
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
  hsnCode: number | null;
  shelfLife: number | null;
  vendorTag: string[];
  barcode: number;
  description: string;
  status?: string;
  aliasName?: string;
  brandId?: string;
  includeTax?: boolean;
  excludeTax?: boolean;
  finalPrice?: number;
}

export interface ImportResponse {
  message: string;
  mode: string;
  inserted_count?: number;
  updated_count?: number;
  failed_count?: number;
  backup_id?: string;
  backup_created?: boolean;
  rollback_available?: boolean;
  rollback_performed?: boolean;
  successful?: Array<{ row: number; itemName: string; randomId: string; barcode: number; brandName?: string; aliasName?: string; shelfLife?: number }>;
  updated?: Array<{ row: number; itemName: string; action: string }>;
  failed?: Array<{ row: number; data: Record<string, string>; error: string; missingFields?: string[] }>;
  master_synced_count?: number;
  master_sync_results?: Array<any>;
  final_counters?: {
    pi_counter: number;
    ex_counter: number;
  };
  barcode_stats?: {
    "rawmaterial (PI)": {
      range: string;
      total_count: number;
      next_barcode: number;
    };
    "finished_goods (EX)": {
      range: string;
      total_count: number;
      next_barcode: number;
    };
  };
  restored?: {
    success: boolean;
    purchase_restored?: number;
    master_restored?: number;
    message?: string;
  };
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
  brands: Brand[];
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
  rollbackStatus: 'idle' | 'loading' | 'succeeded' | 'failed';
  rollbackError: string | null;
  backups: BackupInfo[];
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
  brands: [],
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
    aliasName: '',
    brandId: '',
    brandName: '',
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
    hsnCode: null,
    shelfLife: null,
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
    includeTax: false,
    excludeTax: true,
    finalPrice: 0,
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
  },
  rollbackStatus: 'idle',
  rollbackError: null,
  backups: []
};