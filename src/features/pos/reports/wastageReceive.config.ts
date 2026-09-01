// ============================================================
// configs/wastageRecReport.config.ts
// WASTAGE Receive report — Received / Partially Received only
// ============================================================

import { ReportConfig } from "@/features/reports-engine/types";
import { REPORTS_API_BASE } from "@/config/apiConfig";

export interface WastageRecReport {
  DocNo?: string;
  UniqueDocNo?: string | null;

  ItemCode?: string;
  SAPCode?: string;
  ItemName?: string;
  VarianceName?: string;
  Group?: string;
  "Sub-Group"?: string;
  UOM?: string;
  HSN?: number | string;

  TransferQty?: number;
  ReciveQty?: number | null;
  Variance?: number | null;
  Price?: number;
  Total?: number;
  TaxCode?: string | null;
  TaxAmt?: number | null;

  ItemStatus?: string | null;
  Status?: string | null;

  "Rec.ID"?: string;
  "Rec.Name"?: string;
  lastName?: string;

  DriverCode?: string | null;
  VehicleNo?: string | null;

  "Rec.Date"?: string;
  "Rec.Time"?: string;

  Location?: string;
  ReasonName?: string;
}

export const wastageRecConfig: ReportConfig<WastageRecReport> = {
  key: "wastageRec",
  title: "Wastage Receive",

  apiBase: `${REPORTS_API_BASE}/wastageEntrys/received`,
  dateEndpoint:
    `${REPORTS_API_BASE}/wastageEntrys/received-date-dropdown`,
  globalDropdownEndpoint:
    `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

  exportFilename: "Wastage_Receive_Report",
  defaultPageSize: 30,

  filters: [
    { type: "year", label: "Fiscal Year", apiParam: "fiscalYear" },
    { type: "month", label: "Fiscal Month", apiParam: "fiscalMonth" },
    { type: "day", label: "Day", apiParam: "day" },
    {
      type: "locations",
      label: "Branch",
      apiParam: "branchName",
      searchable: true,
      paginated: true,
    },
  ],

  columns: [
    {
      displayKey: "DocNo",
      dataKey: "DocNo",
      label: "Document No",
      align: "left",
    },
    {
      displayKey: "UniqueDocNo",
      dataKey: "UniqueDocNo",
      label: "Unique Doc No",
      align: "left",
    },

    {
      displayKey: "ItemCode",
      dataKey: "ItemCode",
      label: "Item Code",
      align: "left",
    },
    {
      displayKey: "SAPCode",
      dataKey: "SAPCode",
      label: "SAP Code",
      align: "left",
    },
    {
      displayKey: "ItemName",
      dataKey: "ItemName",
      label: "Item Name",
      align: "left",
    },
    {
      displayKey: "VarianceName",
      dataKey: "VarianceName",
      label: "Variance Name",
      align: "left",
    },
    { displayKey: "Group", dataKey: "Group", label: "Category", align: "left" },
    {
      displayKey: "Sub-Group",
      dataKey: "Sub-Group",
      label: "Sub Category",
      align: "left",
    },
    { displayKey: "UOM", dataKey: "UOM", label: "UOM", align: "center" },
    { displayKey: "HSN", dataKey: "HSN", label: "HSN Code", align: "center" },

    {
      displayKey: "TransferQty",
      dataKey: "TransferQty",
      label: "Transfer Qty",
      align: "right",
    },
    {
      displayKey: "ReciveQty",
      dataKey: "ReciveQty",
      label: "Receive Qty",
      align: "right",
    },
    {
      displayKey: "Variance",
      dataKey: "Variance",
      label: "Variance",
      align: "right",
    },

    { displayKey: "Price", dataKey: "Price", label: "Price", align: "right" },
    { displayKey: "Total", dataKey: "Total", label: "Total", align: "right" },
    {
      displayKey: "TaxCode",
      dataKey: "TaxCode",
      label: "Tax Code",
      align: "left",
    },
    {
      displayKey: "TaxAmt",
      dataKey: "TaxAmt",
      label: "Tax Amount",
      align: "right",
    },

    {
      displayKey: "ItemStatus",
      dataKey: "ItemStatus",
      label: "Item Status",
      align: "center",
    },
    {
      displayKey: "Status",
      dataKey: "Status",
      label: "Status",
      align: "center",
    },

    {
      displayKey: "Rec.ID",
      dataKey: "Rec.ID",
      label: "Rec. ID",
      align: "left",
    },
    {
      displayKey: "Rec.Name",
      dataKey: "Rec.Name",
      label: "Rec. Name",
      align: "left",
    },
    {
      displayKey: "lastName",
      dataKey: "lastName",
      label: "Last Name",
      align: "left",
    },

    {
      displayKey: "DriverCode",
      dataKey: "DriverCode",
      label: "Driver Code",
      align: "left",
    },
    {
      displayKey: "VehicleNo",
      dataKey: "VehicleNo",
      label: "Vehicle No",
      align: "left",
    },

    {
      displayKey: "Rec.Date",
      dataKey: "Rec.Date",
      label: "Receive Date",
      align: "center",
    },
    {
      displayKey: "Rec.Time",
      dataKey: "Rec.Time",
      label: "Receive Time",
      align: "center",
    },

    {
      displayKey: "Location",
      dataKey: "Location",
      label: "Location",
      align: "left",
    },
    {
      displayKey: "ReasonName",
      dataKey: "ReasonName",
      label: "Reason",
      align: "left",
    },
  ],
};
