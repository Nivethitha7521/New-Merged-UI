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
 PaymentsOutlined,
  PointOfSaleOutlined,
  RuleOutlined,
  LocalOfferOutlined,
} from '@mui/icons-material';
import './PurchaseModuleSideMenu.css';

interface YenPosModuleSideMenuProps {
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (item: { path: string; text: string }) => void;
}

interface YenPosModuleItem {
  text: string;
  path: string;
  icon: React.ReactNode;
}

const yenPosModules: YenPosModuleItem[] = [
  {
    text: 'Cash Management',
    path: '/yen-pos/CashManagement',
    icon: <PaymentsOutlined />,
  },
  {
    text: 'POS Devices',
    path: '/yen-pos/POSDevicePage',
    icon: <PointOfSaleOutlined />,
  },
  {
        text: 'Reasons',
    path: '/yen-pos/reasons',
    icon: <RuleOutlined />,
  },
  {
    text: 'Prefix Master',
    path: '/yen-pos/prefixMaster',
    icon: <LocalOfferOutlined />,
  },
];

const YenPosModuleSideMenu: React.FC<YenPosModuleSideMenuProps> = ({
  expanded,
  onToggle,
  onNavigate,
}) => {
  const pathname = usePathname();

  const visibleModules = useMemo(() => yenPosModules, []);

  const isActive = (path: string) =>
    pathname === path || Boolean(pathname?.startsWith(`${path}/`));

  return (
    <Box
      className={`purchase-module-sidebar ${
        expanded ? 'is-expanded' : 'is-collapsed'
      }`}
    >
      <Box className="purchase-module-sidebar-header">
        <Tooltip
          title={!expanded ? 'YEN POS' : ''}
          placement="right"
          arrow
        >
          <Box className="purchase-module-brand">
            <Box className="purchase-module-logo">
              <PointOfSaleOutlined />
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
                YEN POS
            </Typography>

              <Typography className="purchase-module-sidebar-description">
                Point of sale setup
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
              ? 'Collapse YEN POS navigation'
              : 'Expand YEN POS navigation'
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

export default YenPosModuleSideMenu;
