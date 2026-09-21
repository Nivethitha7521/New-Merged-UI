// ============================================================
// configs/overallSales.config.ts
// OVERALL SALES REPORT — Matches Python OVERALL_HEADERS & DB_MAP
// ============================================================

import { ReportConfig } from '@/features/reports-engine/types';
import { REPORTS_API_BASE } from '@/config/apiConfig';

// 1. INTERFACE: Strictly matching the Python 'prepare_overall_sales_data' output keys
export interface OverallSalesReport {
  // --- Basic Info ---
  Code?: string | null;
  Location?: string | null;
  "Sale Date"?: string; // Format: "MM-DD-YYYY"

  // --- Payment Modes (System Sales) ---
  Cash?: number;
  Card?: number;
  Upi?: number;
  Cheque?: number;
  Emi?: number;
  Others?: number;

  // --- Total System Sales (First Total Column) ---
  Sales?: number;

  // --- Order Type Split (System) ---
  "Dine In"?: number;
  Takeaway?: number;
  "Sale Order"?: number;
  "Birthday Cake"?: number;
  "Self Order"?: number;
  Sale?:number;

  // Note: The Python headers list "Sales" twice at the end.
  // In TypeScript, we can't have duplicate keys in an interface easily,
  // so this maps to the final data structure.

  // Fallback for dynamic keys if needed
  [key: string]: any;
}

export const overallSalesConfig: ReportConfig<OverallSalesReport> = {
  key: 'overallSales',
  title: 'Sales Summary', // standardized in full caps

  apiBase: `${REPORTS_API_BASE}/dayend/overallsales`,
  dateEndpoint: `${REPORTS_API_BASE}/dayend/overallsales/date-dropdown`,
  globalDropdownEndpoint: `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

  exportFilename: 'SalesReport',
  defaultPageSize: 30,

  filters: [
    { type: 'year', label: 'Fiscal Year', apiParam: 'fiscalYear' },
    { type: 'month', label: 'Fiscal Month', apiParam: 'fiscalMonth' },
    { type: 'day', label: 'Day', apiParam: 'day' },
    {
      type: 'locations',
      label: 'Branch',
      apiParam: 'branchName',
      searchable: true,
      paginated: true
    },
  ],

  columns: [
    // Identity
    { displayKey: "Code", dataKey: "Code", label: "Branch Code", align: 'left' },
    { displayKey: "Location", dataKey: "Location", label: "Branch Location", align: 'left' },
    { displayKey: "Sale Date", dataKey: "Sale Date", label: "Sale Date", align: 'center' },

    // Payment Modes
    { displayKey: "Cash", dataKey: "Cash", label: "Cash", align: 'right' },
    { displayKey: "Card", dataKey: "Card", label: "Card", align: 'right' },
    { displayKey: "Upi", dataKey: "Upi", label: "Upi", align: 'right' },
    { displayKey: "Cheque", dataKey: "Cheque", label: "Cheque", align: 'right' },
    { displayKey: "Emi", dataKey: "Emi", label: "Emi", align: 'right' },
    { displayKey: "Others", dataKey: "Others", label: "Others", align: 'right' },

    // First Total
    { displayKey: "Sales", dataKey: "Sales", label: "Sales Total", align: 'right', bold: true },

    // Order Type Breakdown
    { displayKey: "Dine In", dataKey: "Dine In", label: "Dine-In (KOT)", align: 'right' },
    { displayKey: "Takeaway", dataKey: "Takeaway", label: "Takeaway", align: 'right' },
    { displayKey: "Sale Order", dataKey: "Sale Order", label: "Sale Order", align: 'right' },
    { displayKey: "Birthday Cake", dataKey: "Birthday Cake", label: "Birthday Cake", align: 'right' },
    { displayKey: "Self Order", dataKey: "Self Order", label: "Self Order", align: 'right' },

    // Final Total
    { displayKey: "Sale", dataKey: "Sale", label: "Sale", align: 'right', bold: true },
  ],
};
