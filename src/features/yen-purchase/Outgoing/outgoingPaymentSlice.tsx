import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import purchaseApi from "@/utils/api";

import { RootState } from '../../../redux/store';
import { Bank, BulkPaymentRequest, BulkPaymentResponse, DebitNote, FetchOutgoingsArgs, GRN, initialState, Outgoing, PaymentDetails, PaymentDone, PaymentHistory, ProcessPaymentRequest, TaxDetail, VendorDetail, VendorPayment } from '@/Models/outgoingModel';

// Add this interface for column visibility
interface ColumnVisibility {
  id: string;
  visible: boolean;
}

// Default column preferences
const defaultColumnPreferences: ColumnVisibility[] = [
  { id: 'serialNo', visible: true },
  { id: 'select', visible: true },
  { id: 'poNo', visible: true },
  { id: 'grnNo', visible: true },
  { id: 'apNo', visible: true },
  { id: 'outgoingNo', visible: true },
  { id: 'vendorName', visible: true },
  { id: 'type', visible: true },
  { id: 'invoiceNo', visible: true },
  { id: 'invoiceDate', visible: true },
  { id: 'invoiceAmount', visible: true },
  { id: 'taxDetails', visible: true },
  { id: 'discountAmount', visible: true },
  { id: 'total', visible: true },
  { id: 'paidAmount', visible: true },
  { id: 'remainingAmount', visible: true },
  { id: 'dueDays', visible: true },
  { id: 'paymentTerms', visible: true },
  { id: 'verifiedBy', visible: true },
  { id: 'verifiedDate', visible: true },
  { id: 'action', visible: true },
];

export const initializePreferences = () => (dispatch: any) => {
  try {
    const savedPreferences = localStorage.getItem('outgoingPaymentColumnPreferences');
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      dispatch(setColumnPreferences(preferences));
    } else {
      // Set default preferences if none exist
      dispatch(setColumnPreferences(defaultColumnPreferences));
    }
  } catch (error) {
    console.error('Failed to load column preferences:', error);
    dispatch(setColumnPreferences(defaultColumnPreferences));
  }
};

// Toggle column visibility and save to localStorage
export const toggleColumnVisibility = (payload: { columnId: string }) => (dispatch: any, getState: any) => {
  const { columnId } = payload;
  const currentState = getState();
  const currentPreferences = currentState.outgoingPayment.columnPreferences || defaultColumnPreferences;
  
  const updatedPreferences = currentPreferences.map((col: ColumnVisibility) =>
    col.id === columnId ? { ...col, visible: !col.visible } : col
  );
  
  dispatch(setColumnPreferences(updatedPreferences));
  
  // Save to localStorage
  try {
    localStorage.setItem('outgoingPaymentColumnPreferences', JSON.stringify(updatedPreferences));
  } catch (error) {
    console.error('Failed to save column preferences:', error);
  }
};

export const fetchOutgoings = createAsyncThunk<
  { outgoings: Outgoing[]; totalItems: number; totalPayableAmount: number },
  FetchOutgoingsArgs,
  { rejectValue: string }
>(
  'outgoings/fetchOutgoings',
  async (args, { rejectWithValue }) => {
    try {
      const url = 'https://yenerp.com/purchaseapi/outgoingpayments/';
      const params: any = {
        skip: (args.page - 1) * args.size,
        limit: args.size,
        filterByAmount: args.filterByAmount ?? false,
        filterByStatus: false,
        sortOrder: args.sortOrder,
        filterAll: args.filterAll,
        sortBy: args.sortBy,
      };

      if (args.fromDate) params.fromDate = args.fromDate.toISOString();
      if (args.toDate) params.toDate = args.toDate.toISOString();
      if (args.vendorCode) params.vendorCode = args.vendorCode;
      if (args.vendorName) params.vendorName = args.vendorName;
      if (args.filterBy) params.filterBy = args.filterBy;
      if (args.status) params.status = args.status;

      console.log('🔍 API Call Params:', params);

      const response = await purchaseApi.get("/outgoingpayments/", { params });

      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch outgoings:', error);
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch outgoings');
    }
  }
);

// In your API service
export const fetchOutgoingStatuses = async (): Promise<string[]> => {
    const response = await purchaseApi.get("/outgoingpayments/getStatusfilter/statuses");
    return response.data.statuses;
};

export const fetchVendorDetails = createAsyncThunk(
  'outgoing/fetchVendorDetails',
  async (filters: {
    status?: string;
    filterByAmount?: boolean;
    filterByStatus?: boolean;
    fetchAll?: boolean;
  }) => {
    try {
      const params = new URLSearchParams();

      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.filterByAmount !== undefined) {
        params.append('filterByAmount', filters.filterByAmount.toString());
      }
      if (filters.filterByStatus !== undefined) {
        params.append('filterByStatus', filters.filterByStatus.toString());
      }
      if (filters.fetchAll !== undefined) {
        params.append('fetchAll', filters.fetchAll.toString());
      }

       const response = await purchaseApi.get<VendorDetail[]>(
        `/outgoingpayments/vendors/details?${params.toString()}`,
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  }
);

export const fetchGRN = createAsyncThunk('purchaseorder/fetch', async () => {
  const response = await purchaseApi.get<GRN[]>(`/grns/`);
  const grnData = response.data.map(item => ({
    grnId: item.grnId,
    randomId: item.randomId,
  }));
  return grnData;
});

// Async thunk to add a new Outgoing item
export const addOutgoing = createAsyncThunk<Outgoing, Omit<Outgoing, 'outgoingId'>>('outgoings/addOutgoing', async (outgoingData) => {
  const response = await purchaseApi.post("/outgoingpayments/", outgoingData);
  return response.data;
});

// Async thunk to update an existing Outgoing item
export const updateOutgoing = createAsyncThunk<Outgoing, Outgoing>('outgoings/updateOutgoing', async (outgoingData) => {
 const response = await purchaseApi.patch(
      `/outgoingpayments/${outgoingData.outgoingId}`,
      outgoingData,
    );  
  return response.data;
});

// Thunk
export const fetchBank = createAsyncThunk<Bank[], void, { dispatch: any }>(
  'outgoingPayment/fetchBanks',
  async (_, { dispatch }) => {
    try {
      const response = await purchaseApi.get('https://yenerp.com/masterapi/bankmasters/');
      return response.data;
    } catch (error) {
      dispatch(setSnackbarMessage('Failed to fetch banks. Please try again.'));
      dispatch(setSnackbarOpen(true));
      throw error;
    }
  }
);

export const processPayment = createAsyncThunk<
  void,
  ProcessPaymentRequest,
  { rejectValue: string }
>(
  'outgoings/processPayment',
  async (
    {
      outgoingId,
      paymentMode,
      paymentType,
      totalPayableAmount,
      fullPaymentAmount,
      partialAmount,
      paymentMethod,
      chequeNo,
      neftNo,
      rtgsNo,
      impsNo,
      upi,
      cashAmount,
      bankName,
      selectedDebitNotes = [],
      selectedAdvancePayments = [],
      paymentDate,
    },
    { rejectWithValue }
  ) => {
    try {
      if (!['full', 'partial'].includes(paymentType)) {
        throw new Error('Payment type must be "full" or "partial"');
      }
      const payload = {
        outgoingId,
        paymentMode,
        paymentType,
        totalPayableAmount,
        fullPaymentAmount: paymentType === 'full' ? fullPaymentAmount : 0,
        partialAmount: paymentType === 'partial' ? partialAmount : 0,
        paymentMethod,
        chequeNo,
        neftNo,
        rtgsNo,
        impsNo,
        upi,
        cashAmount,
        bankName,
        selectedDebitNotes,
        selectedAdvancePayments,
        paymentDate: paymentDate.toISOString(),
      };

      await purchaseApi.patch(
        `/outgoingpayments/${outgoingId}/payment`,
        payload,
      );    
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message || 'Payment processing failed');
    }
  }
);

export const fetchActiveDebitsVendor = createAsyncThunk<
  DebitNote[],
  string,
  {
    rejectValue: string;
  }
>(
  'debitNotes/fetchActiveDebitsVendor',
  async (vendorName, { rejectWithValue }) => {
    try {
      const response = await purchaseApi.get(
        `/debitnote/vendor/${encodeURIComponent(vendorName)}/active-debits`,
      );      
      if (!response.data.debits) {
        throw new Error('No debits found in response');
      }
      return response.data.debits as DebitNote[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.response?.data?.message || 'Failed to fetch active debits');
    }
  }
);

export const fetchActiveDebitsMultipleVendor = createAsyncThunk<
  DebitNote[],
  string[],
  {
    rejectValue: string;
  }
>(
  'debitNotes/fetchActiveDebitsMultipleVendor',
  async (vendorNames, { rejectWithValue }) => {
    try {
      if (!vendorNames || vendorNames.length === 0) {
        return [];
      }

      const vendorNamesStr = vendorNames.join(',');
      const response = await purchaseApi.get(
        `/debitnote/multiplevendors/active-debits?vendor_names=${encodeURIComponent(vendorNamesStr)}`,
      );

      return response.data.debits || [];
    } catch (error: any) {
      console.error('Failed to fetch active debits:', error);
      return rejectWithValue(error.response?.data?.detail || 'Failed to fetch active debits');
    }
  }
);

// Updated outgoingPaymentSlice.ts (handle Date parsing/serialization)
export const processBulkPayment = createAsyncThunk<
  BulkPaymentResponse,
  BulkPaymentRequest,
  { rejectValue: string }
>(
  'outgoings/processBulkPayment',
  async (bulkPaymentRequest, { rejectWithValue }) => {
    try {
      const requestPayload = {
        ...bulkPaymentRequest,
        paymentDate: bulkPaymentRequest.paymentDate
          ? bulkPaymentRequest.paymentDate.toISOString().split('T')[0]
          : undefined,
      };

      const response = await purchaseApi.patch(
        "/outgoingpayments/bulk/bulk-payment",
        requestPayload,
      );

      if (response.status === 207) {
        const parsedData = {
          ...response.data,
          results: response.data.results.map((result: any) => ({
            ...result,
            paymentDate: result.paymentDate ? new Date(result.paymentDate) : undefined,
          })),
        };
        return parsedData as BulkPaymentResponse;
      }

      return response.data as BulkPaymentResponse;
    } catch (error: any) {
      if (error.response?.status === 207 && error.response?.data) {
        const parsedErrorData = {
          ...error.response.data,
          results: error.response.data.results?.map((result: any) => ({
            ...result,
            paymentDate: result.paymentDate ? new Date(result.paymentDate) : undefined,
          })) || [],
        };
        return parsedErrorData as BulkPaymentResponse;
      }

      return rejectWithValue(
        error.response?.data?.detail || 'Bulk payment processing failed'
      );
    }
  }
);

export const addNewPayment = createAsyncThunk<Outgoing, PaymentDetails>(
  'outgoings/addNewPayment',
  async (paymentData, { rejectWithValue }) => {
    console.log('addNewPayment called with data:', paymentData);

    try {
      const outgoingWithDate = {
        ...paymentData,
      };

      const response = await purchaseApi.post(
        "/outgoingpayments/",
        outgoingWithDate,
      );      
      console.log('Response from API:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in addNewPayment:', error);
      return rejectWithValue(error.response?.data || 'An error occurred while adding payment');
    }
  }
);

// Async thunk for adding new payment
export const addNewVendorPayment = createAsyncThunk(
  'outgoings/addNewVendorPayment',
  async (paymentData: any, { rejectWithValue }) => {
    console.log('addNewPayment called with data:', paymentData);
    try {
      const response = await purchaseApi.post("/outgoingpayments/advance/", {
        ...paymentData,
        isPreOutgoing: !paymentData.poId,
      });
      console.log('Response from API:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error in addNewPayment:', error);
      return rejectWithValue(error.response?.data?.detail || 'An error occurred while adding payment');
    }
  }
);

// Async thunk to fetch tax details for a specific outgoing payment
export const fetchTaxDetails = createAsyncThunk<TaxDetail[], string>(
  'outgoings/fetchTaxDetails',
  async (outgoingId) => {
    const response = await purchaseApi.get<TaxDetail[]>(
      `/outgoingpayments/${outgoingId}/tax-details`,
    );    
    return response.data;
  }
);

export const selectOutgoingPayment = createAsyncThunk<
  Outgoing,
  {
    outgoingId: string;
    paymentMode: string;
    paymentMethod: string;
    paymentType: string;
    paymentAmount: number;
    voucherNumber: string;
    pettyCashAmount?: number;
    hoCash?: number;
    bankName?: string;
  }
>(
  'outgoings/selectOutgoingPayment',
  async (
    { outgoingId, paymentMode, paymentMethod, paymentType, paymentAmount, voucherNumber, pettyCashAmount, hoCash, bankName },
    { rejectWithValue }
  ) => {
    try {
      const response = await purchaseApi.get<Outgoing>(
        `/outgoingpayments/${outgoingId}`,
      );
      const outgoingData = response.data;

      const totalPayableAmount = outgoingData.totalPayableAmount ?? 0;

      let paymentFields: Record<string, string | number> = {};

      switch (paymentMode.toLowerCase()) {
        case 'cash':
          paymentFields = {
            cashVoucherNo: voucherNumber,
            pettyCashAmount: pettyCashAmount ?? 0,
            hoCash: hoCash ?? 0,
          };
          break;

        case 'bank':
          paymentFields = {
            bankName: bankName ?? '',
            paymentMethod,
            [`${paymentMethod.toLowerCase()}No`]: voucherNumber,
          };
          break;

        default:
          return rejectWithValue('Invalid payment mode');
      }

      let updatedOutgoing: Outgoing | null = null;
      if (paymentType === 'full') {
        updatedOutgoing = {
          ...outgoingData,
          totalPayableAmount: 0,
          fullPaymentAmount: totalPayableAmount,
          paymentType: 'full',
          status: 'Fully Paid',
          paymentMode,
          ...paymentFields,
        };
      } else if (paymentType === 'partial') {
        const remainingAmount = totalPayableAmount - paymentAmount;
        updatedOutgoing = {
          ...outgoingData,
          totalPayableAmount: remainingAmount,
          partialAmount: paymentAmount,
          paymentType: 'partial',
          status: remainingAmount === 0 ? 'Fully Paid' : 'Partially Paid',
          paymentMode,
          ...paymentFields,
        };
      } else {
        return rejectWithValue('Invalid payment type');
      }

      if (!updatedOutgoing) {
        return rejectWithValue('Failed to update outgoing payment: updatedOutgoing is null');
      }

      await purchaseApi.patch(
        `/outgoingpayments/${outgoingId}`,
        updatedOutgoing,
      );
      return updatedOutgoing;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || 'Error occurred while processing payment');
    }
  }
);

// Create slice for Outgoing items
const outgoingSlice = createSlice({
  name: 'outgoings',
  initialState: {
    ...initialState,
    columnPreferences: defaultColumnPreferences, // Add this to initialState
  },
  reducers: {
    // ADD THE SET_COLUMN_PREFERENCES REDUCER
    setColumnPreferences: (state, action: PayloadAction<ColumnVisibility[]>) => {
      state.columnPreferences = action.payload;
    },
    
    setSelectedOutgoingId: (state, action: PayloadAction<string | null>) => {
      state.selectedOutgoingId = action.payload;
    },
    
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setDialogOpen(state, action: PayloadAction<'none' | 'edit'>) {
      state.dialogOpen = action.payload;
    },
    
    setSelectedOutgoingIds: (state, action: PayloadAction<string[]>) => {
      state.selection.selectedOutgoingIds = action.payload;
    },

    setSelectedOutgoings: (state, action: PayloadAction<Outgoing[]>) => {
      state.selection.selectedOutgoings = action.payload;
    },

    toggleOutgoingSelection: (state, action: PayloadAction<{ outgoingId: string; outgoing: Outgoing }>) => {
      const { outgoingId, outgoing } = action.payload;
      const existingIndex = state.selection.selectedOutgoingIds.indexOf(outgoingId);
      
      if (existingIndex >= 0) {
        state.selection.selectedOutgoingIds.splice(existingIndex, 1);
        state.selection.selectedOutgoings = state.selection.selectedOutgoings.filter(
          item => item.outgoingId !== outgoingId
        );
      } else {
        state.selection.selectedOutgoingIds.push(outgoingId);
        state.selection.selectedOutgoings.push(outgoing);
      }
    },

    syncSelectionsWithCurrentData: (state) => {
      const currentOutgoingIds = new Set(state.outgoings.map(o => o.outgoingId));
      
      state.selection.selectedOutgoingIds = state.selection.selectedOutgoingIds.filter(
        id => currentOutgoingIds.has(id)
      );
      state.selection.selectedOutgoings = state.selection.selectedOutgoings.filter(
        outgoing => currentOutgoingIds.has(outgoing.outgoingId)
      );
    },
    
    clearSelection: (state) => {
      state.selection.selectedOutgoingIds = [];
      state.selection.selectedOutgoings = [];
    },

    setSnackbarOpen(state, action: PayloadAction<boolean>) {
      state.snackbarOpen = action.payload;
    },
    setSnackbarMessage(state, action: PayloadAction<string>) {
      state.snackbarMessage = action.payload;
    },
    setEditIndex(state, action: PayloadAction<number | null>) {
      state.editIndex = action.payload;
    },
    clearSnackbarMessage(state) {
      state.snackbarMessage = '';
      state.snackbarOpen = false;
    },
    setPagination: (state, action: PayloadAction<{ page: number; size: number }>) => {
      state.currentPage = action.payload.page;
      state.pageSize = action.payload.size;
    },
    setVendorPayment(
      state,
      action: PayloadAction<{
        vendorName: string;
        payment: VendorPayment;
      }>
    ) {
      state.vendorPayments[action.payload.vendorName] = action.payload.payment;
    },
    clearVendorPayments(state) {
      state.vendorPayments = {};
    },
    setVendorDebits(
      state,
      action: PayloadAction<{
        vendorName: string;
        debits: any[];
      }>
    ) {
      state.vendorDebits[action.payload.vendorName] = action.payload.debits;
    },
    clearVendorDebits(state) {
      state.vendorDebits = {};
    },
    clearAdvances: (state) => {
      state.advances = [];
    },
    clearBulkPaymentState: (state) => {
      state.loading = false;
      state.error = null;
      state.snackbarOpen = false;
      state.snackbarMessage = '';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOutgoings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOutgoings.fulfilled, (state, action) => {
        state.loading = false;
        state.outgoings = action.payload.outgoings.map(outgoing => ({
          ...outgoing,
          totalPaid: (outgoing.advanceAmount || 0) + (outgoing.partialAmount || 0) + (outgoing.fullPaymentAmount || 0),
          remainingAmount: Math.max(0, (outgoing.totalPayableAmount || 0) -
            ((outgoing.advanceAmount || 0) + (outgoing.partialAmount || 0) + (outgoing.fullPaymentAmount || 0))),
        }));
        state.totalItems = action.payload.totalItems;
        state.totalPayableAmount = action.payload.totalPayableAmount || 0;

        state.selection.selectedOutgoings = state.selection.selectedOutgoingIds.map(id =>
          action.payload.outgoings.find(outgoing => outgoing.outgoingId === id)
        ).filter(Boolean) as Outgoing[];
      })
      .addCase(fetchOutgoings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.snackbarMessage = action.payload as string;
        state.snackbarOpen = true;
      })
      .addCase(fetchVendorDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVendorDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.outgoingvendor = action.payload;
      })
      .addCase(fetchVendorDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch vendor names';
      })
      .addCase(addOutgoing.fulfilled, (state, action) => {
        state.outgoings.push(action.payload);
      })
      .addCase(updateOutgoing.fulfilled, (state, action) => {
        const index = state.outgoings.findIndex((item) => item.outgoingId === action.payload.outgoingId);
        if (index !== -1) {
          state.outgoings[index] = action.payload;
        }
      })
      .addCase(processPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(processPayment.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading = false;
        state.snackbarOpen = true;
        state.snackbarMessage = action.payload as string;
      })
      .addCase(addNewPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(addNewPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.outgoings.push(action.payload);
      })
      .addCase(addNewPayment.rejected, (state, action) => {
        state.loading = false;
      })
      .addCase(addNewVendorPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(addNewVendorPayment.fulfilled, (state, action) => {
        state.loading = false;
        state.outgoings.push(action.payload);
      })
      .addCase(addNewVendorPayment.rejected, (state, action) => {
        state.loading = false;
      })
      .addCase(fetchTaxDetails.fulfilled, (state, action) => {
        console.log('Fetched Tax Details:', action.payload);
      })
      .addCase(fetchGRN.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGRN.fulfilled, (state, action: PayloadAction<GRN[]>) => {
        state.grns = action.payload;
      })
      .addCase(fetchGRN.rejected, (state, action) => {
        state.loading = false;
      })
      .addCase(fetchBank.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBank.fulfilled, (state, action: PayloadAction<Bank[]>) => {
        state.loading = false;
        state.banks = action.payload.filter((bank) => bank.status === 'active');
      })
      .addCase(fetchBank.rejected, (state, action) => {
        state.loading = false;
        state.banks = [];
        console.error('Fetch banks error:', action.error);
      })
      .addCase(selectOutgoingPayment.pending, (state) => {
        state.loading = true;
      })
      .addCase(selectOutgoingPayment.fulfilled, (state, action) => {
        state.loading = false;
        const updatedOutgoing = action.payload;
        const index = state.outgoings.findIndex((outgoing) => outgoing.outgoingId === updatedOutgoing.outgoingId);
        if (index !== -1) {
          state.outgoings[index] = updatedOutgoing;
        }
      })
      .addCase(selectOutgoingPayment.rejected, (state, action) => {
        state.loading = false;
      })
      .addCase(processBulkPayment.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(processBulkPayment.fulfilled, (state, action) => {
        state.loading = false;
        const { results, errors } = action.payload;

        const successCount = results.length;
        const errorCount = errors.length;

        let message = `Processed ${successCount} payments successfully.`;
        if (errorCount > 0) {
          message += ` ${errorCount} payments failed.`;
        }

        state.snackbarOpen = true;
        state.snackbarMessage = message;
        state.vendorPayments = {};
        state.vendorDebits = {};
      })
      .addCase(processBulkPayment.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.snackbarOpen = true;
        state.snackbarMessage = action.payload as string;
      })
      .addCase(fetchActiveDebitsVendor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveDebitsVendor.fulfilled, (state, action: PayloadAction<DebitNote[]>) => {
        state.loading = false;
        state.debits = action.payload;
      })
      .addCase(fetchActiveDebitsVendor.rejected, (state, action: PayloadAction<string | undefined>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch active debits';
      })
      .addCase(fetchActiveDebitsMultipleVendor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActiveDebitsMultipleVendor.fulfilled, (state, action) => {
        state.loading = false;
        state.debits = action.payload;
      })
      .addCase(fetchActiveDebitsMultipleVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch debit notes';
      });
  },
});

// Export actions from slice
export const {
  setColumnPreferences, // ADD THIS EXPORT
  setSearchQuery,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  clearSnackbarMessage,
  setEditIndex, 
  setPagination, 
  setVendorDebits, 
  setVendorPayment, 
  clearVendorDebits, 
  clearAdvances,  
  toggleOutgoingSelection,
  clearSelection,
  syncSelectionsWithCurrentData,
  clearBulkPaymentState,
  setSelectedOutgoingId,
  setSelectedOutgoingIds,
  setSelectedOutgoings
} = outgoingSlice.actions;

// Selectors
export const selectOutgoings = (state: RootState) => state.outgoingPayment;
export const selectCurrentPage = (state: RootState) => state.outgoingPayment.currentPage;
export const selectPageSize = (state: RootState) => state.outgoingPayment.pageSize;
export const selectTotalItems = (state: RootState) => state.outgoingPayment.totalItems;
export const selectTotalPayableAmount = (state: RootState) => state.outgoingPayment.totalPayableAmount;
export const selectColumnPreferences = (state: RootState) => state.outgoingPayment.columnPreferences;

// Export reducer from slice
export default outgoingSlice.reducer;