'use client';

import {  WastageRecReport } from '@/redux/reportRegistry';
import { RootState } from '@/redux/store';
import ReportPage from '@/features/reports-engine/ReportPage';
import { wastageRecConfig } from '@/features/pos/reports/wastageReceive.config';

// Select 'wastageEntry' (the key defined in your config)
const selector = (s: RootState) => s.wastageRec;

export default function WastageEntryPage() {
  return (
    <ReportPage
      config={wastageRecConfig}
      thunks={WastageRecReport.thunks}
      actions={WastageRecReport.slice.actions}
      selector={selector}
    />
  );
}