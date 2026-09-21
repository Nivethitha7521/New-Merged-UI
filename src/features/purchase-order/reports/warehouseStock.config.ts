// ============================================================
// configs/warehouseStock.config.ts
// WAREHOUSE STOCK report — Standardized Config
// ============================================================

import { ReportConfig } from '@/features/reports-engine/types';
import { REPORTS_API_BASE } from '@/config/apiConfig';

export interface WarehouseStockReport {
    itemCode?: string;
    category?: string;
    subcategory?: string;
    itemName?: string;
    varianceName?: string;
    currentStock?: number;
}

export const warehouseStockConfig: ReportConfig<WarehouseStockReport> = {
    key: 'warehouseStock', // Unique key for Redux
    title: 'Warehouse Stock Report',

    apiBase: `${REPORTS_API_BASE}/WarehouseStockReport`,
    
    // Using global dropdown endpoint to fetch location/warehouse options
    globalDropdownEndpoint: `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

    exportFilename: 'Warehouse_Stock_Report',
    defaultPageSize: 30,

    filters: [
        {
            type: 'locations',
            label: 'Location / Warehouse',
            apiParam: 'locationId',
            searchable: true,
            paginated: true
        },
    ],

    columns: [
        { displayKey: "itemCode", dataKey: "itemCode", label: "Item Code" },
        { displayKey: "category", dataKey: "category", label: "Category" },
        { displayKey: "subcategory", dataKey: "subcategory", label: "Subcategory" },
        { displayKey: "itemName", dataKey: "itemName", label: "Item Name" },
        { displayKey: "varianceName", dataKey: "varianceName", label: "Variance Name" },
        { displayKey: "currentStock", dataKey: "currentStock", label: "Current Stock", align: 'right' },
    ],
};
