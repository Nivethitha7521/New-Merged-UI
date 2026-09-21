'use client';

import React from 'react';

interface ReportSkeletonProps {
  columns?: number;
  rows?: number;
  compact?: boolean;
}

export function MetricCardSkeleton() {
  return (
    <div className="rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] p-3 shadow-sm">
      <div className="h-3 w-20 rounded skeleton-shimmer" />
      <div className="mt-3 h-6 w-28 rounded skeleton-shimmer" />
      <div className="mt-2 h-2.5 w-16 rounded skeleton-shimmer" />
    </div>
  );
}

export function ReportTableSkeleton({ columns = 6, rows = 8, compact = false }: ReportSkeletonProps) {
  return (
    <div className="h-full min-h-0 w-full overflow-hidden bg-[var(--app-card)]">
      <div
        className="grid border-b border-[var(--app-border)] bg-[var(--app-surface)]"
        style={{ gridTemplateColumns: `44px repeat(${columns}, minmax(160px, 1fr))` }}
      >
        {Array.from({ length: columns + 1 }).map((_, index) => (
          <div key={index} className={compact ? 'px-3 py-2.5' : 'px-4 py-3'}>
            <div className="h-3 rounded skeleton-shimmer" />
          </div>
        ))}
      </div>

      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid border-b border-[var(--app-border)]"
          style={{ gridTemplateColumns: `44px repeat(${columns}, minmax(160px, 1fr))` }}
        >
          {Array.from({ length: columns + 1 }).map((_, colIndex) => (
            <div key={colIndex} className={compact ? 'px-3 py-2.5' : 'px-4 py-3'}>
              <div
                className="h-3 rounded skeleton-shimmer"
                style={{ width: colIndex === 0 ? 16 : `${48 + ((rowIndex * 13 + colIndex * 9) % 36)}%` }}
              />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

