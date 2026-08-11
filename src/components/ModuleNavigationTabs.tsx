'use client';

import React, { useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import './ModuleNavigationTabs.css';

export type ModuleNavigationKey =
  | 'purchase'
  | 'master-admin'
  | 'recipe'
  | 'book'
  | 'inventory'
  | 'pos'
  | 'whatsapp'
  | 'reports'
  | 'account-settings'
  | 'settings';

interface ModuleTab {
  text: string;
  path: string;
  permissionKeys?: string[];
  superAdminOnly?: boolean;
}

interface ModuleNavigationTabsProps {
  module: ModuleNavigationKey;
  onNavigate?: (item: { path: string; text: string }) => void;
}

const MODULE_TABS: Record<ModuleNavigationKey, ModuleTab[]> = {
  purchase: [
    { text: 'Purchase Master', path: '/yen-purchase/PurchaseMaster', permissionKeys: ['purchasecategory', 'purchasesubcategory', 'itemgroup', 'purchaseuom', 'purchasetax', 'storagelocation', 'freight', 'itemtype', 'service', 'brand'] },
    { text: 'Vendor', path: '/yen-purchase/VendorPage', permissionKeys: ['vendors', 'vendortype'] },
    { text: 'Purchase Item', path: '/yen-purchase/PurchaseItemPage', permissionKeys: ['purchaseitem'] },
    { text: 'Purchase Order', path: '/yen-purchase/PurchaseOrder', permissionKeys: ['purchaseorders_pending', 'purchaseorders_approved', 'purchaseorders_rejected', 'purchaseorders_grn_converted'] },
    { text: 'Service Order', path: '/yen-purchase/ServiceOrder', permissionKeys: ['serviceorders_pending', 'serviceorders_approved', 'serviceorders_rejected'] },
    { text: 'GRN Note', path: '/yen-purchase/GrnPage', permissionKeys: ['grns', 'grns_return'] },
    { text: 'AP Invoice', path: '/yen-purchase/ApInvoicePage', permissionKeys: ['apinvoices'] },
  ],
  'master-admin': [
    { text: 'Warehouse', path: '/master-admin/WarehouseMaster', superAdminOnly: true },
    { text: 'Locations', path: '/master-admin/Locations', superAdminOnly: true },
    { text: 'Item Master', path: '/master-admin/Items', superAdminOnly: true },
    { text: 'UOM', path: '/master-admin/Uom', superAdminOnly: true },
    { text: 'Tax', path: '/master-admin/Tax', superAdminOnly: true },
    { text: 'Vehicle', path: '/master-admin/Vehicle', superAdminOnly: true },
    { text: 'Discount', path: '/master-admin/Discount', superAdminOnly: true },
    { text: 'Online Partners', path: '/master-admin/OnlinePartners', superAdminOnly: true },
    { text: 'MixBox', path: '/master-admin/MixBox', superAdminOnly: true },
    { text: 'KOT Master', path: '/master-admin/KOTMaster', superAdminOnly: true },
    { text: 'Sale Order', path: '/master-admin/SaleOrder', superAdminOnly: true },
    { text: 'Section', path: '/master-admin/SectionMaster', superAdminOnly: true },
  ],
  recipe: [
    { text: 'Recipe', path: '/yen-recipie/RecipeManagement' },
    { text: 'Store Kitchen Master', path: '/yen-recipie/StoreKitchenMaster' },
  ],
  book: [
    { text: 'Outgoing Payment', path: '/yen-book/OutgoingPaymentPage', permissionKeys: ['outgoingpayment'] },
    { text: 'Expense Management', path: '/yen-book/ExpenseManagementPage', permissionKeys: ['expensecategory', 'expensesubcategory', 'expensename'] },
  ],
  inventory: [
    { text: 'Outlets Inventory Management', path: '/yen-inventory/OutletsInventoryManagement', permissionKeys: ['physicalstockmodification', 'physicalstockvariancemodification', 'stockledger'] },
    { text: 'Warehouse Inventory Management', path: '/yen-inventory/WarehouseInventoryManagement', permissionKeys: ['warehousephysicalstockmodification', 'warehousephysicalstockvariancemodification', 'warehousestockledger'] },
  ],
  pos: [
    { text: 'Cash Management', path: '/yen-pos/CashManagement', superAdminOnly: true },
    { text: 'POS Devices', path: '/yen-pos/POSDevicePage', superAdminOnly: true },
    { text: 'Reasons', path: '/yen-pos/reasons', superAdminOnly: true },
    { text: 'Prefix Master', path: '/yen-pos/prefixMaster', superAdminOnly: true },
  ],
  whatsapp: [
    { text: 'WhatsApp Admin', path: '/WhatsApp/WhatsappAdmin', superAdminOnly: true },
    { text: 'WhatsApp Master', path: '/WhatsApp/WhatsappMaster', superAdminOnly: true },
  ],
  reports: [
    { text: 'Purchase Order', path: '/QlikReport/PurchaseOrder', permissionKeys: ['purchaseorderreport'] },
    { text: 'Sale Order', path: '/QlikReport/Pos', permissionKeys: ['posreport'] },
  ],
  'account-settings': [
    { text: 'User Accounts', path: '/account-settings/UserAccount', superAdminOnly: true },
    { text: 'Role Management', path: '/account-settings/RoleManagementPage', superAdminOnly: true },
    { text: 'Business Details', path: '/account-settings/BusinessPage', superAdminOnly: true },
    { text: 'Personal Details', path: '/account-settings/PersonalPage', superAdminOnly: true },
    { text: 'Tenant', path: '/account-settings/TenantPage', superAdminOnly: true },
  ],
  settings: [
    { text: 'Settings', path: '/yen-settings', permissionKeys: ['settings'] },
    { text: 'Display Settings', path: '/yen-settings/DisplaySettings' },
  ],
};

const ModuleNavigationTabs: React.FC<ModuleNavigationTabsProps> = ({ module, onNavigate }) => {
  const pathname = usePathname();
  const router = useRouter();
  const role = useSelector((state: RootState) => state.auth.role);
  const permissions = useSelector((state: RootState) => state.auth.permissions?.yenerp || {});

  const tabs = useMemo(() => MODULE_TABS[module].filter((tab) => {
    if (tab.superAdminOnly && role !== 'Super Admin') return false;
    if (!tab.permissionKeys?.length) return true;

    return tab.permissionKeys.some((key) => {
      const permission = permissions?.[key];
      if (!permission || permission.hide === true || permission.hide === 1) return false;
      return permission.read === true || permission.read === 1;
    });
  }), [module, permissions, role]);

  const navigate = (tab: ModuleTab) => {
    if (pathname === tab.path || pathname?.startsWith(`${tab.path}/`)) return;
    if (onNavigate) onNavigate(tab);
    else router.push(tab.path);
  };

  if (tabs.length === 0) return null;

  const activePath = tabs
    .filter((tab) => pathname === tab.path || Boolean(pathname?.startsWith(`${tab.path}/`)))
    .sort((left, right) => right.path.length - left.path.length)[0]?.path;

  return (
    <nav className="erp-module-tabs" aria-label="Module navigation">
      <div className="erp-module-tabs-scroll">
        {tabs.map((tab) => {
          const active = activePath === tab.path;

          return (
            <button
              key={tab.path}
              type="button"
              className={`erp-module-tab ${active ? 'is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
              onClick={() => navigate(tab)}
            >
              {tab.text}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default ModuleNavigationTabs;
