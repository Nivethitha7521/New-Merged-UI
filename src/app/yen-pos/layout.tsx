'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useDisplaySettings } from '@/contexts/DisplaySettingsContext';
import '../masterAdminGlobal.css';
import '@/styles/master-admin/masterAdmin.css';

const yenPosSubmodules = [
  { label: 'Cash Management', path: '/yen-pos/CashManagement' },
  { label: 'POS Devices', path: '/yen-pos/POSDevicePage' },
  { label: 'Reasons', path: '/yen-pos/reasons' },
  { label: 'Prefix Master', path: '/yen-pos/prefixMaster' },
];

export default function YenPosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { settings: displaySettings } = useDisplaySettings();

  const isActive = (path: string) =>
    pathname === path || Boolean(pathname?.startsWith(`${path}/`));

  // In global Tab Navigation mode these four entries are already rendered by
  // ModuleNavigationTabs. In Sidebar mode, show the same YEN ERP tabs here.
  const showLocalTabs = displaySettings.navigationLayout !== 'tabs';

  return (
    <div className="ma-scope master-admin-page-shell item-master-layout yen-pos-layout">
      {showLocalTabs && (
        <nav
          className="master-admin-submodule-tabs"
          aria-label="YEN POS navigation"
        >
          {yenPosSubmodules.map((item) => (
            <Link
              key={item.path}
              href={item.path}
              prefetch={false}
              style={{ textDecoration: 'none' }}
            >
              <Button
                className={`master-admin-submodule-tab ${
                  isActive(item.path) ? 'is-active' : ''
                }`}
              >
                {item.label}
              </Button>
            </Link>
          ))}
        </nav>
      )}

      {children}
    </div>
  );
 }