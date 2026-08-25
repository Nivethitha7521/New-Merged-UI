'use client';

import { ItemwiseSalesReport } from '@/redux/reportRegistry';
import { RootState } from '@/redux/store';
import ReportPage from '@/features/reports-engine/ReportPage';
import { itemwiseSalesConfig } from '@/features/pos/reports/itemwiseSales.config';

// Select 'itemwiseSales' (the key defined in your config)
const selector = (s: RootState) => s.itemwiseSales;

export default function ItemwiseSalesPage() {
  return (
    <ReportPage
      config={itemwiseSalesConfig}
      thunks={ItemwiseSalesReport.thunks}
      actions={ItemwiseSalesReport.slice.actions}
      selector={selector}
    />
  );
}