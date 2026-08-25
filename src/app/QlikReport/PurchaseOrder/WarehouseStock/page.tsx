'use client';

import { WarehouseStockReport } from '@/redux/reportRegistry';
import { RootState } from '@/redux/store';
import ReportPage from '@/features/reports-engine/ReportPage';
import { warehouseStockConfig } from '@/features/purchase-order/reports/warehouseStock.config';

const selector = (s: RootState) => s.warehouseStock;

export default function WarehouseStockPage() {
  return (
    <ReportPage
      config={warehouseStockConfig}
      thunks={WarehouseStockReport.thunks}
      actions={WarehouseStockReport.slice.actions}
      selector={selector}
    />
  );
}
