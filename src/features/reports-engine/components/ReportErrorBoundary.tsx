'use client';

import React from 'react';
import { HiOutlineArrowPath, HiOutlineExclamationTriangle } from 'react-icons/hi2';
import GlobalSnackbar from '@/components/snackbar/GlobalSnackbar';

interface ReportErrorBoundaryState {
  hasError: boolean;
  snackbarOpen: boolean;
}

class ReportErrorBoundary extends React.Component<React.PropsWithChildren, ReportErrorBoundaryState> {
  state: ReportErrorBoundaryState = {
    hasError: false,
    snackbarOpen: false,
  };

  static getDerivedStateFromError(): ReportErrorBoundaryState {
    return { hasError: true, snackbarOpen: true };
  }

  componentDidCatch(error: Error) {
    console.error('Report dashboard render failed:', error);
  }

  handleRetry = () => {
    this.setState({ hasError: false, snackbarOpen: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex h-full min-h-0 w-full flex-col bg-[var(--app-bg)] p-3">
        <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-[var(--app-border)] bg-[var(--app-card)] shadow-sm">
          <div className="border-b border-[var(--app-border)] px-4 py-3">
            <div className="h-3 w-36 rounded skeleton-shimmer" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-20 rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)]" />
              ))}
            </div>
          </div>

          <div className="flex flex-1 items-center justify-center p-6">
            <div className="max-w-sm text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-600">
                <HiOutlineExclamationTriangle size={24} />
              </div>
              <h2 className="text-sm font-bold text-[var(--app-text)]">Report view could not be rendered</h2>
              <p className="mt-2 text-xs leading-5 text-[var(--app-text-muted)]">
                The dashboard shell is still available. Try again to reload the report view.
              </p>
              <button
                type="button"
                onClick={this.handleRetry}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-[var(--app-accent)] bg-[var(--app-accent)] px-4 text-xs font-bold text-white hover:bg-[var(--app-navy)]"
              >
                <HiOutlineArrowPath size={14} />
                Retry
              </button>
            </div>
          </div>
        </div>

        <GlobalSnackbar
          open={this.state.snackbarOpen}
          message="Data loading failed. Showing last available data."
          severity="error"
          onClose={() => this.setState({ snackbarOpen: false })}
        />
      </div>
    );
  }
}

export default ReportErrorBoundary;

