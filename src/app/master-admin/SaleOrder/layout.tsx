'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@mui/material';

const saleOrderSubmodules = [
  {
    label: 'Payment Type',
    path: '/master-admin/SaleOrder/PaymentType',
  },
  {
    label: 'Events',
    path: '/master-admin/SaleOrder/Events',
  },
  {
    label: 'Advance Amount',
    path: '/master-admin/SaleOrder/AdvanceAmount',
  },
  {
    label: 'Charges',
    path: '/master-admin/SaleOrder/Charges',
  },
  {
    label: 'Delivery Date',
    path: '/master-admin/SaleOrder/DeliveryDate',
  },
  {
    label: 'Delivery Type',
    path: '/master-admin/SaleOrder/DeliveryType',
  },
];

export default function SaleOrderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path ||
    Boolean(pathname?.startsWith(`${path}/`));

  return (
    <div className="item-master-layout sale-order-layout">
      <nav
        className="master-admin-submodule-tabs"
        aria-label="Sale Order navigation"
      >
        {saleOrderSubmodules.map((item) => (
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