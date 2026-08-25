// ============================================================
// configs/productionEntry.config.ts
// PRODUCTION ENTRY report config.
// ============================================================

import { ReportConfig } from '@/features/reports-engine/types';
import { REPORTS_API_BASE } from '@/config/apiConfig';

// ---- Data model (only used for TypeScript safety) ----
export interface ProductionEntryRow {
  productionEntryNumber?: string;
  lineId?: number;
  itemCode?: string;
  category?: string;
  itemName?: string;
  varianceName?: string;
  subcategory?: string;
  qty?: number;
  adjustedQty?: number;

  varianceValue?: number;
  sapCode?: string;
  uom?: string;
  createdBy?: string;
  despatchDateTime: string;
  date?: string;
  productionTime?: string;
  hsnCode?: number;
  LeadTime?: number;
  firstName?: string;
  lastName?: string;
  ExpDate?: string;
  status?: string;
  editReason: string;
}

export const productionEntryConfig: ReportConfig<ProductionEntryRow> = {
  key: 'productionEntry',
  title: 'Production Report',
  apiBase: `${REPORTS_API_BASE}/productionEntry`,

  // NEW: Specific endpoint for Production Entry Date Filters
  dateEndpoint: `${REPORTS_API_BASE}/productionEntry/date-dropdown`,

  exportFilename: 'ProductionEntry',
  defaultPageSize: 30,

  // ---- Filters: declare which dropdowns to show ----
  filters: [
    { type: 'year', label: 'Fiscal Year', apiParam: 'fiscalYear' },
    { type: 'month', label: 'Fiscal Month', apiParam: 'fiscalMonth' },
    { type: 'day', label: 'Fiscal Day', apiParam: 'day' },
    { type: 'variance', label: 'Variance Name', apiParam: 'varianceName', searchable: true, paginated: true },
  ],

  // ---- Columns: every column shown in the table ----
  columns: [
    { displayKey: 'productionEntryNumber', dataKey: 'productionEntryNumber', label: 'Entry No' },
    { displayKey: 'date', dataKey: 'date', label: 'Date' },
    { displayKey: 'productionTime', dataKey: 'productionTime', label: 'Time' },
    { displayKey: 'lineId', dataKey: 'lineId', label: 'Line ID', align: 'center' },
    { displayKey: 'status', dataKey: 'status', label: 'Status' },

    { displayKey: 'itemCode', dataKey: 'itemCode', label: 'Item Code' },
    { displayKey: 'sapCode', dataKey: 'sapCode', label: 'SAP Code' },

    { displayKey: 'itemName', dataKey: 'itemName', label: 'Item Name' },
    { displayKey: 'varianceName', dataKey: 'varianceName', label: 'Variance' },
    { displayKey: 'category', dataKey: 'category', label: 'Category' },
    { displayKey: 'subcategory', dataKey: 'subcategory', label: 'Subcategory' },
    { displayKey: 'hsnCode', dataKey: 'hsnCode', label: 'HSN', align: 'center' },
    { displayKey: 'uom', dataKey: 'uom', label: 'UOM' },

    { displayKey: 'qty', dataKey: 'qty', label: 'Qty', align: 'right' },
    { displayKey: 'adjustedQty', dataKey: 'adjustedQty', label: 'Adjusted Qty', align: 'right' },
    { displayKey: 'varianceValue', dataKey: 'varianceValue', label: 'Variance', align: 'right' },

    { displayKey: 'createdBy', dataKey: 'createdBy', label: 'Created By' },
    { displayKey: 'firstName', dataKey: 'firstName', label: 'First Name' },
    { displayKey: 'lastName', dataKey: 'lastName', label: 'Last Name' },
    { displayKey: 'despatchDateTime', dataKey: 'despatchDateTime', label: 'Dispatch Time' },

    { displayKey: 'LeadTime', dataKey: 'LeadTime', label: 'Lead Time', align: 'right' },
    { displayKey: 'ExpDate', dataKey: 'ExpDate', label: 'Expiry' },
    { displayKey: 'editReason', dataKey: 'editReason', label: 'Adjustment Reason' },
  ]

};
