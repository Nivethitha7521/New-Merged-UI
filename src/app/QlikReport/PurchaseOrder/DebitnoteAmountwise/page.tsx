'use client';

import { DebitNoteAmountReport } from '@/redux/reportRegistry';
import { RootState } from '@/redux/store';
import ReportPage from '@/features/reports-engine/ReportPage';
import { debitNoteAmountConfig } from '@/features/purchase-order/reports/debitNoteAmount.config';

// Select 'debitNoteAmount' (the key defined in your config)
const selector = (s: RootState) => s.debitNoteAmount;

export default function DebitNoteAmountPage() {
  return (
    <ReportPage
      config={debitNoteAmountConfig}
      thunks={DebitNoteAmountReport.thunks}
      actions={DebitNoteAmountReport.slice.actions}
      selector={selector}
    />
  );
}