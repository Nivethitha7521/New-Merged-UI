'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import {
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  AddCircleOutlineRounded,
  TuneRounded,
  TableRestaurantOutlined,
  RestaurantMenuOutlined,
} from '@mui/icons-material';
import './KOTMasterSubMenu.css';

interface KOTMasterSubMenuProps {
  onNavigate: (item: { path: string; text: string }) => void;
}

const kotMasterItems = [
  {
    text: 'Add On',
    path: '/master-admin/KOTMaster/addOn',
    icon: <AddCircleOutlineRounded />,
  },
  {
    text: 'Variant',
    path: '/master-admin/KOTMaster/variants',
    icon: <TuneRounded />,
  },
  {
    text: 'KOT Table',
    path: '/master-admin/KOTMaster/TableMaster',
    icon: <TableRestaurantOutlined />,
  },
];

const KOTMasterSubMenu: React.FC<KOTMasterSubMenuProps> = ({ onNavigate }) => {
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || Boolean(pathname?.startsWith(`${path}/`));

  return (
    <Box className="kot-master-submenu-sidebar">
      <Box className="kot-master-submenu-header">
        <Box className="kot-master-submenu-logo">
          <RestaurantMenuOutlined />
        </Box>
        <Box className="kot-master-submenu-heading">
          <Typography className="kot-master-submenu-caption">KOT MASTER</Typography>
          <Typography className="kot-master-submenu-title">Configuration</Typography>
        </Box>
      </Box>

      <List disablePadding className="kot-master-submenu-list">
        {kotMasterItems.map((item) => (
          <Tooltip key={item.path} title={item.text} placement="right" arrow>
            <ListItem
              button
              className={`kot-master-submenu-item ${isActive(item.path) ? 'is-active' : ''}`}
              onClick={() => onNavigate({ path: item.path, text: item.text })}
            >
              <ListItemIcon className="kot-master-submenu-icon">{item.icon}</ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{ className: 'kot-master-submenu-label' }}
              />
            </ListItem>
          </Tooltip>
        ))}
      </List>
    </Box>
  );
};

export default KOTMasterSubMenu;
