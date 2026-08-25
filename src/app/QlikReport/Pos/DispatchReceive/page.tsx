'use client';

import { DispatchRecReport } from '@/redux/reportRegistry'; // Import from your registry file
import { RootState } from '@/redux/store';
import ReportPage from '@/features/reports-engine/ReportPage';
import { dispatchRecConfig } from '@/features/pos/reports/dispatchRec.config';

// Select 'dispatchReceive' (the key defined in your config and registry)
const selector = (s: RootState) => s.dispatchRec;

export default function DispatchReceivePage() {
  return (
    <ReportPage
      config={dispatchRecConfig}
      thunks={DispatchRecReport.thunks}
      actions={DispatchRecReport.slice.actions}
      selector={selector}
    />
  );
}