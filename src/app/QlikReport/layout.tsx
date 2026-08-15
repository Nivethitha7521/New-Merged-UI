'use client';

import React from 'react';
import { useSelector } from 'react-redux';
import { SnackbarProvider } from '@/components/snackbar/SnackbarProvider';
import { PreferencesProvider } from '@/components/preferences/PreferencesContext';
import AppLayout from '@/components/reports-layout/AppLayout';
import '@/styles/reports/globals.css';
import { RootState } from '@/redux/store';
export default function QlikReportLayout({ children }: { children: React.ReactNode }) {
  const username = useSelector((state: RootState) => state.auth.username) || 'guest';

  return (
    <SnackbarProvider>
      <PreferencesProvider username={username}>
        <AppLayout>{children}</AppLayout>
      </PreferencesProvider>
    </SnackbarProvider>
  );
}