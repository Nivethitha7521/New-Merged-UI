'use client';

import { OverallSalesReport } from '@/redux/reportRegistry';
import { RootState } from '@/redux/store';
import ReportPage from '@/features/reports-engine/ReportPage';
import { overallSalesConfig } from '@/features/pos/reports/overallSales.config';

// Select 'overallSales' (the key defined in your config)
const selector = (s: RootState) => s.overallSales;

export default function OverallSalesPage() {
  return (
    <ReportPage
      config={overallSalesConfig}
      thunks={OverallSalesReport.thunks}
      actions={OverallSalesReport.slice.actions}
      selector={selector}
    />
  );
}