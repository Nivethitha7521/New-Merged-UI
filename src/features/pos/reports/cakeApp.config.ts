// ============================================================
// configs/cakeApp.config.ts
// CAKE APP ORDER report — Standardized Config
// ============================================================

import { ReportConfig } from '@/features/reports-engine/types';
import { REPORTS_API_BASE } from '@/config/apiConfig';

export interface CakeAppReport {
  cakeAppInvoiceId?: string;
  name?: string;
  category?: string;
  itemCodes?: string;
  price?: number;
  kgList?: number;
  qty?: number;
  amount?: number;
  taxPercentage?: number;
  flavourList?: string;
  totalAmount?: number;
  status?: string;
  customerPhoneNumber?: string;
  orderNo?: string;
  deliveryDate?: string;
  deliveryTime?: string;
  paymentType?: string;
  event?: string;
  invoiceDate?: string;
  invoiceTime?: string;
  warehouseName?: string;
  branch?: string;
  contact?: number;
  city?: string;
  birthdayDate?: string;
}

export const cakeAppConfig: ReportConfig<CakeAppReport> = {
  key: 'cakeApp', // Unique key for Redux
  title: 'Cake App Order Report',
  
  apiBase: `${REPORTS_API_BASE}/birthdaycake`,

  dateEndpoint: `${REPORTS_API_BASE}/birthdaycake/date-dropdown`,
  
  // Reusing the global dropdowns from Production Entry
  globalDropdownEndpoint: `${REPORTS_API_BASE}/productionEntry/global-dropdowns`,

  exportFilename: 'Cake_App_Report',
  defaultPageSize: 30,

  filters: [
    { type: 'year', label: 'Fiscal Year', apiParam: 'fiscalYear' },
    { type: 'month', label: 'Fiscal Month', apiParam: 'fiscalMonth' },
    { type: 'day', label: 'Day', apiParam: 'day' },

    // Global Filters
    {
      type: 'locations',
      label: 'branchName',
      apiParam: 'branchName',
      searchable: true,
      paginated: true
    },
  
  ],

  columns: [
    { displayKey: "cakeAppInvoiceId", dataKey: "cakeAppInvoiceId", label: "Cake App Invoice ID" },
    { displayKey: "name", dataKey: "name", label: "Item Name" },
    { displayKey: "category", dataKey: "category", label: "Category" },
    { displayKey: "itemCodes", dataKey: "itemCodes", label: "Item Code" },
    { displayKey: "price", dataKey: "price", label: "Price", align: 'right' },
    { displayKey: "kgList", dataKey: "kgList", label: "KG", align: 'right' },
    { displayKey: "qty", dataKey: "qty", label: "Quantity", align: 'right' },
    { displayKey: "amount", dataKey: "amount", label: "Amount", align: 'right' },
    { displayKey: "taxPercentage", dataKey: "taxPercentage", label: "Tax %" },
    { displayKey: "flavourList", dataKey: "flavourList", label: "Flavour" },
    { displayKey: "totalAmount", dataKey: "totalAmount", label: "Total Amount", align: 'right' },
    { displayKey: "status", dataKey: "status", label: "Status" },
    { displayKey: "customerPhoneNumber", dataKey: "customerPhoneNumber", label: "Customer Phone" },
    { displayKey: "orderNo", dataKey: "orderNo", label: "Order No" },
    { displayKey: "deliveryDate", dataKey: "deliveryDate", label: "Delivery Date" },
    { displayKey: "deliveryTime", dataKey: "deliveryTime", label: "Delivery Time" },
    { displayKey: "paymentType", dataKey: "paymentType", label: "Payment Type" },
    { displayKey: "event", dataKey: "event", label: "Event" },
    { displayKey: "invoiceDate", dataKey: "invoiceDate", label: "Invoice Date" },
    { displayKey: "invoiceTime", dataKey: "invoiceTime", label: "Invoice Time" },
    { displayKey: "warehouseName", dataKey: "warehouseName", label: "Warehouse Name" },
    { displayKey: "branch", dataKey: "branch", label: "Branch" },
    { displayKey: "contact", dataKey: "contact", label: "Contact" },
    { displayKey: "city", dataKey: "city", label: "City" },
    { displayKey: "birthdayDate", dataKey: "birthdayDate", label: "Birthday Date" },
  ],
};