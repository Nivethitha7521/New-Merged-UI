"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Button } from "@mui/material";

const PRIMARY_BLUE = "#1976d2";
const PRIMARY_BLUE_DARK = "#0f5fb5";
const PRIMARY_BLUE_LIGHT = "#e8f2ff";

const modules = [
  {
    label: "Outlets",
    fullLabel: "Outlets Inventory Management",
    path: "/yen-inventory/OutletsInventoryManagement",
    defaultPath:
      "/yen-inventory/OutletsInventoryManagement/OutletPhysicalStockModification",
  },
  {
    label: "Warehouse",
    fullLabel: "Warehouse Inventory Management",
    path: "/yen-inventory/WarehouseInventoryManagement",
    defaultPath: "/yen-inventory/WarehouseInventoryManagement/stockModification",
  },
];

const DEFAULT_INVENTORY_PAGE =
  "/yen-inventory/OutletsInventoryManagement/OutletPhysicalStockModification";

const defaultRedirects: Record<string, string> = {
  "/yen-inventory/OutletsInventoryManagement":
    "/yen-inventory/OutletsInventoryManagement/OutletPhysicalStockModification",

  "/yen-inventory/WarehouseInventoryManagement":
    "/yen-inventory/WarehouseInventoryManagement/stockModification",
};

const YenInventoryPage = () => {
  const pathname = usePathname();
  const router = useRouter();

  React.useEffect(() => {
    if (!pathname) return;

    if (pathname === "/yen-inventory") {
      router.replace(DEFAULT_INVENTORY_PAGE);
      return;
    }

    const defaultPage = defaultRedirects[pathname];

    if (defaultPage) {
      router.replace(defaultPage);
    }
  }, [pathname, router]);

  const activeModule =
    modules.find(
      (item) => pathname === item.path || pathname?.startsWith(`${item.path}/`)
    ) || modules[0];

  const handleModuleClick = React.useCallback(
    (moduleItem: (typeof modules)[number]) => {
      router.push(moduleItem.defaultPath);
    },
    [router]
  );

  // Top "Inventory Management" title + Outlets/Warehouse toggle removed —
  // that navigation now lives in the left InventoryModuleSideMenu, same
  // pattern as every other YenERP module (Purchase, Master Admin, etc.).
  // The redirect effect above still runs (functionality unchanged); this
  // component just no longer renders a visible header.
  return null;
};

export default YenInventoryPage;