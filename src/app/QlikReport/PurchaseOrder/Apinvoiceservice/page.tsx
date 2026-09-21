'use client';

import { ApInvoiceServiceReport } from '@/redux/reportRegistry';
import { RootState } from '@/redux/store';
import ReportPage from '@/features/reports-engine/ReportPage';
import { apInvoiceServiceConfig } from '@/features/purchase-order/reports/apInvoiceService.config';

// Select 'apInvoiceService' (the key defined in your config)
const selector = (s: RootState) => s.apInvoiceService;

export default function ApInvoiceServicePage() {
  return (
    <ReportPage
      config={apInvoiceServiceConfig}
      thunks={ApInvoiceServiceReport.thunks}
      actions={ApInvoiceServiceReport.slice.actions}
      selector={selector}
    />
  );
}