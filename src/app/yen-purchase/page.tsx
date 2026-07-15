"use client";
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useCallback } from 'react';
import { Button } from '@mui/material';
import React from 'react';
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const SideMenu = dynamic(() => import('../../components/SideMenu'), {
  ssr: false,
});

const YenPurchasePage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const permissions = useSelector(
    (state: RootState) => state.auth.permissions?.yenerp || {},
  );
  const permissionsLoaded = Object.keys(permissions).length > 0;

  const isModuleVisible = (key: string) => {
    const m = permissions?.[key];
    if (!m) return false;
    if (m.hide === true || m.hide === 1) return false;
    const noActions = !m.read && !m.add && !m.edit && !m.delete && !m.approve;
    if (noActions) return false;
    return m.read === true || m.read === 1;
  };

  const yenBookKeys = [
    "outgoingpayment", "advancepayment", "partialpayment",
    "paymentdone", "paymenthistory", "ledger", "purchasereturn",
    "expensecategory", "expensesubcategory", "expensename",
  ];
  const hideBookMenu = !yenBookKeys.some((k) => isModuleVisible(k));

  const purchaseMasterKeys = [
    "purchasecategory", "purchasesubcategory", "itemgroup",
    "purchaseuom", "purchasetax", "storagelocation", "freight",
    "itemtype", "service",
  ];
  const vendorKeys          = ["vendors", "vendortype"];
  const purchaseitemKeys    = ["purchaseitem"];
  const purchaseOrderKeys   = [
    "purchaseorders_pending", "purchaseorders_approved",
    "purchaseorders_rejected", "purchaseorders_grn_converted",
  ];
  const serviceOrderKeys    = [
    "serviceorders_pending", "serviceorders_approved", "serviceorders_rejected",
  ];
  const grnKeys             = ["grns", "grns_return"];
  const apInvoiceKeys       = ["apinvoices"];

  

  const isAnyModuleVisible = (keys: string[]) => keys.some((k) => isModuleVisible(k));

  const subItems = useMemo(
    () =>
      [
        {
          label:   "Purchase Master",
          path:    "/yen-purchase/PurchaseMaster",
          visible: isAnyModuleVisible(purchaseMasterKeys),
        },
        {
          label:   "Vendor",
          path:    "/yen-purchase/VendorPage",
          visible: isAnyModuleVisible(vendorKeys),
        },
        {
          label:   "Purchase Item",
          path:    "/yen-purchase/PurchaseItemPage",
          visible: isAnyModuleVisible(purchaseitemKeys),
        },

        {
          label:   "Purchase Order",
          path:    "/yen-purchase/PurchaseOrder",
          visible: isAnyModuleVisible(purchaseOrderKeys),
        },
        {
          label:   "Service Order",
          path:    "/yen-purchase/ServiceOrder",
          visible: isAnyModuleVisible(serviceOrderKeys),
        },
        {
          label:   "GRN Note",
          path:    "/yen-purchase/GrnPage",
          visible: isAnyModuleVisible(grnKeys),
        },
        {
          label:   "AP Invoice",
          path:    "/yen-purchase/ApInvoicePage",
          visible: isAnyModuleVisible(apInvoiceKeys),
        },
      ].filter((item) => item.visible),
    [permissions],
  );

  const purchaseKeys: string[] = [
    ...purchaseMasterKeys,
    ...vendorKeys,
    ...purchaseitemKeys,
    ...purchaseOrderKeys,
    ...serviceOrderKeys,
    ...grnKeys,
    ...apInvoiceKeys,
  ];

  const INVENTORY_KEYS = [
    "physicalstockmodification", "physicalstockvariancemodification",
    "stockledger", "warehousephysicalstockmodification",
    "warehousephysicalstockvariancemodification", "warehousestockledger",
  ];
  const showInventoryMenu = INVENTORY_KEYS.some((k) => isModuleVisible(k));
  const showReportsMenu   = isModuleVisible("posreport") || isModuleVisible("purchaseorderreport");

  const normalizedPath = useMemo(() => {
    if (!pathname) return "";
    const parts = pathname.split("/").filter(Boolean);
    if (parts.length > 1) return "/" + parts.slice(1).join("/");
    return pathname;
  }, [pathname]);

  const hidePurchaseMenu =
    permissionsLoaded &&
    !purchaseKeys.some((key: string) => isModuleVisible(key));

  React.useEffect(() => {
    const isExactYenPurchase =
      pathname === '/yen-purchase' || pathname === '/yen-purchase/';
    if (isExactYenPurchase && permissionsLoaded && subItems.length > 0) {
      router.replace(subItems[0].path);
    }
  }, [pathname, permissionsLoaded, subItems, router]);

  const isActiveRoute = (itemPath: string) => pathname?.startsWith(itemPath ?? "");

  const handleMenuClick = useCallback((menuItem: { path: string }) => {
    router.push(menuItem.path);
  }, [router]);

  return (
    <div>
      <SideMenu
        onMenuClick={handleMenuClick}
        activePath={pathname || "/"}
        showPurchaseMenu={!hidePurchaseMenu}
        showBookMenu={!hideBookMenu}
        showInventoryMenu={showInventoryMenu}
        showReportsMenu={showReportsMenu}
      />
      <div className="flex flex-wrap gap-2 ml-4 items-center justify-start">
        {subItems.map((item) => {
          const isActive = isActiveRoute(item.path);
          return (
            <Link key={item.label} href={item.path} className="no-underline">
              <Button
                variant={isActive ? 'contained' : 'outlined'}
                color="primary"
                size="medium"
                sx={{
                  textTransform: 'none',
                  fontWeight:    isActive ? 'bold' : 'normal',
                  fontSize:      isActive ? '16px' : '15px',
                  borderRadius:  '4px',
                  padding:       '8px 16px',
                  width:         isActive ? '200px' : '150px',
                  height:        isActive ? '40px' : '30px',
                  display:       'flex',
                  justifyContent:'center',
                  alignItems:    'center',
                  transition:    'all 0.2s ease',
                  boxShadow:     isActive ? '0px 0px 10px rgba(0, 0, 0, 0.1)' : 'none',
                }}
              >
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default YenPurchasePage;