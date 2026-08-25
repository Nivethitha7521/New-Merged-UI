// ============================================================
// configs/dayend.config.ts
// DAYEND report — Manual Payment Summary Format
// ============================================================

import { ReportConfig } from "@/features/reports-engine/types";
import { REPORTS_API_BASE } from "@/config/apiConfig";

export interface DayendReport {
  Date?: string | null;
  Time?: string | null;
  Branch?: string | null;

  Cash?: number;
  Card?: number;
  UPI?: number;
  EMI?: number;
  "Others/Online"?: number;
  "Total Amount"?: number;

  // Fallback for dynamic engine support
  [key: string]: any;
}

export const dayendConfig: ReportConfig<DayendReport> = {
  key: "dayend",
  title: "Dayend",

  apiBase: `${REPORTS_API_BASE}/dayend`,
  dateEndpoint: `${REPORTS_API_BASE}/dayend/date-dropdown`,
  globalDropdownEndpoint:
    `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

  exportFilename: "DayendReport",
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
      displayKey: "Date",
      dataKey: "Date",
      label: "Date",
      align: "center",
      width: 90,
    },
    {
      displayKey: "Time",
      dataKey: "Time",
      label: "Time",
      align: "center",
      width: 100,
    },
    {
      displayKey: "Branch",
      dataKey: "Branch",
      label: "Branch",
      align: "left",
      width: 170,
    },
    {
      displayKey: "Cash",
      dataKey: "Cash",
      label: "Cash",
      align: "right",
      width: 120,
    },
    {
      displayKey: "Card",
      dataKey: "Card",
      label: "Card",
      align: "right",
      width: 120,
    },
    {
      displayKey: "UPI",
      dataKey: "UPI",
      label: "UPI",
      align: "right",
      width: 120,
    },
    {
      displayKey: "EMI",
      dataKey: "EMI",
      label: "EMI",
      align: "right",
      width: 120,
    },
    {
      displayKey: "Others/Online",
      dataKey: "Others/Online",
      label: "Others/Online",
      align: "right",
      width: 150,
    },
    {
      displayKey: "Total Amount",
      dataKey: "Total Amount",
      label: "Total Amount",
      align: "right",
      width: 150,
      bold: true,
    },
  ],
};
