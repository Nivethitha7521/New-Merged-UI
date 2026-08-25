'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@mui/material';
import { usePathname } from 'next/navigation';
const cashManagementTabs = [
  { label: 'Opening Cash', path: '/yen-pos/CashManagement/OpeningCash' },
  { label: 'Petty Cash', path: '/yen-pos/CashManagement/PettyCash' },
];

export default function CashManagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || Boolean(pathname?.startsWith(`${path}/`));

  return (
    <div className="item-master-layout yen-pos-cash-layout">
      <nav
        className="master-admin-submodule-tabs"
        aria-label="Cash Management navigation"
      >
        {cashManagementTabs.map((item) => (
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

      {children}
    </div>
  );
}