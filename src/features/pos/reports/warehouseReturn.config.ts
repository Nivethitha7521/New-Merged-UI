// ============================================================
// configs/wastageReceive.config.ts
// WAREHOUSE RETURN report — Standardized Config
// ============================================================

import { ReportConfig } from '@/features/reports-engine/types';
import { REPORTS_API_BASE } from '@/config/apiConfig';

export interface WarehouseReturnReport {
  // Document Identifiers
  DocNo?: string;
  UniqueDocNo?: string;
  Line_ID?: number; // Maps to 'Line_ID' from backend

  // Item Details
  ItemCode?: string;
  ItemName?: string;
  VarianceName?: string;
  Group?: string;
  'Sub-Group'?: string; // Maps to 'Sub-Group' alias
  UOM?: string;
  HSN?: string;

  // Quantity & Financials
  TransferQty?: number;
  ReciveQty?: number;
  Price?: number;
  Total?: number;
  TaxCode?: string;
  TaxAmt?: number;
  Status?: string;
  // User & Receiver Details
  'Rec.ID'?: string;
  'Rec.Name'?: string;
  lastName?: string;
  Variance?: number;
  // Transport Details
  DriverCode?: string;
  VehicleNo?: string;

  // Date & Time
  'Rec.Date'?: string;
  'Rec.Time'?: string;

  // Location & Reason
  Location?: string;
  ReasonName?: string;
}

export const warehouseReturnConfig: ReportConfig<WarehouseReturnReport> = {
  key: 'warehouseReturn',
  title: 'Warehouse return', // standardized in full caps

  apiBase: `${REPORTS_API_BASE}/WarehouseReturn`,
  dateEndpoint: `${REPORTS_API_BASE}/WarehouseReturn/date-dropdown`,
  globalDropdownEndpoint: `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

  exportFilename: 'WarehouseReturnReport',
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
    // Document Info
    { displayKey: "DocNo", dataKey: "DocNo", label: "Document No", align: 'left' },
    { displayKey: "UniqueDocNo", dataKey: "UniqueDocNo", label: "Unique Doc No", align: 'left' },
    { displayKey: "Line_ID", dataKey: "Line_ID", label: "Line ID", align: 'center' },

    // Item Details
    { displayKey: "ItemCode", dataKey: "ItemCode", label: "Item Code", align: 'left' },
    { displayKey: "ItemName", dataKey: "ItemName", label: "Item Name", align: 'left' },
    { displayKey: "VarianceName", dataKey: "VarianceName", label: "Variance", align: 'left' },
    { displayKey: "Group", dataKey: "Group", label: "Category", align: 'left' },
    { displayKey: "Sub-Group", dataKey: "Sub-Group", label: "Sub Category", align: 'left' },
    { displayKey: "UOM", dataKey: "UOM", label: "UOM", align: 'center' },
    { displayKey: "HSN", dataKey: "HSN", label: "HSN Code", align: 'center' },

    // Quantities & Variance
    { displayKey: "TransferQty", dataKey: "TransferQty", label: "Transfer Qty", align: 'right' },
    { displayKey: "ReciveQty", dataKey: "ReciveQty", label: "Received Qty", align: 'right' },
    { displayKey: "Variance", dataKey: "Variance", label: "Variance", align: 'right' },

    // Financials
    { displayKey: "Price", dataKey: "Price", label: "Unit Price", align: 'right' },
    { displayKey: "Total", dataKey: "Total", label: "Total Amount", align: 'right' },
    { displayKey: "TaxCode", dataKey: "TaxCode", label: "Tax Code", align: 'center' },
    { displayKey: "TaxAmt", dataKey: "TaxAmt", label: "Tax Amount", align: 'right' },

    // Receiver Details
    { displayKey: "Rec.ID", dataKey: "Rec.ID", label: "Received By (ID)", align: 'center' },
    { displayKey: "Rec.Name", dataKey: "Rec.Name", label: "Received By (Name)", align: 'left' },
    { displayKey: "lastName", dataKey: "lastName", label: "Last Name", align: 'left' },

    // Logistics
    { displayKey: "DriverCode", dataKey: "DriverCode", label: "Driver Code", align: 'center' },
    { displayKey: "VehicleNo", dataKey: "VehicleNo", label: "Vehicle No", align: 'left' },

    // Date & Time
    { displayKey: "Rec.Date", dataKey: "Rec.Date", label: "Receive Date", align: 'center' },
    { displayKey: "Rec.Time", dataKey: "Rec.Time", label: "Receive Time", align: 'center' },

    // Location & Reason
    { displayKey: "Location", dataKey: "Location", label: "Branch Location", align: 'left' },
    { displayKey: "Status", dataKey: "Status", label: "Status", align: 'center' },
    { displayKey: "ReasonName", dataKey: "ReasonName", label: "Reason", align: 'left' },
  ],
};
