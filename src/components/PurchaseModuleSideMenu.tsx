'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useSelector } from 'react-redux';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';

import {
  ChevronLeftRounded,
  ChevronRightRounded,
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
  expanded: boolean;
  onToggle: () => void;
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
> = ({
  expanded,
  onToggle,
  onNavigate,
}) => {
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
  <Box
    className={`purchase-module-sidebar ${
      expanded ? 'is-expanded' : 'is-collapsed'
    }`}
  >
    <Box className="purchase-module-sidebar-header">
      <Tooltip
        title={!expanded ? 'YEN Purchase' : ''}
        placement="right"
        arrow
      >
        <Box className="purchase-module-brand">
          <Box className="purchase-module-logo">
            <ShoppingCartCheckoutOutlined />
          </Box>

          <Box
            className={`purchase-module-brand-content ${
              expanded ? 'is-visible' : ''
            }`}
          >
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
        </Box>
      </Tooltip>

      <IconButton
        type="button"
        className="purchase-module-toggle"
        onClick={onToggle}
        aria-label={
          expanded
            ? 'Collapse purchase navigation'
            : 'Expand purchase navigation'
        }
        aria-expanded={expanded}
      >
        {expanded ? (
          <ChevronLeftRounded />
        ) : (
          <ChevronRightRounded />
        )}
      </IconButton>
    </Box>

<List disablePadding className="purchase-module-list">
  {visibleModules.map((module) => (
    <Tooltip
      key={module.path}
      title={!expanded ? module.text : ''}
      placement="right"
      arrow
    >
      <ListItem
        button
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

        <Box
          className={`purchase-module-label-wrapper ${
            expanded ? 'is-visible' : ''
          }`}
        >
          <ListItemText
            primary={module.text}
            primaryTypographyProps={{
              className: 'purchase-module-label',
            }}
          />
        </Box>
      </ListItem>
    </Tooltip>
  ))}
</List>
  </Box>
);
};

export default PurchaseModuleSideMenu;