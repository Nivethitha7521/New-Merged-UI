import { useState, useEffect } from 'react';

export interface ColumnVisibility {
  no: boolean;
  select: boolean;
  poNo: boolean;
  grnNo: boolean;
  apNo: boolean;
  outgoingNo: boolean;
  vendorName: boolean;
  type: boolean;
  invoiceNo: boolean;
  invoiceDate: boolean;
  invoiceAmount: boolean;
  taxDetails: boolean;
  discountAmount: boolean;
  total: boolean;
  paidAmount: boolean;
  remainingAmount: boolean;
  dueDays: boolean;
  paymentTerms: boolean;
  verifiedBy: boolean;
  verifiedDate: boolean;
  action: boolean;
}

const defaultColumnVisibility: ColumnVisibility = {
  no: true,
  select: true,
  poNo: true,
  grnNo: true,
  apNo: true,
  outgoingNo: true,
  vendorName: true,
  type: true,
  invoiceNo: true,
  invoiceDate: true,
  invoiceAmount: true,
  taxDetails: true,
  discountAmount: true,
  total: true,
  paidAmount: true,
  remainingAmount: true,
  dueDays: true,
  paymentTerms: true,
  verifiedBy: true,
  verifiedDate: true,
  action: true,
};

const STORAGE_KEY = 'outgoing_payment_column_visibility';

export const useColumnVisibility = () => {
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        try {
          return { ...defaultColumnVisibility, ...JSON.parse(saved) };
        } catch (e) {
          console.error('Failed to parse column visibility:', e);
        }
      }
    }
    return defaultColumnVisibility;
  });

  // Save to localStorage whenever visibility changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility));
    }
  }, [columnVisibility]);

  const toggleColumn = (column: keyof ColumnVisibility) => {
    setColumnVisibility(prev => ({
      ...prev,
      [column]: !prev[column]
    }));
  };

  const resetToDefault = () => {
    setColumnVisibility(defaultColumnVisibility);
  };

  const showAllColumns = () => {
    setColumnVisibility(defaultColumnVisibility);
  };

  const hideAllColumns = () => {
    const allFalse = Object.keys(defaultColumnVisibility).reduce((acc, key) => {
      acc[key as keyof ColumnVisibility] = false;
      return acc;
    }, {} as ColumnVisibility);
    setColumnVisibility(allFalse);
  };

  return {
    columnVisibility,
    toggleColumn,
    resetToDefault,
    showAllColumns,
    hideAllColumns,
  };
};