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
  Inventory2Outlined,
  StorefrontOutlined,
  WarehouseOutlined,
} from '@mui/icons-material';

import { RootState } from '@/redux/store';
import './InventoryModuleSideMenu.css';

interface InventoryModuleSideMenuProps {
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (item: { path: string; text: string }) => void;
}

interface InventoryModuleItem {
  text: string;
  path: string;
  icon: React.ReactNode;
  permissionKeys: string[];
}

// Same paths + permission keys already used by ModuleNavigationTabs'
// `inventory` case, so behaviour/visibility stays identical — this is
// purely a new side-menu presentation of the existing navigation.
const inventoryModules: InventoryModuleItem[] = [
  {
    text: 'Outlets Inventory Management',
    path: '/yen-inventory/OutletsInventoryManagement',
    icon: <StorefrontOutlined />,
    permissionKeys: [
      'physicalstockmodification',
      'physicalstockvariancemodification',
      'stockledger',
    ],
  },
  {
    text: 'Warehouse Inventory Management',
    path: '/yen-inventory/WarehouseInventoryManagement',
    icon: <WarehouseOutlined />,
    permissionKeys: [
      'warehousephysicalstockmodification',
      'warehousephysicalstockvariancemodification',
      'warehousestockledger',
    ],
  },
];

const InventoryModuleSideMenu: React.FC<
  InventoryModuleSideMenuProps
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
      inventoryModules.filter((module) =>
        module.permissionKeys.some((key) => isModuleVisible(key))
      ),
    [isModuleVisible]
  );

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(`${path}/`);

return (
  <Box
    className={`inventory-module-sidebar ${
      expanded ? 'is-expanded' : 'is-collapsed'
    }`}
  >
    <Box className="inventory-module-sidebar-header">
      <Tooltip
        title={!expanded ? 'YEN Inventory' : ''}
        placement="right"
        arrow
      >
        <Box className="inventory-module-brand">
          <Box className="inventory-module-logo">
            <Inventory2Outlined />
          </Box>

          <Box
            className={`inventory-module-brand-content ${
              expanded ? 'is-visible' : ''
            }`}
          >
            <Typography className="inventory-module-sidebar-caption">
              MODULE
            </Typography>

            <Typography className="inventory-module-sidebar-title">
              YEN Inventory
            </Typography>

            <Typography className="inventory-module-sidebar-description">
              Inventory management
            </Typography>
          </Box>
        </Box>
      </Tooltip>

      <IconButton
        type="button"
        className="inventory-module-toggle"
        onClick={onToggle}
        aria-label={
          expanded
            ? 'Collapse inventory navigation'
            : 'Expand inventory navigation'
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

<List disablePadding className="inventory-module-list">
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
        className={`inventory-module-item ${
          isActive(module.path) ? 'is-active' : ''
        }`}
      >
        <ListItemIcon className="inventory-module-icon">
          {module.icon}
        </ListItemIcon>

        <Box
          className={`inventory-module-label-wrapper ${
            expanded ? 'is-visible' : ''
          }`}
        >
          <ListItemText
            primary={module.text}
            primaryTypographyProps={{
              className: 'inventory-module-label',
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

export default InventoryModuleSideMenu;