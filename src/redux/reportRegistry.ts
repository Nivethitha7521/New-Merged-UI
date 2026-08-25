// reportRegistry.ts

import { dispatchRecConfig } from '@/features/pos/reports/dispatchRec.config';
import { dispatchConfig } from '@/features/pos/reports/dispatch.config';
import { salesOrderConfig } from '@/features/pos/reports/salesOrder.config';
import { overallSalesConfig } from '@/features/pos/reports/overallSales.config';
import { itemwiseSalesConfig } from '@/features/pos/reports/itemwiseSales.config';
import { itemOrderConfig } from '@/features/pos/reports/itemOrder.config';
import { dayendConfig } from '@/features/pos/reports/dayend.config';
import { itemTransferConfig } from '@/features/pos/reports/itemTransfer.config';
import { wastageEntryConfig } from '@/features/pos/reports/wastageEntry.config';
import { warehouseReturnConfig } from '@/features/pos/reports/warehouseReturn.config';
import { purchaseConfig } from '@/features/purchase-order/reports/purchase.config';
import { itemDateWiseConfig } from '@/features/purchase-order/reports/itemDateWise.config';
import { grnAgainstConfig } from '@/features/purchase-order/reports/grnAgainst.config';
import { apInvoiceConfig } from '@/features/purchase-order/reports/apInvoice.config';
import { outgoingConfig } from '@/features/purchase-order/reports/outgoing.config';
import { outstandingConfig } from '@/features/purchase-order/reports/outstanding.config';
import { storeDispatchConfig } from '@/features/purchase-order/reports/storeDispatch.config';
import { debitNoteConfig } from '@/features/purchase-order/reports/debitNote.config';
import { debitNoteAmountConfig } from '@/features/purchase-order/reports/debitNoteAmount.config';
import { pettyCashExpenseConfig } from '@/features/purchase-order/reports/pettyCashExpense.config';
import { apInvoiceServiceConfig } from '@/features/purchase-order/reports/apInvoiceService.config';
import { productionEntryConfig } from '@/features/pos/reports/productionEntry.config';
import { createReportSlice } from '@/features/reports-engine/genericReportSlice';
import { ReportState } from '@/features/reports-engine/types';
import { Reducer } from '@reduxjs/toolkit';
import { wastageRecConfig } from '@/features/pos/reports/wastageReceive.config';
import { closingStockConfig } from '@/features/pos/reports/stockclosing.config';
import { warehouseStockConfig } from '@/features/purchase-order/reports/warehouseStock.config';

export const productionEntryReport = createReportSlice(productionEntryConfig);
export const DispatchRecReport = createReportSlice(dispatchRecConfig);
export const DispatchReport = createReportSlice(dispatchConfig);
export const SalesOrderReport = createReportSlice(salesOrderConfig);
export const OverallSalesReport = createReportSlice(overallSalesConfig);
export const ItemwiseSalesReport = createReportSlice(itemwiseSalesConfig);
export const ItemOrderReport = createReportSlice(itemOrderConfig);
export const DayendReport = createReportSlice(dayendConfig);
export const ItemTransferReport = createReportSlice(itemTransferConfig);
export const WastageEntryReport = createReportSlice(wastageEntryConfig);
export const WastageRecReport = createReportSlice(wastageRecConfig);
export const stockclosingReport = createReportSlice(closingStockConfig);


export const WarehouseReturnReport = createReportSlice(warehouseReturnConfig);
export const PurchaseReport = createReportSlice(purchaseConfig);
export const ItemDateWiseReport = createReportSlice(itemDateWiseConfig);
export const GrnAgainstReport = createReportSlice(grnAgainstConfig);
export const ApInvoiceReport = createReportSlice(apInvoiceConfig);
export const OutgoingReport = createReportSlice(outgoingConfig);
export const OutstandingReport = createReportSlice(outstandingConfig);
export const StoreDispatchReport = createReportSlice(storeDispatchConfig);
export const DebitNoteReport = createReportSlice(debitNoteConfig);
export const DebitNoteAmountReport = createReportSlice(debitNoteAmountConfig);
export const PettyCashExpenseReport = createReportSlice(pettyCashExpenseConfig);
export const ApInvoiceServiceReport = createReportSlice(apInvoiceServiceConfig);
export const WarehouseStockReport = createReportSlice(warehouseStockConfig);

export const reportReducers: {
  productionEntry: Reducer<ReportState>;
  dispatchRec: Reducer<ReportState>;
  dispatch: Reducer<ReportState>;
  salesOrder: Reducer<ReportState>;
  overallSales: Reducer<ReportState>;
  itemwiseSales: Reducer<ReportState>;
  itemOrder: Reducer<ReportState>;
  dayend: Reducer<ReportState>;
  itemTransfer: Reducer<ReportState>;
  wastageEntry: Reducer<ReportState>;
  wastageRec: Reducer<ReportState>;
  warehouseReturn: Reducer<ReportState>;
  purchase: Reducer<ReportState>;
  itemDateWise: Reducer<ReportState>;
  grnAgainst: Reducer<ReportState>;
 apInvoiceReport: Reducer<ReportState>;
  outgoing: Reducer<ReportState>;
  outstanding: Reducer<ReportState>;
  storeDispatch: Reducer<ReportState>;
  debitNote: Reducer<ReportState>;
  debitNoteAmount: Reducer<ReportState>;
  pettyCashExpense: Reducer<ReportState>;
  apInvoiceService: Reducer<ReportState>;
  stockclosing: Reducer<ReportState>;
  warehouseStock: Reducer<ReportState>;

} = {
  productionEntry: productionEntryReport.slice.reducer,
  dispatchRec: DispatchRecReport.slice.reducer,
  dispatch: DispatchReport.slice.reducer,
  salesOrder: SalesOrderReport.slice.reducer,
  overallSales: OverallSalesReport.slice.reducer,
  itemwiseSales: ItemwiseSalesReport.slice.reducer,
  itemOrder: ItemOrderReport.slice.reducer,
  dayend: DayendReport.slice.reducer,
  itemTransfer: ItemTransferReport.slice.reducer,
  wastageEntry: WastageEntryReport.slice.reducer,
  wastageRec: WastageRecReport.slice.reducer,
  warehouseReturn: WarehouseReturnReport.slice.reducer,
  purchase: PurchaseReport.slice.reducer,
  itemDateWise: ItemDateWiseReport.slice.reducer,
  grnAgainst: GrnAgainstReport.slice.reducer,
  apInvoiceReport: ApInvoiceReport.slice.reducer,   
  outgoing: OutgoingReport.slice.reducer,
  outstanding: OutstandingReport.slice.reducer,
  storeDispatch: StoreDispatchReport.slice.reducer,
  debitNote: DebitNoteReport.slice.reducer,
  debitNoteAmount: DebitNoteAmountReport.slice.reducer,
  pettyCashExpense: PettyCashExpenseReport.slice.reducer,
  apInvoiceService: ApInvoiceServiceReport.slice.reducer,
  stockclosing: stockclosingReport.slice.reducer,
  warehouseStock: WarehouseStockReport.slice.reducer,

};
