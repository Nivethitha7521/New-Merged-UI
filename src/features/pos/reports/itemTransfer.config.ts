// ============================================================
// configs/itemTransfer.config.ts
// ITEM TRANSFER report — Standardized Config
// ============================================================

import { ReportConfig } from '@/features/reports-engine/types';
import { REPORTS_API_BASE } from '@/config/apiConfig';

export interface ItemTransferReport {
  DocNo?: string;
  LineID?: number;
  ItemCode?: string | null;
  ItemName?: string | null;
  varianceName?: string | null;
  Group?: string | null;
  "Sub-Group"?: string | null;
  UOM?: string | null;
  HSN?: string | null;
  ReqQty?: number;
  TransferQty?: number;
  ReceivedQty?: number;
  Status?: string;
  "Recv.Variance"?: number;
  "Unit Price"?: number;
  ReceivePrice?: string | null;
  "From.Loc"?: string | null;
  "To.Loc"?: string | null;
  "Tran.Date"?: string | null;
  "Tran.Time"?: string | null;
  "Recv.Date"?: string | null;
  "Recv.Time"?: string | null;
  DriverCode?: string | null;
  DriverName?: string | null;
  VehicleCode?: string | null;
  VehicleName?: string | null;
  "Trans.LogID"?: string | null;
  "Trans.Name"?: string | null;
  "Recv.LogID"?: string | null;
  "Recv.Name"?: string | null;
}

export const itemTransferConfig: ReportConfig<ItemTransferReport> = {
  key: 'itemTransfer',
  title: 'Itemtransfer', // standardized in full caps

  apiBase: `${REPORTS_API_BASE}/ItemTransfers`,
  dateEndpoint: `${REPORTS_API_BASE}/ItemTransfers/date-dropdown`,
  globalDropdownEndpoint: `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

  exportFilename: 'ItemTransferReport',
  defaultPageSize: 30,

  filters: [
    { type: 'year', label: 'Fiscal Year', apiParam: 'fiscalYear' },
    { type: 'month', label: 'Fiscal Month', apiParam: 'fiscalMonth' },
    { type: 'day', label: 'Day', apiParam: 'day' },
    {
      type: 'locations',
      label: 'From Branch',
      apiParam: 'frombranchName',
      searchable: true,
      paginated: true
    },
    {
      type: 'locations',
      label: 'To Branch',
      apiParam: 'tobranchName',
      searchable: true,
      paginated: true
    },
  ],

  columns: [
    // Identity & Item
    { displayKey: "DocNo", dataKey: "DocNo", label: "Document No", align: 'left' },
    { displayKey: "LineID", dataKey: "LineID", label: "Line ID", align: 'center' },
    { displayKey: "ItemCode", dataKey: "ItemCode", label: "Item Code", align: 'left' },
    { displayKey: "ItemName", dataKey: "ItemName", label: "Item Name", align: 'left' },
    { displayKey: "varianceName", dataKey: "varianceName", label: "Variance", align: 'left' },
    { displayKey: "Group", dataKey: "Group", label: "Category", align: 'left' },
    { displayKey: "Sub-Group", dataKey: "Sub-Group", label: "Sub Category", align: 'left' },
    { displayKey: "UOM", dataKey: "UOM", label: "UOM", align: 'center' },
    { displayKey: "HSN", dataKey: "HSN", label: "HSN Code", align: 'center' },

    // Quantities & Status
    { displayKey: "ReqQty", dataKey: "ReqQty", label: "Requested Qty", align: 'right' },
    { displayKey: "TransferQty", dataKey: "TransferQty", label: "Transferred Qty", align: 'right' },
    { displayKey: "ReceivedQty", dataKey: "ReceivedQty", label: "Received Qty", align: 'right' },

    { displayKey: "Recv.Variance", dataKey: "Recv.Variance", label: "Variance", align: 'right' },
    { displayKey: "Status", dataKey: "Status", label: "Status", align: 'center' },

    // Financials
    { displayKey: "Unit Price", dataKey: "Unit Price", label: "Unit Price", align: 'right' },
    { displayKey: "ReceivePrice", dataKey: "ReceivePrice", label: "REceive Price", align: 'right' },

    // Locations & Dates
    { displayKey: "From.Loc", dataKey: "From.Loc", label: "From Branch", align: 'left' },
    { displayKey: "To.Loc", dataKey: "To.Loc", label: "To Branch", align: 'left' },
    { displayKey: "Tran.Date", dataKey: "Tran.Date", label: "Transfer Date", align: 'center' },
    { displayKey: "Tran.Time", dataKey: "Tran.Time", label: "Transfer Time", align: 'center' },
    { displayKey: "Recv.Date", dataKey: "Recv.Date", label: "Receive Date", align: 'center' },
    { displayKey: "Recv.Time", dataKey: "Recv.Time", label: "Receive Time", align: 'center' },

    // User & Logistics
    { displayKey: "Trans.LogID", dataKey: "Trans.LogID", label: "Transferred By (ID)", align: 'center' },
    { displayKey: "Trans.Name", dataKey: "Trans.Name", label: "Transferred By (Name)", align: 'left' },
    { displayKey: "Recv.LogID", dataKey: "Recv.LogID", label: "Received By (ID)", align: 'center' },
    { displayKey: "Recv.Name", dataKey: "Recv.Name", label: "Received By (Name)", align: 'left' },
    { displayKey: "DriverCode", dataKey: "DriverCode", label: "Driver Code", align: 'center' },
    { displayKey: "DriverName", dataKey: "DriverName", label: "Driver Name", align: 'left' },
    { displayKey: "VehicleCode", dataKey: "VehicleCode", label: "Vehicle Code", align: 'center' },
    { displayKey: "VehicleName", dataKey: "VehicleName", label: "Vehicle Name", align: 'left' },
  ],
};
