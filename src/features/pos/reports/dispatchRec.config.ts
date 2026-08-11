// ============================================================
// configs/dispatch.config.ts
// DISPATCH report — Updated for Dispatch vs Receive View
// ============================================================

import { ReportConfig } from "@/features/reports-engine/types";
import { REPORTS_API_BASE } from "@/config/apiConfig";

export interface DispatchesReport {
  // --- Identity ---
  DocNo?: string;
  LineID?: number;
  Status?: string;


  // --- Item Details ---
  ItemCode?: string;
  SAPCode?: string;
  ItemName?: string;
  VarianceName?: string;
  Group?: string;
  "Sub-Group"?: string;
  UOM?: string;
  HSN?: string;

  // --- DISPATCHED (Left Side) ---
  Qty?: number; // Dynamic Qty (Weight/Pcs)
  Date?: string; // Date part of 'date'
  "Desp.Time"?: string; // Time part of 'date'

  // --- RECEIVED (Right Side) ---
  ReceivedQty?: number; // Dynamic Qty (Weight/Pcs)
  RecvDate?: string; // Date part of 'receivedTime'
  ReceiveTime?: string; // Time part of 'receivedTime'

  // --- Variance & Financials ---
  Variance?: number; // Difference calculation
  Price?: number;
  Total?: number;
  TaxCode?: string;
  TaxAmt?: string | number;

  // --- Logistics & Meta ---
  LoginID?: string;
  LoginName?: string;
  LastName?: string;
  LocationId?: number | string;
  Location?: string;
  VehicleName?: string;
  VehicleNo?: string;
  "Driver-ID"?: string;
  DriverName?: string;
  Initial?: string;
  LeadTime?: number | string;
  ExpDate?: string;
}

export const dispatchRecConfig: ReportConfig<DispatchesReport> = {
  key: "dispatchRec",
  title: "DispatchReceive Report",

  apiBase: `${REPORTS_API_BASE}/dispatch/received`,
  dateEndpoint: `${REPORTS_API_BASE}/dispatch/date-dropdown`,
  globalDropdownEndpoint:
    `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

  exportFilename: "DispatchesRec_export",
  defaultPageSize: 30,

  filters: [
    { type: "year", label: "Fiscal Year", apiParam: "fiscalYear" },
    { type: "month", label: "Fiscal Month", apiParam: "fiscalMonth" },
    { type: "day", label: "Day", apiParam: "day" },

    {
      type: "variance",
      label: "Variance Name",
      apiParam: "varianceName",
      searchable: true,
      paginated: true,
    },
    {
      type: "locations",
      label: "Branch",
      apiParam: "branchName",
      searchable: true,
      paginated: true,
    },
  ],

  // Columns matching the new Python Header Order (Left/Right Split)
  columns: [
    // Identity
    {
      displayKey: "DocNo",
      dataKey: "DocNo",
      label: "Document No",
      width: 90,
      frozen: true,
      align: "left",
    },
    {
      displayKey: "LineID",
      dataKey: "LineID",
      label: "Line ID",
      width: 70,
      align: "center",
    },
    {
      displayKey: "Status",
      dataKey: "Status",
      label: "Status",
      width: 80,
      align: "center",
    },

    // Item Details
    {
      displayKey: "ItemCode",
      dataKey: "ItemCode",
      label: "Item Code",
      width: 120,
      align: "left",
    },
    {
      displayKey: "SAPCode",
      dataKey: "SAPCode",
      label: "SAP Code",
      width: 120,
      align: "left",
    },

    {
      displayKey: "ItemName",
      dataKey: "ItemName",
      label: "Item Name",
      width: 200,
      align: "left",
    },
    {
      displayKey: "VarianceName",
      dataKey: "VarianceName",
      label: "Variance",
      width: 120,
      align: "left",
    },
    {
      displayKey: "Group",
      dataKey: "Group",
      label: "Category",
      width: 120,
      align: "left",
    },
    {
      displayKey: "Sub-Group",
      dataKey: "Sub-Group",
      label: "Sub Category",
      width: 120,
      align: "left",
    },
    {
      displayKey: "UOM",
      dataKey: "UOM",
      label: "UOM",
      width: 80,
      align: "center",
    },
    {
      displayKey: "HSN",
      dataKey: "HSN",
      label: "HSN Code",
      width: 100,
      align: "center",
    },

    // Dispatch Side
    {
      displayKey: "Qty",
      dataKey: "Qty",
      label: "Dispatched Qty",
      align: "right",
      width: 90,
      bold: true,
    },
    {
      displayKey: "Date",
      dataKey: "Date",
      label: "Dispatch Date",
      width: 100,
      align: "center",
    },
    {
      displayKey: "Desp.Time",
      dataKey: "Desp.Time",
      label: "Dispatch Time",
      width: 90,
      align: "center",
    },

    // Receive Side
    {
      displayKey: "ReceivedQty",
      dataKey: "ReceivedQty",
      label: "Received Qty",
      align: "right",
      width: 90,
      bold: true,
    },
    {
      displayKey: "RecvDate",
      dataKey: "RecvDate",
      label: "Receive Date",
      width: 100,
      align: "center",
    },
    {
      displayKey: "ReceiveTime",
      dataKey: "ReceiveTime",
      label: "Receive Time",
      width: 90,
      align: "center",
    },

    // Variance & Financials
    {
      displayKey: "Variance",
      dataKey: "Variance",
      label: "Qty Variance",
      align: "right",
      width: 90,
      color: "red",
    },
    {
      displayKey: "Price",
      dataKey: "Price",
      label: "Price",
      align: "right",
      width: 90,
    },
    {
      displayKey: "Total",
      dataKey: "Total",
      label: "Amount",
      align: "right",
      width: 110,
    },
    {
      displayKey: "TaxCode",
      dataKey: "TaxCode",
      label: "Tax Code",
      width: 80,
      align: "center",
    },
    {
      displayKey: "TaxAmt",
      dataKey: "TaxAmt",
      label: "Tax Amt",
      align: "right",
      width: 90,
    },

    // Logistics
    {
      displayKey: "Location",
      dataKey: "Location",
      label: "Branch",
      width: 150,
      align: "left",
    },
    {
      displayKey: "VehicleName",
      dataKey: "VehicleName",
      label: "Vehicle",
      width: 100,
      align: "left",
    },
    {
      displayKey: "VehicleNo",
      dataKey: "VehicleNo",
      label: "Vehicle No",
      width: 100,
      align: "left",
    },
    {
      displayKey: "DriverName",
      dataKey: "DriverName",
      label: "Driver Name",
      width: 120,
      align: "left",
    },
    {
      displayKey: "LeadTime",
      dataKey: "LeadTime",
      label: "Lead Time",
      width: 80,
      align: "center",
    },
    {
      displayKey: "ExpDate",
      dataKey: "ExpDate",
      label: "Expiry Date",
      width: 100,
      align: "center",
    },
  ],
};
