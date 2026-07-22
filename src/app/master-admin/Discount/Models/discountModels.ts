
// Interface for Discount
export interface Discount {
  id: string;
  discountName: string;
  discountId: string;
  discountPercentage: string;
  saleTypeDiscount: string;
  status: string;
}

// Interface for Discount Slice State
export interface DiscountState {
  items: Discount[];
  deactivatedItems: Discount[];
  loading: boolean;
  error: string | null;
  discountData: Discount;
  editIndex: number | null;
  dialogOpen: "none" | "edit" | "add" | "deactivated";
  snackbarOpen: boolean;
  snackbarMessage: string;
  searchQuery: string;
  showDeactivated: boolean;
}

// Initial Discount
export const initialDiscount: Discount = {
  id: "",
  discountName: "",
  discountId: "",
  discountPercentage: "",
  saleTypeDiscount: "",
  status: "active",
};

// Initial State
export const initialState: DiscountState = {
  items: [],
  deactivatedItems: [],
  loading: false,
  error: null,
  discountData: initialDiscount,
  editIndex: null,
  dialogOpen: "none",
  snackbarOpen: false,
  snackbarMessage: "",
  searchQuery: "",
  showDeactivated: false,
};