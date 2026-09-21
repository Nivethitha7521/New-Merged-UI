'use client';

import React from 'react';
import ReportErrorBoundary from '@/features/reports-engine/components/ReportErrorBoundary';

export default function POSLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[var(--app-bg)]">
      <ReportErrorBoundary>{children}</ReportErrorBoundary>
    </div>
  );
}
