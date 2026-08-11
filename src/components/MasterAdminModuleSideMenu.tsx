'use client';

import React, { useMemo } from 'react';
import { usePathname } from 'next/navigation';

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
  WarehouseOutlined,
  LocationOnOutlined,
  Inventory2Outlined,
  StraightenOutlined,
  ReceiptLongOutlined,
  LocalShippingOutlined,
  LocalOfferOutlined,
  LanguageOutlined,
  AllInboxOutlined,
  RestaurantMenuOutlined,
  AssignmentOutlined,
  ViewModuleOutlined,
  AdminPanelSettingsOutlined,
  AddCircleOutlineRounded,
  TuneRounded,
  TableRestaurantOutlined,
} from '@mui/icons-material';

import './MasterAdminModuleSideMenu.css';

interface MasterAdminModuleSideMenuProps {
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (item: {
    path: string;
    text: string;
  }) => void;
}

interface MasterAdminModuleItem {
  text: string;
  path: string;
  icon: React.ReactNode;
}



/* -------------------------------------------------------------------------- */
/* MASTER ADMIN MODULES                                                       */
/* -------------------------------------------------------------------------- */

const masterAdminModules: MasterAdminModuleItem[] = [
  {
    text: 'Warehouse',
    path: '/master-admin/WarehouseMaster',
    icon: <WarehouseOutlined />,
  },
  {
    text: 'Locations',
    path: '/master-admin/Locations',
    icon: <LocationOnOutlined />,
  },
  {
    text: 'Item Master',
    path: '/master-admin/Items',
    icon: <Inventory2Outlined />,
  },
  {
    text: 'UOM',
    path: '/master-admin/Uom',
    icon: <StraightenOutlined />,
  },
  {
    text: 'Tax',
    path: '/master-admin/Tax',
    icon: <ReceiptLongOutlined />,
  },
  {
    text: 'Vehicle',
    path: '/master-admin/Vehicle',
    icon: <LocalShippingOutlined />,
  },
  {
    text: 'Discount',
    path: '/master-admin/Discount',
    icon: <LocalOfferOutlined />,
  },
  {
    text: 'Online Partners',
    path: '/master-admin/OnlinePartners',
    icon: <LanguageOutlined />,
  },
  {
    text: 'MixBox',
    path: '/master-admin/MixBox',
    icon: <AllInboxOutlined />,
  },
  {
    text: 'KOT Master',
    path: '/master-admin/KOTMaster',
    icon: <RestaurantMenuOutlined />,
  },
  {
    text: 'Sale Order',
    path: '/master-admin/SaleOrder',
    icon: <AssignmentOutlined />,
  },
  {
    text: 'Section',
    path: '/master-admin/SectionMaster',
    icon: <ViewModuleOutlined />,
  },
];

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

const MasterAdminModuleSideMenu: React.FC<
  MasterAdminModuleSideMenuProps
> = ({
  expanded,
  onToggle,
  onNavigate,
}) => {
  const pathname = usePathname();

  const visibleModules = useMemo<MasterAdminModuleItem[]>(
    () => masterAdminModules,
    []
  );

  const isActive = (path: string): boolean =>
    pathname === path ||
    Boolean(pathname?.startsWith(`${path}/`));

 

  return (
    <Box
      className={`master-admin-module-sidebar ${
        expanded ? 'is-expanded' : 'is-collapsed'
      }`}
    >
      {/* ------------------------------------------------------------------ */}
      {/* HEADER                                                             */}
      {/* ------------------------------------------------------------------ */}

      <Box className="master-admin-module-sidebar-header">
        <Tooltip
          title={!expanded ? 'Master Admin' : ''}
          placement="right"
          arrow
        >
          <Box className="master-admin-module-brand">
            <Box className="master-admin-module-brand-icon">
              <AdminPanelSettingsOutlined />
            </Box>

            <Box
              className={`master-admin-module-brand-content ${
                expanded ? 'is-visible' : ''
              }`}
            >
              <Typography className="master-admin-module-sidebar-caption">
                MODULE
              </Typography>

              <Typography className="master-admin-module-sidebar-title">
                Master Admin
              </Typography>

              <Typography className="master-admin-module-sidebar-description">
                Master configuration
              </Typography>
            </Box>
          </Box>
        </Tooltip>

        <IconButton
          type="button"
          className="master-admin-module-toggle"
          onClick={onToggle}
          aria-label={
            expanded
              ? 'Collapse Master Admin navigation'
              : 'Expand Master Admin navigation'
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

      {/* ------------------------------------------------------------------ */}
      {/* MODULE LIST                                                        */}
      {/* ------------------------------------------------------------------ */}

      <List
        disablePadding
        className="master-admin-module-list"
      >
        {visibleModules.map((module: MasterAdminModuleItem) => {
        

          return (
            <React.Fragment key={module.path}>
              <Tooltip
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
                  className={`master-admin-module-item ${
                    isActive(module.path)
                      ? 'is-active'
                      : ''
                  }`}
                >
                  <ListItemIcon className="master-admin-module-icon">
                    {module.icon}
                  </ListItemIcon>

                  <Box
                    className={`master-admin-module-label-wrapper ${
                      expanded ? 'is-visible' : ''
                    }`}
                  >
                    <ListItemText
                      primary={module.text}
                      primaryTypographyProps={{
                        className:
                          'master-admin-module-label',
                      }}
                    />
                  </Box>
                </ListItem>
              </Tooltip>


            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
};

export default MasterAdminModuleSideMenu;