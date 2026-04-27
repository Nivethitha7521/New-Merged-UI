export interface PaymentHistory {
  amount: number;
  paymentDate: string;
  paymentMethod?: string;
  paymentMode?: string;
  bankName?: string;
  neftNo?: string;
  rtgsNo?: string;
  impsNo?: string;
  upi?: string;
  remarks?: string;
}

export interface AdvancePayment {
  advanceId?: string;
  randomId?: string;
  vendorId?: string;
  vendorName?: string;
  vendorCode?: string; // Added vendorCode field
  amount?: number;
  pendingAmount?: number;
  paymentMethod?: string;
  paymentMode?: string;
  bankName?: string;
  neftNo?: string;
  rtgsNo?: string;
  impsNo?: string;
  upi?: string;
  remarks?: string;
  paymentType?: string;
  status?: string;
  createdDate?: Date;
  lastUpdatedDate?: Date;
  paymentDate: Date;
  paymentHistory?: PaymentHistory[];
}

export interface VendorDetail {
  vendorName: string;
  count: number;
  totalAmount: number;
  statuses: string[];
}

export interface VendorNameGet {
  vendorId: string;
  vendorName: string;
}

export interface AdvanceState {
  advances: AdvancePayment[];
  singleadvance: AdvancePayment[];
  advanceVendors: VendorDetail[];
  activeAdvances: AdvancePayment[];
  loading: boolean;
  snackbarMessage: string;
  snackbarOpen: boolean;
  currentPage: number;
  pageSize: number;
  totalItems: number;
}