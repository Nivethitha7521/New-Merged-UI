

export interface FetchMixboxArgs {
  page?: number;
  limit?: number;
  search?: string;
}

export interface FetchMixboxResponse {
  results: BranchwiseItems[];
  totalPages: number;
  currentPage: number;
}

// Interface for MixBox
export interface MixBox {
  id: string;
  mixboxName: string;
  totalGrams: string;
  items: Item[];
  status: string;
}
// Interface for Item
export interface Item {
  item_name: string;
  uom: string;
  grams: number;
}

export interface BranchwiseItems {
  // subCategory: string;
  // category: string;
  varianceName: string;
  variance_Uom: string;
  //variance_Defaultprice?: number;
}

export interface MixBoxState {
  items: MixBox[];
  deactivatedItems: MixBox[];
  product: BranchwiseItems[];
  loading: boolean;
  error: string | null;
  mixBoxData: MixBox;
  editIndex: number | null;
  dialogOpen: "none" | "edit" | "add" | "deactivated";
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;

  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  isFetchingItems: boolean;
  hasMoreItems: boolean;
}

// Initial MixBox
export const initialMixBox: MixBox = {
  id: "",
  mixboxName: "",
  totalGrams: "",
  items: [],
  status: "active",
};

// Initial State
export const initialState: MixBoxState = {
  items: [],
  deactivatedItems: [],
  product: [],
  loading: false,
  error: null,
  mixBoxData: initialMixBox,
  editIndex: null,
  dialogOpen: "none",
  snackbarOpen: false,
  snackbarMessage: "",
  searchQuery: "",
  showDeactivated: false,
  currentPage: 1,
  totalPages: 1,
  itemsPerPage: 50,
  isFetchingItems: false,
  hasMoreItems: true,
};