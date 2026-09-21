

// Interfaces 
export interface BranchwiseItem {
  category: string;
}

export interface BranchwiseItemSub {
  subcategory: string;
}

export interface BranchwiseItemS {
  subcat: string;
  category: string;
}

export interface BranchwiseItems {
  subCategory?: string;
  category: string;
  varianceName: string;
  variance_Defaultprice?: number;
}

export interface BranchwiseItemVariance {
  varianceName: string;
  variance_Defaultprice?: number;
}

export interface dynamicData {
  dynamicDataId: string;
  itemName: string;
  Defaultprice: number;
  percentage: number;
  partnerPrice: number;
  status: string;
  partnerId: string;
  assignedPartners?: string[];
  deactivateAssignedPartners?: string[];
}

export interface partnerPost {
  itemName: string;
  Defaultprice: number;
  percentage: number;
  partnerPrice: number;
  status: string;
  description?: string;
}

export interface onlinePartners {
  onlinePartnersId: string;
  partnerName: string;
}

export interface OnlinePartnerTemplate {
  onlinePartnerTemplateId: string;
  itemName: string;
  Defaultprice: number;
  percentage: number;
  partnerPrice: number;
  status: string;
  assignedPartners: string[];
  deactivateAssignedPartners: string[];
}


// export interface ImportResponse {
//   failed: never[];
//   updated: never[];
//   successful: never[];
//   imported_ids: string[];
//   duplicates: string[];
//   data: OnlinePartnerTemplate[] | dynamicData[];
// }


export interface ImportResponse {
  success: boolean;
  message: string;
  imported_ids: string[];
  imported_count: number;
  duplicates: string[];
  duplicates_count: number;
  partner_updates: any[];
  errors: Array<{
    row: number;
    column: string;
    value: string;
    error: string;
    severity: string;
  }>;
  errors_count: number;
  error_summary: {
    total_errors: number;
    total_warnings: number;
  };
  successful?: Array<{ row: number; data: Record<string, string> }>;
  updated?: Array<{ row: number; data: Record<string, string>; error?: string }>;
  data?: OnlinePartnerTemplate[] | dynamicData[];
}

export interface OnlinePartnerTemplateState {
  items: OnlinePartnerTemplate[];
  deactivatedItems: OnlinePartnerTemplate[];
  dynamic: dynamicData[];
  deactivatedDynamic: dynamicData[];
  category: BranchwiseItem[];
  subCategory: BranchwiseItemSub[];
  allSubCategories: BranchwiseItemS[];
  filteredSubCategories: BranchwiseItemS[];
  product: BranchwiseItems[];
  partner: onlinePartners[];
  loading: boolean;
  error: string | null;
  templateData: OnlinePartnerTemplate | dynamicData;
  editIndex: number | null;
  dialogOpen: "add" | "edit" | "none";
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;
  currentPage: number;
  totalPages: number;
  itemsPage: number;
  itemsTotalPages: number;
  itemsPerPage: number;
  isFetchingItems: boolean;
  hasMoreItems: boolean;
}

export const initialPartnerTemplate: OnlinePartnerTemplate = {
  onlinePartnerTemplateId: "",
  itemName: "",
  Defaultprice: 0,
  percentage: 0,
  partnerPrice: 0,
  status: "active",
  assignedPartners: [],
  deactivateAssignedPartners: [],
};

export const initialDynamicData: dynamicData = {
  dynamicDataId: "",
  itemName: "",
  Defaultprice: 0,
  percentage: 0,
  partnerPrice: 0,
  status: "active",
  partnerId: "",
};

export const initialState: OnlinePartnerTemplateState = {
  items: [],
  deactivatedItems: [],
  dynamic: [],
  deactivatedDynamic: [],
  category: [],
  subCategory: [],
  allSubCategories: [],
  filteredSubCategories: [],
  product: [],
  partner: [],
  loading: false,
  error: null,
  templateData: initialPartnerTemplate,
  editIndex: null,
  dialogOpen: "none",
  snackbarOpen: false,
  snackbarMessage: "",
  searchQuery: "",
  showDeactivated: false,
  currentPage: 1,
  totalPages: 1,
  itemsPage: 1,
  itemsTotalPages: 1,
  itemsPerPage: 50,
  isFetchingItems: false,
  hasMoreItems: true,
};