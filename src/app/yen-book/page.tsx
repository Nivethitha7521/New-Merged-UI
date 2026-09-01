"use client";

import React, { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";

const YenBookPage = () => {
  const pathname = usePathname();
  const router = useRouter();

  const permissions = useSelector(
    (state: RootState) => state.auth.permissions?.yenerp || {},
  );

  const permissionsLoaded = Object.keys(permissions).length > 0;

  const isModuleVisible = (key: string) => {
    const modulePermission = permissions?.[key];

    if (!modulePermission) return false;
    if (modulePermission.hide === true || modulePermission.hide === 1) {
      return false;
    }

    const noActions =
      !modulePermission.read &&
      !modulePermission.add &&
      !modulePermission.edit &&
      !modulePermission.delete &&
      !modulePermission.approve;

    if (noActions) return false;

    return modulePermission.read === true || modulePermission.read === 1;
  };

  const subItems = useMemo(
    () =>
      [
        {
          label: "Outgoing Payment",
          path: "/yen-book/OutgoingPaymentPage",
          visible: isModuleVisible("outgoingpayment"),
        },
        {
          label: "Expense Management",
          path: "/yen-book/ExpenseManagementPage",
          visible: [
            "expensecategory",
            "expensesubcategory",
            "expensename",
          ].some((key) => isModuleVisible(key)),
        },
      ].filter((item) => item.visible),
    [permissions],
  );

  React.useEffect(() => {
    const isExactYenBook =
      pathname === "/yen-book" || pathname === "/yen-book/";

    if (isExactYenBook && permissionsLoaded && subItems.length > 0) {
      router.replace(subItems[0].path);
    }
  }, [pathname, permissionsLoaded, subItems, router]);

  return null;
};

export default YenBookPage;
