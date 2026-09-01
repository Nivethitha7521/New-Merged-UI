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
  AdminPanelSettingsOutlined,
  ChevronLeftRounded,
  ChevronRightRounded,
  MessageOutlined,
  WhatsApp as WhatsAppIcon,
} from '@mui/icons-material';
import './PurchaseModuleSideMenu.css';

interface WhatsAppModuleSideMenuProps {
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (item: { path: string; text: string }) => void;
}

interface WhatsAppModuleItem {
  text: string;
  path: string;
  icon: React.ReactNode;
}

const whatsappModules: WhatsAppModuleItem[] = [
  {
    text: 'WhatsApp Admin',
    path: '/WhatsApp/WhatsappAdmin',
    icon: <AdminPanelSettingsOutlined />,
  },
  {
    text: 'WhatsApp Master',
    path: '/WhatsApp/WhatsappMaster',
    icon: <MessageOutlined />,
  },
];

const WhatsAppModuleSideMenu: React.FC<WhatsAppModuleSideMenuProps> = ({
  expanded,
  onToggle,
  onNavigate,
}) => {
  const pathname = usePathname();
  const visibleModules = useMemo(() => whatsappModules, []);

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
          title={!expanded ? 'WhatsApp' : ''}
          placement="right"
          arrow
        >
          <Box className="purchase-module-brand">
            <Box className="purchase-module-logo">
              <WhatsAppIcon />
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
                WhatsApp
              </Typography>

              <Typography className="purchase-module-sidebar-description">
                WhatsApp administration
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
              ? 'Collapse WhatsApp navigation'
              : 'Expand WhatsApp navigation'
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

export default WhatsAppModuleSideMenu;
