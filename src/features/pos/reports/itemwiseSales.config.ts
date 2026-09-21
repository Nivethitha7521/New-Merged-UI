// ============================================================
// configs/itemwiseSales.config.ts
// ITEMWISE SALES report — Standardized Config
// ============================================================

import { ReportConfig } from "@/features/reports-engine/types";
import { REPORTS_API_BASE } from "@/config/apiConfig";

export interface ItemwiseSalesReport {
  screenID?: string;
  rowNo?: number;
  billDate?: string;
  billTime?: string;
  billNo?: string;
  itemCode?: string;
  itemName?: string;
  uom?: string;
  hsn?: string;
  categoryName?: string;
  subGroup?: string;
  varianceName?: string;
  itemPrice?: number;
  qty?: number;
  tax?: string;
  DiscountAmount?: number;
  netValue?: number;
  taxValue?: number;
  lineTotal?: number;
  loginID?: string;
  loginName?: string;
  lastName?: string;
  branchName?: string;
  customerNo?: string;
  saleOrderNo?: string;
  salesPerson?: string;
  salesPersonId?: number | string;
  initial?: string;
  s_no?: number;
  customCharge?: number;
  customChargeTax?: number;
  customChargeNet?: number;
  DocumentTotal?: number;
}

export const itemwiseSalesConfig: ReportConfig<ItemwiseSalesReport> = {
  key: "itemwiseSales", // Unique key for Redux
  title: "Itemwise sales",
  apiBase: `${REPORTS_API_BASE}/itemwiseSales`,

  dateEndpoint: `${REPORTS_API_BASE}/itemwiseSales/date-dropdown`,

  // Assuming global dropdowns might be shared or have a specific endpoint
  // If this report has specific dropdowns, change this URL.
  // Otherwise, keep it consistent with other reports or remove to use apiBase.
  globalDropdownEndpoint:
    `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

  exportFilename: "Itemwisesales",
  defaultPageSize: 30,

  filters: [
    { type: "year", label: "Fiscal Year", apiParam: "fiscalYear" },
    { type: "month", label: "Fiscal Month", apiParam: "fiscalMonth" },
    { type: "day", label: "Day", apiParam: "day" },

    // Global Filters
    {
      type: "locations",
      label: "branchName",
      apiParam: "branchName",
      searchable: true,
      paginated: true,
    },
  ],

  columns: [
    // Identity
    {
      displayKey: "screenID",
      dataKey: "screenID",
      label: "Screen ID",
      align: "left",
    },
    { displayKey: "rowNo", dataKey: "rowNo", label: "Row No", align: "center" },
    {
      displayKey: "billNo",
      dataKey: "billNo",
      label: "Bill No",
      align: "left",
    },
    {
      displayKey: "billDate",
      dataKey: "billDate",
      label: "Bill Date",
      align: "center",
    },
    {
      displayKey: "billTime",
      dataKey: "billTime",
      label: "Bill Time",
      align: "center",
    },

    // Item Details
    {
      displayKey: "itemCode",
      dataKey: "itemCode",
      label: "Item Code",
      align: "left",
    },
    {
      displayKey: "itemName",
      dataKey: "itemName",
      label: "Item Name",
      align: "left",
    },
    {
      displayKey: "varianceName",
      dataKey: "varianceName",
      label: "Variance",
      align: "left",
    },
    { displayKey: "uom", dataKey: "uom", label: "UOM", align: "center" },
    { displayKey: "hsn", dataKey: "hsn", label: "HSN Code", align: "center" },
    {
      displayKey: "categoryName",
      dataKey: "categoryName",
      label: "Category",
      align: "left",
    },
    {
      displayKey: "subGroup",
      dataKey: "subGroup",
      label: "Sub Category",
      align: "left",
    },

    // Financials per Item
    {
      displayKey: "itemPrice",
      dataKey: "itemPrice",
      label: "Item Price",
      align: "right",
    },
    { displayKey: "qty", dataKey: "qty", label: "Quantity", align: "right" },
    {
      displayKey: "DiscountAmount",
      dataKey: "DiscountAmount",
      label: "Discount Amount",
      align: "right",
    },
    { displayKey: "tax", dataKey: "tax", label: "Tax Code", align: "center" },
    {
      displayKey: "taxValue",
      dataKey: "taxValue",
      label: "Tax Value",
      align: "right",
    },
    {
      displayKey: "netValue",
      dataKey: "netValue",
      label: "Net Value",
      align: "right",
    },
    {
      displayKey: "lineTotal",
      dataKey: "lineTotal",
      label: "Line Total",
      align: "right",
    },

    // Custom Charges
    {
      displayKey: "customCharge",
      dataKey: "customCharge",
      label: "Custom Charge",
      align: "right",
    },
    {
      displayKey: "customChargeTax",
      dataKey: "customChargeTax",
      label: "Custom Charge Tax",
      align: "right",
    },
    {
      displayKey: "customChargeNet",
      dataKey: "customChargeNet",
      label: "Custom Charge Net",
      align: "right",
    },
    {
      displayKey: "DocumentTotal",
      dataKey: "DocumentTotal",
      label: "Document Total",
      align: "right",
    },

    // User & Branch Info
    {
      displayKey: "loginID",
      dataKey: "loginID",
      label: "Login ID",
      align: "center",
    },
    {
      displayKey: "loginName",
      dataKey: "loginName",
      label: "Login Name",
      align: "left",
    },
    {
      displayKey: "lastName",
      dataKey: "lastName",
      label: "Last Name",
      align: "left",
    },
    {
      displayKey: "branchName",
      dataKey: "branchName",
      label: "Branch",
      align: "left",
    },
    {
      displayKey: "customerNo",
      dataKey: "customerNo",
      label: "Customer No",
      align: "left",
    },
    {
      displayKey: "saleOrderNo",
      dataKey: "saleOrderNo",
      label: "Sales Order No",
      align: "left",
    },

    // Salesperson
    {
      displayKey: "salesPersonId",
      dataKey: "salesPersonId",
      label: "Sales Person ID",
      align: "center",
    },
    {
      displayKey: "salesPerson",
      dataKey: "salesPerson",
      label: "Sales Person",
      align: "left",
    },
    {
      displayKey: "initial",
      dataKey: "initial",
      label: "Initial",
      align: "center",
    },
  ],
};
