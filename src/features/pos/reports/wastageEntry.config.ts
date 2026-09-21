// ============================================================
// configs/wastageEntry.config.ts
// WASTAGE ENTRY report — Normal report only
// Shows all statuses except received / partially received
// ============================================================

import { ReportConfig } from "@/features/reports-engine/types";
import { REPORTS_API_BASE } from "@/config/apiConfig";

export interface WastageEntryReport {
  ItemCode?: string;
  SAPCode?: string;
  ItemName?: string;
  VarianceName?: string;
  Group?: string;
  "Sub-Group"?: string;
  UOM?: string;
  HSN?: number | string;

  Qty?: number;
  TaxCode?: string | null;
  Price?: number;
  Amount?: number;

  DocNo?: string;
  "Posting Date"?: string;
  ItemStatus?: string | null;
  Status?: string | null;

  CreatedBy?: string;
  firstName?: string;
  lastName?: string;

  Location?: string;
  ReasonName?: string;
}

export const wastageEntryConfig: ReportConfig<WastageEntryReport> = {
  key: "wastageEntry",
  title: "Wastage Entry",

  apiBase: `${REPORTS_API_BASE}/wastageEntrys`,
  dateEndpoint: `${REPORTS_API_BASE}/wastageEntrys/date-dropdown`,
  globalDropdownEndpoint:
    `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

  exportFilename: "WastageEntryReport",
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

    { displayKey: "Qty", dataKey: "Qty", label: "Qty", align: "right" },
    {
      displayKey: "TaxCode",
      dataKey: "TaxCode",
      label: "Tax Code",
      align: "left",
    },
    { displayKey: "Price", dataKey: "Price", label: "Price", align: "right" },
    {
      displayKey: "Amount",
      dataKey: "Amount",
      label: "Amount",
      align: "right",
    },

    {
      displayKey: "DocNo",
      dataKey: "DocNo",
      label: "Document No",
      align: "left",
    },
    {
      displayKey: "Posting Date",
      dataKey: "Posting Date",
      label: "Posting Date",
      align: "center",
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
      displayKey: "CreatedBy",
      dataKey: "CreatedBy",
      label: "Created By",
      align: "left",
    },
    {
      displayKey: "firstName",
      dataKey: "firstName",
      label: "First Name",
      align: "left",
    },
    {
      displayKey: "lastName",
      dataKey: "lastName",
      label: "Last Name",
      align: "left",
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
