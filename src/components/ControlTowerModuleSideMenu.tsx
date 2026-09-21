'use client';

import React from 'react';
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
} from '@mui/icons-material';

import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  Boxes,
  Building2,
  ClipboardCheck,
  LayoutDashboard,
  NotebookTabs,
  Repeat2,
  Settings,
  Trash2,
} from 'lucide-react';

import './ControlTowerModuleSideMenu.css';

interface ControlTowerModuleSideMenuProps {
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (item: { path: string; text: string }) => void;
}

interface ControlTowerModuleItem {
  text: string;
  path: string;
  icon: React.ReactNode;
}

// Same routes/labels as the standalone app's own AppShell nav
// (shared/layout/app-shell.tsx), just namespaced under
// /inventory-control-tower and rendered as a YenERP-style side menu
// instead of duplicating a second full app shell.
const controlTowerModules: ControlTowerModuleItem[] = [
  { text: 'Control Tower', path: '/inventory-control-tower', icon: <LayoutDashboard size={19} /> },
  { text: 'Outlet Monitor', path: '/inventory-control-tower/outlets', icon: <Building2 size={19} /> },
  { text: 'Product Monitor', path: '/inventory-control-tower/products', icon: <Boxes size={19} /> },
  { text: 'Exception Center', path: '/inventory-control-tower/exceptions', icon: <AlertTriangle size={19} /> },
  { text: 'Daily Reconciliation', path: '/inventory-control-tower/reconciliation', icon: <ClipboardCheck size={19} /> },
  { text: 'Reports & Analytics', path: '/inventory-control-tower/analytics', icon: <BarChart3 size={19} /> },
  { text: 'Alerts & Notifications', path: '/inventory-control-tower/alerts', icon: <Bell size={19} /> },
  { text: 'Inventory Ledger', path: '/inventory-control-tower/ledger', icon: <NotebookTabs size={19} /> },
  { text: 'Wastage Approval', path: '/inventory-control-tower/wastage', icon: <Trash2 size={19} /> },
  { text: 'Stock Transfer Monitor', path: '/inventory-control-tower/transfers', icon: <Repeat2 size={19} /> },
  { text: 'AI Inventory Assistant', path: '/inventory-control-tower/assistant', icon: <Bot size={19} /> },
  { text: 'Masters', path: '/inventory-control-tower/masters', icon: <Boxes size={19} /> },
  { text: 'Settings', path: '/inventory-control-tower/settings', icon: <Settings size={19} /> },
];

const ControlTowerModuleSideMenu: React.FC<
  ControlTowerModuleSideMenuProps
> = ({
  expanded,
  onToggle,
  onNavigate,
}) => {
  const pathname = usePathname();

  const isActive = (path: string) =>
    path === '/inventory-control-tower'
      ? pathname === path
      : pathname === path || pathname?.startsWith(`${path}/`);

return (
  <Box
    className={`control-tower-module-sidebar ${
      expanded ? 'is-expanded' : 'is-collapsed'
    }`}
  >
    <Box className="control-tower-module-sidebar-header">
      <Tooltip
        title={!expanded ? 'Inventory Control Tower' : ''}
        placement="right"
        arrow
      >
        <Box className="control-tower-module-brand">
          <Box className="control-tower-module-logo">
            <Activity size={21} />
          </Box>

          <Box
            className={`control-tower-module-brand-content ${
              expanded ? 'is-visible' : ''
            }`}
          >
            <Typography className="control-tower-module-sidebar-caption">
              MODULE
            </Typography>

            <Typography className="control-tower-module-sidebar-title">
              Control Tower
            </Typography>

            <Typography className="control-tower-module-sidebar-description">
              Inventory monitoring
            </Typography>
          </Box>
        </Box>
      </Tooltip>

      <IconButton
        type="button"
        className="control-tower-module-toggle"
        onClick={onToggle}
        aria-label={
          expanded
            ? 'Collapse control tower navigation'
            : 'Expand control tower navigation'
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

<List disablePadding className="control-tower-module-list">
  {controlTowerModules.map((module) => (
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
        className={`control-tower-module-item ${
          isActive(module.path) ? 'is-active' : ''
        }`}
      >
        <ListItemIcon className="control-tower-module-icon">
          {module.icon}
        </ListItemIcon>

        <Box
          className={`control-tower-module-label-wrapper ${
            expanded ? 'is-visible' : ''
          }`}
        >
          <ListItemText
            primary={module.text}
            primaryTypographyProps={{
              className: 'control-tower-module-label',
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

export default ControlTowerModuleSideMenu;
