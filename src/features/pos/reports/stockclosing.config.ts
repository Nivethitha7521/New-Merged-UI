import { ReportConfig } from "@/features/reports-engine/types";
import { REPORTS_API_BASE } from "@/config/apiConfig";

export interface ClosingStockReport {
  // Item Details
  ItemCode?: string;
  SAPCode?: string;
  ItemName?: string;
  VarianceName?: string;
  Category?: string;
  U_SubCatgy?: string;
  UOM?: string;
  TaxCode?: string;
  HSN?: string;

  // Quantity & Financials
  ClosingQty?: number;
  SystemQty?: number;
  Variance?: number;
  "Unit Price"?: number;
  "Line Price"?: number;
  "Reqst.Qty"?: number;

  // Date / User / Location
  "Posting Date"?: string;
  CreatedBy?: string;
  firstName?: string;
  lastName?: string;
  Location?: string;

  // Internal/helper fields
  Line_ID?: number;
  PostingDate?: string;
  LocationId?: string;
  Amount?: number;
}

export const closingStockConfig: ReportConfig<ClosingStockReport> = {
  key: "stockclosing",
  title: "Stock Closing",

  apiBase: `${REPORTS_API_BASE}/closingstock`,
  dateEndpoint: `${REPORTS_API_BASE}/closingstock/date-dropdown`,
  globalDropdownEndpoint:
    `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

  exportFilename: "ClosingStockReport",
  defaultPageSize: 30,

  filters: [
    { type: "year", label: "Fiscal Year", apiParam: "year" },
    { type: "month", label: "Fiscal Month", apiParam: "month" },
    { type: "day", label: "Day", apiParam: "date" },
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
    {
      displayKey: "Category",
      dataKey: "Category",
      label: "Category",
      align: "left",
    },
    {
      displayKey: "U_SubCatgy",
      dataKey: "U_SubCatgy",
      label: "Sub Category",
      align: "left",
    },

    {
      displayKey: "ClosingQty",
      dataKey: "ClosingQty",
      label: "Closing Qty",
      align: "right",
    },
    {
      displayKey: "SystemQty",
      dataKey: "SystemQty",
      label: "System Qty",
      align: "right",
    },
    {
      displayKey: "Variance",
      dataKey: "Variance",
      label: "Variance",
      align: "right",
    },
    {
      displayKey: "Unit Price",
      dataKey: "Unit Price",
      label: "Unit Price",
      align: "right",
    },
    {
      displayKey: "Line Price",
      dataKey: "Line Price",
      label: "Line Price",
      align: "right",
    },

    {
      displayKey: "UOM",
      dataKey: "UOM",
      label: "UOM",
      align: "center",
    },
    {
      displayKey: "TaxCode",
      dataKey: "TaxCode",
      label: "Tax Code",
      align: "center",
    },
    {
      displayKey: "HSN",
      dataKey: "HSN",
      label: "HSN Code",
      align: "center",
    },

    {
      displayKey: "Posting Date",
      dataKey: "Posting Date",
      label: "Posting Date",
      align: "center",
    },
    {
      displayKey: "CreatedBy",
      dataKey: "CreatedBy",
      label: "Created By",
      align: "center",
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
      label: "Branch Location",
      align: "left",
    },
    {
      displayKey: "Reqst.Qty",
      dataKey: "Reqst.Qty",
      label: "Requested Qty",
      align: "right",
    },
  ],
};
