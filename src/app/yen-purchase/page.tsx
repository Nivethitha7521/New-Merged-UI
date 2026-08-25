"use client";

import { usePathname, useRouter } from 'next/navigation';
import { useMemo } from 'react';
import React from 'react';
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";



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


  React.useEffect(() => {
    const isExactYenPurchase =
      pathname === '/yen-purchase' || pathname === '/yen-purchase/';
    if (isExactYenPurchase && permissionsLoaded && subItems.length > 0) {
      router.replace(subItems[0].path);
    }
  }, [pathname, permissionsLoaded, subItems, router]);



return null;
};

export default YenPurchasePage;