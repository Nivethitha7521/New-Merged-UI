import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import purchaseApi from "@/utils/api";
import { RootState } from '../../../redux/store';

// Interfaces for grouped payments
export interface PaymentHistoryEntry {
  amount: number;
  paymentType: string;
  paymentMethod: string;
  paymentMode: string;
  cashAmount?: number;
  bankName?: string;
  impsNo?: string;
  neftNo?: string;
  rtgsNo?: string;
  upi?: string;
  date: string;
  debitNotesApplied: string[];
  debitAmount: number;
  advancePaymentsApplied: string[];
  advanceAmount: number;
  paymentId?: string;
}

export interface PaymentGroupResponse {
  paymentId: string;
  paymentDate: string | null;
  totalPayableAmount: number;
  totalPaidAmount: number;
  status: string;
  vendorName: string;
  outgoingRandomId: string;
  paymentHistory: PaymentHistoryEntry[];
  createdAt?: string;
}

export interface PaymentsGroupedResponse {
  groups: PaymentGroupResponse[];
  totalGroups: number;
  totalAmount: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaymentDetailResponse extends PaymentGroupResponse {}

interface PaymentsState {
  groupedData: PaymentsGroupedResponse | null;
  selectedPayment: PaymentDetailResponse | null;
  loading: boolean;
  error: string | null;
  currentPaymentId: string | null;
  currentPage: number;
  exportLoading: boolean;
  exportError: string | null;
  individualExportId: string | null; // Track which payment is being exported
}

const initialState: PaymentsState = {
  groupedData: null,
  selectedPayment: null,
  loading: false,
  error: null,
  currentPaymentId: null,
  currentPage: 1,
  exportLoading: false,
  exportError: null,
  individualExportId: null,
};

// Fetch grouped payments (main view)
export const fetchGroupedPayments = createAsyncThunk(
  'payments/fetchGroupedPayments',
  async ({ 
    paymentId, 
    page = 1, 
    limit = 10, 
    dateFrom, 
    dateTo, 
    vendorName 
  }: { 
    paymentId?: string; 
    page?: number; 
    limit?: number; 
    dateFrom?: string;
    dateTo?: string;
    vendorName?: string;
  }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      
      if (paymentId) {
        params.append('payment_id', paymentId);
      }
      if (dateFrom) {
        params.append('date_from', dateFrom);
      }
      if (dateTo) {
        params.append('date_to', dateTo);
      }
      if (vendorName) {
        params.append('vendor_name', vendorName);
      }
      
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      
      console.log('Fetching grouped payments from URL:', `/outgoingpayments/payments/grouped?${params.toString()}`);
      
      const response = await purchaseApi.get(
        `/outgoingpayments/payments/grouped?${params.toString()}`
      );
      
      console.log('Grouped payments response:', response.data);
      return response.data as PaymentsGroupedResponse;
    } catch (error: any) {
      console.error('API Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      
      const errorMsg = error.response?.status === 404 
        ? `No payments found${paymentId ? ` for ID "${paymentId}"` : ' in database'}`
        : error.response?.data?.detail || error.message || 'Failed to fetch payments data';
      
      return rejectWithValue(errorMsg);
    }
  }
);

// Fetch single payment by ID (detailed view)
export const fetchPaymentById = createAsyncThunk(
  'payments/fetchPaymentById',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      console.log('Fetching payment details for:', paymentId);
      
      const response = await purchaseApi.get(
        `/outgoingpayments/payments/by-payment-id/${paymentId}`
      );
      
      console.log('Payment details response:', response.data);
      return response.data as PaymentDetailResponse;
    } catch (error: any) {
      console.error('Error fetching payment details:', error);
      
      const errorMsg = error.response?.status === 404 
      
        ? `Payment ID "${paymentId}" not found`
        : error.response?.data?.detail || error.message || 'Failed to fetch payment details';
      
      return rejectWithValue(errorMsg);
    }
  }
);

export const exportGroupedPaymentsCSV = createAsyncThunk(
  'payments/exportGroupedPaymentsCSV',
  async ({ paymentId, dateFrom, dateTo, vendorName }: { 
    paymentId?: string; 
    dateFrom?: string;
    dateTo?: string;
    vendorName?: string;
  }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (paymentId) params.append('payment_id', paymentId);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (vendorName) params.append('vendor_name', vendorName);
      params.append('format', 'csv');

      const response = await purchaseApi.get(
        `/outgoingpayments/payments/grouped?${params.toString()}`,
        { responseType: "blob" }
      );

      // ✅ Handle download inside thunk
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = paymentId
        ? `${paymentId}_payment_report.csv`
        : 'all_payments_report.csv';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      // ✅ Only return serializable value
      return { success: true };

    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to export CSV';
      return rejectWithValue(errorMsg);
    }
  }
);

export const exportGroupedPaymentsPDF = createAsyncThunk(
  'payments/exportGroupedPaymentsPDF',
  async ({ paymentId, dateFrom, dateTo, vendorName }: { 
    paymentId?: string; 
    dateFrom?: string;
    dateTo?: string;
    vendorName?: string;
  }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (paymentId) params.append('payment_id', paymentId);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (vendorName) params.append('vendor_name', vendorName);
      params.append('format', 'pdf');

      const response = await purchaseApi.get(
        `/outgoingpayments/payments/grouped?${params.toString()}`,
        { responseType: "blob" }
      );

      // ✅ Handle download inside thunk
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = paymentId
        ? `${paymentId}_payment_report.pdf`
        : 'all_payments_report.pdf';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      // ✅ Only return serializable value
      return { success: true };

    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to export PDF';
      return rejectWithValue(errorMsg);
    }
  }
);
export const exportIndividualPaymentPDF = createAsyncThunk(
  'payments/exportIndividualPaymentPDF',
  async (paymentId: string, { rejectWithValue }) => {
    try {
      const response = await purchaseApi.get(
        `/outgoingpayments/payments/individual-pdf/${paymentId}`,
        { responseType: "blob" }
      );

      // ✅ Handle download HERE inside the thunk — don't store blob in Redux
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment_voucher_${paymentId}.pdf`;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);

      // ✅ Only return serializable data to Redux
      return { paymentId };

    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to export PDF';
      return rejectWithValue(errorMsg);
    }
  }
);
// Slice with grouped payment handling
const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    resetPaymentsData: (state) => {
      state.groupedData = null;
      state.selectedPayment = null;
      state.error = null;
      state.currentPaymentId = null;
      state.currentPage = 1;
      state.individualExportId = null;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.currentPage = action.payload;
    },
    resetExport: (state) => {
      state.exportLoading = false;
      state.exportError = null;
      state.individualExportId = null;
    },
    clearSelectedPayment: (state) => {
      state.selectedPayment = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch grouped payments cases
      .addCase(fetchGroupedPayments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGroupedPayments.fulfilled, (state, action: PayloadAction<PaymentsGroupedResponse>) => {
        state.loading = false;
        state.groupedData = action.payload;
        state.currentPage = action.payload.page;
      })
      .addCase(fetchGroupedPayments.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Unknown error occurred';
        state.groupedData = null;
      })
      
      // Fetch single payment details cases
      .addCase(fetchPaymentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentById.fulfilled, (state, action: PayloadAction<PaymentDetailResponse>) => {
        state.loading = false;
        state.selectedPayment = action.payload;
        state.currentPaymentId = action.payload.paymentId;
      })
      .addCase(fetchPaymentById.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Unknown error occurred';
        state.selectedPayment = null;
      })
      
      // CSV export cases
      .addCase(exportGroupedPaymentsCSV.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(exportGroupedPaymentsCSV.fulfilled, (state) => {
        state.exportLoading = false;
      })
      .addCase(exportGroupedPaymentsCSV.rejected, (state, action: PayloadAction<any>) => {
        state.exportLoading = false;
        state.exportError = action.payload || 'Unknown export error occurred';
      })
      
      // Grouped PDF export cases
      .addCase(exportGroupedPaymentsPDF.pending, (state) => {
        state.exportLoading = true;
        state.exportError = null;
      })
      .addCase(exportGroupedPaymentsPDF.fulfilled, (state) => {
        state.exportLoading = false;
      })
      .addCase(exportGroupedPaymentsPDF.rejected, (state, action: PayloadAction<any>) => {
        state.exportLoading = false;
        state.exportError = action.payload || 'Unknown export error occurred';
      })
      
      // Individual PDF export cases
      .addCase(exportIndividualPaymentPDF.pending, (state, action) => {
        state.exportLoading = true;
        state.exportError = null;
        state.individualExportId = action.meta.arg;
      })
      .addCase(exportIndividualPaymentPDF.fulfilled, (state) => {
        state.exportLoading = false;
        state.individualExportId = null;
      })
      .addCase(exportIndividualPaymentPDF.rejected, (state, action: PayloadAction<any>) => {
        state.exportLoading = false;
        state.exportError = action.payload || 'Unknown export error occurred';
        state.individualExportId = null;
      });
  },
});

// Export actions
export const { 
  resetPaymentsData, 
  setCurrentPage, 
  resetExport,
  clearSelectedPayment 
} = paymentsSlice.actions;

// Selectors
export const selectGroupedPayments = (state: RootState) => ({
  groupedData: state.payments.groupedData,
  selectedPayment: state.payments.selectedPayment,
  loading: state.payments.loading,
  error: state.payments.error,
  currentPaymentId: state.payments.currentPaymentId,
  currentPage: state.payments.currentPage,
  exportLoading: state.payments.exportLoading,
  exportError: state.payments.exportError,
  individualExportId: state.payments.individualExportId,
});

export default paymentsSlice.reducer;