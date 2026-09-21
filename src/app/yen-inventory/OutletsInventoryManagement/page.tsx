"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import YenInventoryPage from "../page";
import { usePermissions } from "@/hooks/usePermissions";

const subItems = [
  {
    label: "Outlet Physical Stock",
    path: "/yen-inventory/OutletsInventoryManagement/OutletPhysicalStockModification",
    permissionKey: "outletphysicalstock",
  },
  {
    label: "Outlet Stock Variance",
    path: "/yen-inventory/OutletsInventoryManagement/OutletPhysicalStockVarianceModification",
    permissionKey: "outletstockvariance",
  },
  {
    label: "Outlet Approved Stock",
    path: "/yen-inventory/OutletsInventoryManagement/ApprovedStock",
    permissionKey: "outletapprovedstock",
  },
  {
    label: "Outlet Stock Ledger",
    path: "/yen-inventory/OutletsInventoryManagement/ledger",
    permissionKey: "outletstockledger",
  },
];

const OutletsInventoryManagementPage = () => {
  const pathname = usePathname();
  const { isModuleVisible } = usePermissions();

  const visibleSubItems = useMemo(
    () => subItems.filter((item) => isModuleVisible("yenerp", item.permissionKey)),
    [isModuleVisible]
  );

  if (visibleSubItems.length === 0) return null;

  return (
    <Box sx={{ width: "100%" }}>
      <YenInventoryPage />

      <nav className="inventory-section-nav" aria-label="Outlet inventory screens">
        <div className="inventory-section-nav-list">
          {visibleSubItems.map((item) => {
            const isActive = pathname?.startsWith(item.path);

            return (
              <Link
                key={item.path}
                href={item.path}
                prefetch={false}
                className={`inventory-section-tab ${isActive ? "is-active" : ""}`}
                aria-current={isActive ? "page" : undefined}
                title={item.label}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </Box>
  );
};

export default OutletsInventoryManagementPage;
