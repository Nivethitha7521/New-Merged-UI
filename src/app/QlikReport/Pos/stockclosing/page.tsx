'use client';

import { stockclosingReport } from '@/redux/reportRegistry';
import { RootState } from '@/redux/store';
import ReportPage from '@/features/reports-engine/ReportPage';
import { closingStockConfig } from '@/features/pos/reports/stockclosing.config';

const selector = (s: RootState) => s.stockclosing;

export default function stockClosingPage() {
  return (
    <ReportPage
      config={closingStockConfig}
      thunks={stockclosingReport.thunks}
      actions={stockclosingReport.slice.actions}
      selector={selector}
    />
  );
}
