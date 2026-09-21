"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { Box } from "@mui/material";
import { usePathname } from "next/navigation";
import YenInventoryPage from "../page";
import { usePermissions } from "@/hooks/usePermissions";

const subItems = [
  {
    label: "Warehouse Physical Stock",
    path: "/yen-inventory/WarehouseInventoryManagement/stockModification",
    permissionKey: "warehousephysicalstock",
  },
  {
    label: "Warehouse Stock Variance",
    path: "/yen-inventory/WarehouseInventoryManagement/storeStockModification",
    permissionKey: "warehousestockvariance",
  },
  {
    label: "Warehouse Approved Stock",
    path: "/yen-inventory/WarehouseInventoryManagement/ApprovedStock",
    permissionKey: "warehouseapprovedstock",
  },
  {
    label: "Warehouse Stock Ledger",
    path: "/yen-inventory/WarehouseInventoryManagement/ledger",
    permissionKey: "warehousestockledger",
  },
];

const WarehouseInventoryManagementPage = () => {
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

      <nav className="inventory-section-nav" aria-label="Warehouse inventory screens">
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

export default WarehouseInventoryManagementPage;
