'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@mui/material';

const kotMasterSubmodules = [
   { label: 'Add On', path: '/master-admin/KOTMaster/addOn' },
  { label: 'Variant', path: '/master-admin/KOTMaster/variants' },
  { label: 'KOT Table', path: '/master-admin/KOTMaster/TableMaster' },
];

export default function KOTMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || Boolean(pathname?.startsWith(`${path}/`));

  return (
    <div className="kot-master-layout">
      <nav
        className="master-admin-submodule-tabs"
        aria-label="KOT Master navigation"
      >
        {kotMasterSubmodules.map((item) => (
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