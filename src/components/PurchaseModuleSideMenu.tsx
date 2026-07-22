'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
} from '@mui/material';

import {
  SpaceDashboardOutlined,
  StorefrontOutlined,
  Inventory2Outlined,
  ShoppingCartCheckoutOutlined,
  HandymanOutlined,
  ReceiptLongOutlined,
  DescriptionOutlined,
} from '@mui/icons-material';

import { RootState } from '@/redux/store';
import './PurchaseModuleSideMenu.css';

interface PurchaseModuleSideMenuProps {
  onNavigate: (item: { path: string; text: string }) => void;
}

interface PurchaseModuleItem {
  text: string;
  path: string;
  icon: React.ReactNode;
  permissionKeys: string[];
}

const purchaseModules: PurchaseModuleItem[] = [
  {
    text: 'Purchase Master',
    path: '/yen-purchase/PurchaseMaster',
    icon: <SpaceDashboardOutlined />,
    permissionKeys: [
      'purchasecategory',
      'purchasesubcategory',
      'itemgroup',
      'purchaseuom',
      'purchasetax',
      'storagelocation',
      'freight',
      'itemtype',
      'service',
      'brand',
    ],
  },
  {
    text: 'Vendor',
    path: '/yen-purchase/VendorPage',
    icon: <StorefrontOutlined />,
    permissionKeys: ['vendors', 'vendortype'],
  },
  {
    text: 'Purchase Item',
    path: '/yen-purchase/PurchaseItemPage',
    icon: <Inventory2Outlined />,
    permissionKeys: ['purchaseitem'],
  },
  {
    text: 'Purchase Order',
    path: '/yen-purchase/PurchaseOrder',
    icon: <ShoppingCartCheckoutOutlined />,
    permissionKeys: [
      'purchaseorders_pending',
      'purchaseorders_approved',
      'purchaseorders_rejected',
      'purchaseorders_grn_converted',
    ],
  },
  {
    text: 'Service Order',
    path: '/yen-purchase/ServiceOrder',
    icon: <HandymanOutlined />,
    permissionKeys: [
      'serviceorders_pending',
      'serviceorders_approved',
      'serviceorders_rejected',
    ],
  },
  {
    text: 'GRN Note',
    path: '/yen-purchase/GrnPage',
    icon: <ReceiptLongOutlined />,
    permissionKeys: ['grns', 'grns_return'],
  },
  {
    text: 'AP Invoice',
    path: '/yen-purchase/ApInvoicePage',
    icon: <DescriptionOutlined />,
    permissionKeys: ['apinvoices'],
  },
];

const PurchaseModuleSideMenu: React.FC<
  PurchaseModuleSideMenuProps
> = ({ onNavigate }) => {
  const pathname = usePathname();

  const permissions = useSelector(
    (state: RootState) => state.auth.permissions?.yenerp || {}
  );

  const isModuleVisible = React.useCallback(
    (key: string) => {
      const permission = permissions?.[key];

      if (!permission) return false;

      if (permission.hide === true || permission.hide === 1) {
        return false;
      }

      return permission.read === true || permission.read === 1;
    },
    [permissions]
  );

  const visibleModules = useMemo(
    () =>
      purchaseModules.filter((module) =>
        module.permissionKeys.some((key) => isModuleVisible(key))
      ),
    [isModuleVisible]
  );

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(`${path}/`);

  return (
    <Box className="purchase-module-sidebar">
      <Box className="purchase-module-sidebar-header">
        <Typography className="purchase-module-sidebar-caption">
          MODULE
        </Typography>

        <Typography className="purchase-module-sidebar-title">
          YEN Purchase
        </Typography>

        <Typography className="purchase-module-sidebar-description">
          Purchase management
        </Typography>
      </Box>

      <List disablePadding className="purchase-module-list">
        {visibleModules.map((module) => (
          <ListItem
            button
            key={module.path}
            onClick={() =>
              onNavigate({
                path: module.path,
                text: module.text,
              })
            }
            className={`purchase-module-item ${
              isActive(module.path) ? 'is-active' : ''
            }`}
          >
            <ListItemIcon className="purchase-module-icon">
              {module.icon}
            </ListItemIcon>

            <ListItemText
              primary={module.text}
              primaryTypographyProps={{
                className: 'purchase-module-label',
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default PurchaseModuleSideMenu;