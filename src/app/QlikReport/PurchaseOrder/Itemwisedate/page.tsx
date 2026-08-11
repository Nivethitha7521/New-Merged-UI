'use client';

import { ItemDateWiseReport } from '@/redux/reportRegistry';
import { RootState } from '@/redux/store';
import ReportPage from '@/features/reports-engine/ReportPage';
import { itemDateWiseConfig } from '@/features/purchase-order/reports/itemDateWise.config';

// Select 'itemDateWise' (the key defined in your config)
const selector = (s: RootState) => s.itemDateWise;

export default function ItemDateWisePage() {
  return (
    <ReportPage
      config={itemDateWiseConfig}
      thunks={ItemDateWiseReport.thunks}
      actions={ItemDateWiseReport.slice.actions}
      selector={selector}
    />
  );
}