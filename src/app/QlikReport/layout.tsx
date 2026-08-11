'use client';

import React from 'react';
import { SnackbarProvider } from '@/components/snackbar/SnackbarProvider';
import { PreferencesProvider } from '@/components/preferences/PreferencesContext';
import AppLayout from '@/components/reports-layout/AppLayout';
import '@/styles/reports/globals.css';
export default function QlikReportLayout({ children }: { children: React.ReactNode }) {
  return (
    <SnackbarProvider>
      <PreferencesProvider>
        <AppLayout>{children}</AppLayout>
      </PreferencesProvider>
    </SnackbarProvider>
  );
}