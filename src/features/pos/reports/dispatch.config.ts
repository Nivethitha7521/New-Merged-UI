// ============================================================
// configs/dispatch.config.ts
// DISPATCH report — Dispatched / Cancelled only
// ============================================================

import { ReportConfig } from "@/features/reports-engine/types";
import { REPORTS_API_BASE } from "@/config/apiConfig";

export interface DispatchReport {
  DocNo?: string;
  LineID?: number;
  Status?: string;

  ItemCode?: string;
  SAPCode?: string;
  ItemName?: string;
  VarianceName?: string;
  Group?: string;
  "Sub-Group"?: string;
  UOM?: string;
  HSN?: string;

  SendQty?: number;
  DespDate?: string;
  DespTime?: string;

  Price?: number | string;
  Total?: number | string;
  TaxCode?: string | null;
  TaxAmt?: number | string | null;

  LoginID?: string;
  LoginName?: string;
  LastName?: string;
  LocationId?: string;
  Location?: string;

  VehicleName?: string;
  VehicleNo?: string;
  "Driver-ID"?: string;
  DriverName?: string;
  Initial?: string;
  LeadTime?: string;
  "Exp.Date"?: string;
}

export const dispatchConfig: ReportConfig<DispatchReport> = {
  key: "dispatch",
  title: "Dispatch Report",

  apiBase: `${REPORTS_API_BASE}/dispatch`,

  dateEndpoint: `${REPORTS_API_BASE}/dispatch/date-dropdown`,

  globalDropdownEndpoint:
    `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

  exportFilename: "Dispatch_Report",
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

  columns: [
    { displayKey: "DocNo", dataKey: "DocNo", label: "Doc No" },
    {
      displayKey: "LineID",
      dataKey: "LineID",
      label: "Line ID",
      align: "right",
    },
    { displayKey: "Status", dataKey: "Status", label: "Status" },

    { displayKey: "ItemCode", dataKey: "ItemCode", label: "Item Code" },
    { displayKey: "SAPCode", dataKey: "SAPCode", label: "SAP Code" },
    { displayKey: "ItemName", dataKey: "ItemName", label: "Item Name" },
    {
      displayKey: "VarianceName",
      dataKey: "VarianceName",
      label: "Variance Name",
    },
    { displayKey: "Group", dataKey: "Group", label: "Category" },
    { displayKey: "Sub-Group", dataKey: "Sub-Group", label: "Sub Category" },
    { displayKey: "UOM", dataKey: "UOM", label: "Unit of Measure" },
    { displayKey: "HSN", dataKey: "HSN", label: "HSN Code" },

    { displayKey: "SendQty", dataKey: "SendQty", label: "Qty", align: "right" },
    { displayKey: "DespDate", dataKey: "DespDate", label: "Date" },
    { displayKey: "DespTime", dataKey: "DespTime", label: "Dispatch Time" },

    { displayKey: "Price", dataKey: "Price", label: "Price", align: "right" },
    { displayKey: "Total", dataKey: "Total", label: "Amount", align: "right" },
    { displayKey: "TaxCode", dataKey: "TaxCode", label: "Tax Code" },
    {
      displayKey: "TaxAmt",
      dataKey: "TaxAmt",
      label: "Tax Amount",
      align: "right",
    },

    { displayKey: "LoginID", dataKey: "LoginID", label: "Login ID" },
    { displayKey: "LoginName", dataKey: "LoginName", label: "Login Name" },
    { displayKey: "LastName", dataKey: "LastName", label: "Last Name" },
    { displayKey: "LocationId", dataKey: "LocationId", label: "Location ID" },
    { displayKey: "Location", dataKey: "Location", label: "Branch Name" },
    {
      displayKey: "VehicleName",
      dataKey: "VehicleName",
      label: "Vehicle Name",
    },
    { displayKey: "VehicleNo", dataKey: "VehicleNo", label: "Vehicle Number" },
    { displayKey: "Driver-ID", dataKey: "Driver-ID", label: "Driver ID" },
    { displayKey: "DriverName", dataKey: "DriverName", label: "Driver Name" },
    { displayKey: "Initial", dataKey: "Initial", label: "Initial" },
    { displayKey: "LeadTime", dataKey: "LeadTime", label: "Lead Time" },
    { displayKey: "Exp.Date", dataKey: "Exp.Date", label: "Expiry Date" },
  ],
};
