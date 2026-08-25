'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@mui/material';

const itemMasterSubmodules = [
  { label: 'Item', path: '/master-admin/Items/Item' },
  { label: 'Category', path: '/master-admin/Items/Category' },
  { label: 'Sub Category', path: '/master-admin/Items/Subcategory' },
  { label: 'Item Group', path: '/master-admin/Items/itemGroup' },
  { label: 'Inventory Type', path: '/master-admin/Items/InventoryType' },
  { label: 'Order Type', path: '/master-admin/Items/OrderType' },
];

export default function ItemMasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || Boolean(pathname?.startsWith(`${path}/`));

  return (
    <div className="item-master-layout">
      <nav
        className="master-admin-submodule-tabs"
       aria-label="Item Master navigation"
      >
        {itemMasterSubmodules.map((item) => (
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