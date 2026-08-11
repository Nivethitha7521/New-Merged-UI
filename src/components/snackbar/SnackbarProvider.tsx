'use client';

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import GlobalSnackbar from '@/components/snackbar/GlobalSnackbar';

type Severity = 'success' | 'error' | 'warning' | 'info';

interface SnackbarState {
  open: boolean;
  message: string;
  severity: Severity;
}

interface SnackbarContextValue {
  notify: (message: string, severity?: Severity) => void;
}

const SnackbarContext = createContext<SnackbarContextValue | null>(null);

export const SnackbarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const notify = useCallback((message: string, severity: Severity = 'info') => {
    setSnackbar({ open: true, message, severity });
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <SnackbarContext.Provider value={value}>
      {children}
      <GlobalSnackbar
        open={snackbar.open}
        message={snackbar.message}
        severity={snackbar.severity}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      />
    </SnackbarContext.Provider>
  );
};

export const useAppSnackbar = () => {
  const context = useContext(SnackbarContext);

  if (!context) {
    throw new Error('useAppSnackbar must be used within SnackbarProvider');
  }

  return context;
};
