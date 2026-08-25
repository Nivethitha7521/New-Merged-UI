'use client';

import { OutstandingReport } from '@/redux/reportRegistry';
import { RootState } from '@/redux/store';
import ReportPage from '@/features/reports-engine/ReportPage';
import { outstandingConfig } from '@/features/purchase-order/reports/outstanding.config';

// Select 'outstanding' (the key defined in your config)
const selector = (s: RootState) => s.outstanding;

export default function OutstandingPage() {
  return (
    <ReportPage
      config={outstandingConfig}
      thunks={OutstandingReport.thunks}
      actions={OutstandingReport.slice.actions}
      selector={selector}
    />
  );
}