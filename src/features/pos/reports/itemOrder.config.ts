// ============================================================
// configs/itemOrder.config.ts
// ITEM ORDER report — Standardized Config
// ============================================================

import { ReportConfig } from '@/features/reports-engine/types';
import { REPORTS_API_BASE } from '@/config/apiConfig';

export interface ItemOrderReport {
  billDate?: string | null;
  billTime?: string;
  billNo?: string;
  netAmount?: string;
  discount?: string;
  billTax?: string;
  billTotalAmount?: string;
  locationName?: string;
  customerNo?: string;
  firstName?: string;
  lastName?: string;
  empId?: string;
  salesPersonName?: string;
  types?: string;
  customCharge?: string;
}

export const itemOrderConfig: ReportConfig<ItemOrderReport> = {
  key: 'itemOrder', // Unique key for Redux
  title: 'Orderwise Sales',

  apiBase: `${REPORTS_API_BASE}/itemOrder`,

  dateEndpoint: `${REPORTS_API_BASE}/itemOrder/date-dropdown`,

  // Reusing the global dropdowns from Production Entry (or change if Item Order has its own)
  globalDropdownEndpoint: `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

  exportFilename: 'Itemorder_',
  defaultPageSize: 30,

  filters: [
    { type: 'year', label: 'Fiscal Year', apiParam: 'fiscalYear' },
    { type: 'month', label: 'Fiscal Month', apiParam: 'fiscalMonth' },
    { type: 'day', label: 'Day', apiParam: 'day' },

    // Global Filters
    {
      type: 'locations',
      label: 'branchName',
      apiParam: 'branchName',
      searchable: true,
      paginated: true
    },

  ],

  columns: [
    // Identity
    { displayKey: "billNo", dataKey: "billNo", label: "Bill No", align: 'left' },
    { displayKey: "billDate", dataKey: "billDate", label: "Bill Date", align: 'center' },
    { displayKey: "billTime", dataKey: "billTime", label: "Bill Time", align: 'center' },

    // Financials
    { displayKey: "netAmount", dataKey: "netAmount", label: "Net Amount", align: 'right' },
    { displayKey: "discount", dataKey: "discount", label: "Discount", align: 'right' },
    { displayKey: "billTax", dataKey: "billTax", label: "Tax Amount", align: 'right' },
    { displayKey: "customCharge", dataKey: "customCharge", label: "Custom Charge", align: 'right' },
    { displayKey: "billTotalAmount", dataKey: "billTotalAmount", label: "Total Amount", align: 'right' },

    // Customer & Location
    { displayKey: "locationName", dataKey: "locationName", label: "Branch Location", align: 'left' },
    { displayKey: "customerNo", dataKey: "customerNo", label: "Customer No", align: 'left' },
    { displayKey: "firstName", dataKey: "firstName", label: "First Name", align: 'left' },
    { displayKey: "lastName", dataKey: "lastName", label: "Last Name", align: 'left' },

    // Salesperson
    { displayKey: "empId", dataKey: "empId", label: "Employee ID", align: 'center' },
    { displayKey: "salesPersonName", dataKey: "salesPersonName", label: "Sales Person", align: 'left' },

    // Misc
    { displayKey: "types", dataKey: "types", label: "Type", align: 'left' },
  ],
};
