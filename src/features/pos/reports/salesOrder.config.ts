// ============================================================
// configs/salesOrder.config.ts
// SALES ORDER report — Standardized Config
// ============================================================

import { ReportConfig } from '@/features/reports-engine/types';
import { REPORTS_API_BASE } from '@/config/apiConfig';

export interface SalesOrderReport {
    billDate?: string | null;
    billTime?: string | null;
    cashReciveDate?: string | null;
    cashReciveTime?: string | null;
    deliveryDate?: string | null;
    billNo?: string | null;
    headerDocNo?: string | null;
    netAmount?: number | null;
    discount?: number | null;
    billTax?: number | null;
    billTotalAmount?: number | null;
    locationName?: string | null;
    customerNo?: string | null;
    customerName?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    empID?: string | null;
    SalesPerson?: string | null;
    payMode?: string | null;
    status?: string | null;
    advanceAmount?: number | null;
    customCharge?: number | null;
}

export const salesOrderConfig: ReportConfig<SalesOrderReport> = {
    key: 'salesOrder', // Unique key for Redux
    title: 'Sales Order Report',

    apiBase: `${REPORTS_API_BASE}/Salesorder`,

    dateEndpoint: `${REPORTS_API_BASE}/Salesorder/date-dropdown`,

    // Reusing the global dropdowns from Production Entry (or change if Sales has its own)
    globalDropdownEndpoint: `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

    exportFilename: 'Salesorder',
    defaultPageSize: 30,

    filters: [
        { type: 'year', label: 'Fiscal Year', apiParam: 'fiscalYear' },
        { type: 'month', label: 'Fiscal Month', apiParam: 'fiscalMonth' },
        { type: 'day', label: 'Day', apiParam: 'day' },

        // Global Filters (Example filters, adjust types/apiParams as needed for Sales)
        {
            type: 'locations',
            label: 'Branch',
            apiParam: 'branchName',
            searchable: true,
            paginated: true
        },

    ],

    columns: [
        // Identity

        { displayKey: "headerDocNo", dataKey: "headerDocNo", label: "Header Doc No", align: 'left' },
        { displayKey: "billNo", dataKey: "billNo", label: "Bill No", align: 'left' },
        { displayKey: "status", dataKey: "status", label: "Status", align: 'center' },

        // Dates & Times
        { displayKey: "billDate", dataKey: "billDate", label: "Bill Date", align: 'center' },
        { displayKey: "billTime", dataKey: "billTime", label: "Bill Time", align: 'center' },
        { displayKey: "cashReciveDate", dataKey: "cashReciveDate", label: "Cash Receive Date", align: 'center' },
        { displayKey: "cashReciveTime", dataKey: "cashReciveTime", label: "Cash Receive Time", align: 'center' },
        { displayKey: "deliveryDate", dataKey: "deliveryDate", label: "Delivery Date", align: 'center' },

        // Financial related fields
        { displayKey: "netAmount", dataKey: "netAmount", label: "Net Amount", align: 'right' },
        { displayKey: "discount", dataKey: "discount", label: "Discount", align: 'right' },
        { displayKey: "customCharge", dataKey: "customCharge", label: "Custom Charge", align: 'right' },
        { displayKey: "billTax", dataKey: "billTax", label: "Tax", align: 'right' },
        { displayKey: "billTotalAmount", dataKey: "billTotalAmount", label: "Total Amount", align: 'right' },
        { displayKey: "advanceAmount", dataKey: "advanceAmount", label: "Advance Amount", align: 'right' },

        // Customer & Location
        { displayKey: "locationName", dataKey: "locationName", label: "Branch/Location", align: 'left' },
        { displayKey: "customerNo", dataKey: "customerNo", label: "Customer No", align: 'left' },
        { displayKey: "customerName", dataKey: "customerName", label: "Customer Name", align: 'left' },
        { displayKey: "firstName", dataKey: "firstName", label: "First Name", align: 'left' },
        { displayKey: "lastName", dataKey: "lastName", label: "Last Name", align: 'left' },

        // Salesperson
        { displayKey: "empID", dataKey: "empID", label: "Employee ID", align: 'center' },
        { displayKey: "SalesPerson", dataKey: "SalesPerson", label: "Sales Person", align: 'left' },
        { displayKey: "payMode", dataKey: "payMode", label: "Payment Mode", align: 'left' },
    ],
};
