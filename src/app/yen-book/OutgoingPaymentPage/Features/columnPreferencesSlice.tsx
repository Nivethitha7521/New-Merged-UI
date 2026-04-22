// features/yen-purchase/Outgoing/outgoingColumnPreferencesSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '@/redux/store';

export interface ColumnConfig {
  id: string;
  label: string;
  visible: boolean;
  order: number;
  width?: number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

interface ColumnPreferencesState {
  columns: ColumnConfig[];
  columnOrder: string[];
  lastUpdated: string | null;
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'serialNo', label: 'No', visible: true, order: 0, align: 'center', sortable: false },
  { id: 'select', label: 'Select', visible: true, order: 1, align: 'center', sortable: false },
  { id: 'poNo', label: 'PO.No/SO.No', visible: true, order: 2, align: 'left', sortable: true },
  { id: 'grnNo', label: 'GRN No', visible: true, order: 3, align: 'left', sortable: true },
  { id: 'apNo', label: 'Ap No', visible: true, order: 4, align: 'left', sortable: true },
  { id: 'outgoingNo', label: 'Outgoing No', visible: true, order: 5, align: 'left', sortable: true },
  { id: 'vendorName', label: 'Vendor Name', visible: true, order: 6, align: 'left', sortable: true },
  { id: 'type', label: 'Type', visible: true, order: 7, align: 'left', sortable: true },
  { id: 'invoiceNo', label: 'Invoice No', visible: true, order: 8, align: 'left', sortable: true },
  { id: 'invoiceDate', label: 'Invoice Date', visible: true, order: 9, align: 'left', sortable: true },
  { id: 'invoiceAmount', label: 'Invoice Amount', visible: true, order: 10, align: 'right', sortable: true },
  { id: 'taxDetails', label: 'Tax Details', visible: true, order: 11, align: 'left', sortable: false },
  { id: 'discountAmount', label: 'Discount Amount', visible: true, order: 12, align: 'right', sortable: true },
  { id: 'total', label: 'Total', visible: true, order: 13, align: 'right', sortable: true },
  { id: 'paidAmount', label: 'Paid Amount', visible: true, order: 14, align: 'right', sortable: true },
  { id: 'remainingAmount', label: 'Remaining Amount', visible: true, order: 15, align: 'right', sortable: true },
  { id: 'dueDays', label: 'Due Days', visible: true, order: 16, align: 'center', sortable: true },
  { id: 'paymentTerms', label: 'Payment Terms', visible: true, order: 17, align: 'center', sortable: true },
  { id: 'verifiedBy', label: 'Verified By', visible: true, order: 18, align: 'left', sortable: true },
  { id: 'verifiedDate', label: 'Verified Date', visible: true, order: 19, align: 'center', sortable: true },
  { id: 'action', label: 'Action', visible: true, order: 20, align: 'center', sortable: false },
];

// Global storage key
const STORAGE_KEY = 'outgoing_column_preferences_global';

// Load from localStorage
const loadFromStorage = (): ColumnConfig[] | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.columns && Array.isArray(parsed.columns)) {
        return parsed.columns;
      }
    }
  } catch (error) {
    console.error('Failed to load column preferences:', error);
  }
  return null;
};

// Save to localStorage
const saveToStorage = (columns: ColumnConfig[]) => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      columns,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    }));
  } catch (error) {
    console.error('Failed to save column preferences:', error);
  }
};

const initialState: ColumnPreferencesState = {
  columns: [...DEFAULT_COLUMNS], // Create a copy
  columnOrder: [...DEFAULT_COLUMNS.sort((a, b) => a.order - b.order).map(c => c.id)],
  lastUpdated: null,
};

const columnPreferencesSlice = createSlice({
  name: 'outgoingColumnPreferences',
  initialState,
  reducers: {
    // Initialize preferences
    initializePreferences: (state) => {
      const storedColumns = loadFromStorage();
      
      if (storedColumns && storedColumns.length > 0) {
        // Create a new array with copied objects
        state.columns = storedColumns.map(col => ({ ...col }));
        state.columnOrder = [...storedColumns.sort((a, b) => a.order - b.order).map(c => c.id)];
        state.lastUpdated = new Date().toISOString();
      } else {
        // Use default columns (create copies)
        state.columns = DEFAULT_COLUMNS.map(col => ({ ...col }));
        state.columnOrder = [...DEFAULT_COLUMNS.sort((a, b) => a.order - b.order).map(c => c.id)];
      }
    },
    
    // Toggle column visibility
    toggleColumnVisibility: (state, action: PayloadAction<{ columnId: string }>) => {
      const { columnId } = action.payload;
      // Create a new array with updated column
      const columnIndex = state.columns.findIndex(c => c.id === columnId);
      if (columnIndex !== -1) {
        // Create a new array with the updated column
        const updatedColumns = [...state.columns];
        updatedColumns[columnIndex] = {
          ...updatedColumns[columnIndex],
          visible: !updatedColumns[columnIndex].visible
        };
        state.columns = updatedColumns;
        saveToStorage(state.columns);
      }
    },
    
    // Update multiple columns visibility
    updateColumnsVisibility: (state, action: PayloadAction<{ columnIds: string[]; visible: boolean }>) => {
      const { columnIds, visible } = action.payload;
      // Create new array with updated columns
      state.columns = state.columns.map(column => 
        columnIds.includes(column.id) ? { ...column, visible } : { ...column }
      );
      saveToStorage(state.columns);
    },
    
    // Reset to default columns
    resetToDefault: (state) => {
      state.columns = DEFAULT_COLUMNS.map(col => ({ ...col }));
      state.columnOrder = [...DEFAULT_COLUMNS.sort((a, b) => a.order - b.order).map(c => c.id)];
      saveToStorage(state.columns);
    },
    
    // Update column order
    updateColumnOrder: (state, action: PayloadAction<string[]>) => {
      const newOrder = action.payload;
      state.columnOrder = [...newOrder];
      // Create new array with updated order numbers
      state.columns = state.columns.map(column => {
        const newIndex = newOrder.indexOf(column.id);
        return {
          ...column,
          order: newIndex !== -1 ? newIndex : column.order
        };
      });
      // Sort columns by new order
      state.columns.sort((a, b) => a.order - b.order);
      saveToStorage(state.columns);
    },
    
    // Show all columns
    showAllColumns: (state) => {
      state.columns = state.columns.map(column => ({ ...column, visible: true }));
      saveToStorage(state.columns);
    },
    
    // Show only specified columns
    showOnlyColumns: (state, action: PayloadAction<string[]>) => {
      const columnIds = action.payload;
      state.columns = state.columns.map(column => ({
        ...column,
        visible: columnIds.includes(column.id)
      }));
      saveToStorage(state.columns);
    },
    
    // Clear preferences
    clearPreferences: (state) => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      state.columns = DEFAULT_COLUMNS.map(col => ({ ...col }));
      state.columnOrder = [...DEFAULT_COLUMNS.sort((a, b) => a.order - b.order).map(c => c.id)];
      state.lastUpdated = null;
    },
  },
});

export const {
  initializePreferences,
  toggleColumnVisibility,
  updateColumnsVisibility,
  resetToDefault,
  updateColumnOrder,
  showAllColumns,
  showOnlyColumns,
  clearPreferences,
} = columnPreferencesSlice.actions;

// Selectors
export const selectAllColumns = (state: RootState) => state.outgoingColumnPreferences?.columns || [];
export const selectVisibleColumns = (state: RootState) => 
  (state.outgoingColumnPreferences?.columns || []).filter(col => col.visible).sort((a, b) => a.order - b.order);
export const selectColumnOrder = (state: RootState) => state.outgoingColumnPreferences?.columnOrder || [];

export default columnPreferencesSlice.reducer;