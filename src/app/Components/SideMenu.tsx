// components/SideMenu.tsx
import React from 'react';
import { Drawer, List, ListItem, ListItemIcon, ListItemText, Typography, Box } from '@mui/material';
import {
  BookOnline as BookOnlineIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory2 as Inventory2Icon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  ReceiptLong as ReceiptLongIcon,
  WhatsApp as WhatsAppIcon,
  DashboardOutlined as DashboardOutlinedIcon,
  BusinessOutlined as BusinessOutlinedIcon,
} from '@mui/icons-material';
import Image from 'next/image';
import './SideMenu.css';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';

const drawerWidth = 250;

export interface MenuItem {
  text: string;
  icon: React.ReactNode;
  subItems: string[];
  path: string;
}

export const menuItems: MenuItem[] = [
  { text: 'MASTER-ADMIN', icon: <AdminPanelSettingsIcon />, subItems: [], path: '/master-admin' },
  {
    text: 'YEN POS', icon: <ReceiptLongIcon />,
    subItems: ['Cash Management', 'Table Master', 'Bill Receipts', 'EB Reading', 'POS Devices', 'Print Barcodes', 'Print Unique Barcodes'],
    path: '/yen-pos',
  },
  { text: 'WHATSAPP', icon: <WhatsAppIcon />, subItems: ['WhatsAppAdmin', 'WhatsAppMaster'], path: '/WhatsApp' },
  { text: 'YEN PURCHASE', icon: <ShoppingCartIcon />, subItems: ['Vendor', 'Purchase Item', 'Purchase Order', 'Goods Receipt Note', 'AP Invoice'], path: '/yen-purchase' },
  { text: 'YEN INVENTORY', icon: <Inventory2Icon />, subItems: ['Outlets Inventory Management', 'Warehouse Inventory Management'], path: '/yen-inventory' },
  { text: 'YEN BOOK', icon: <BookOnlineIcon />, subItems: ['OutGoing Payment'], path: '/yen-book' },
  { text: 'YEN REPORTS', icon: <AssessmentIcon />, subItems: [], path: '/QlikReport' },
  { text: 'ACCOUNT SETTINGS', icon: <AccountCircleIcon />, subItems: ['Business Details', 'Personal Details'], path: '/account-settings' },
  { text: 'SETTINGS', icon: <SettingsIcon />, subItems: ['Date Settings', 'Purchase Settings', 'General Settings'], path: '/yen-settings' },
];

interface SideMenuProps {
  onMenuClick: (menuItem: { path: string; text: string }) => void;
  activePath: string;
  showPurchaseMenu?: boolean;
  showBookMenu?: boolean;
  showInventoryMenu?: boolean;
  showReportsMenu?: boolean;
}

const SideMenu: React.FC<SideMenuProps> = ({
  onMenuClick,
  activePath,
  showPurchaseMenu,
  showBookMenu,
  showInventoryMenu,
  showReportsMenu,
}) => {
  const role = useSelector((state: RootState) => state.auth.role);
  const isSuperAdmin = role === 'Super Admin';
  const permissions = useSelector((state: RootState) => state.auth.permissions?.yenerp || {});
  const hasSettingsRead = (() => {
    const modulePermission = permissions?.settings;
    if (!modulePermission || modulePermission.hide === true) return false;
    return modulePermission.read === true;
  })();

  const isActive = (path: string) => activePath === path || activePath.startsWith(`${path}/`);

  const visibleItems = menuItems.filter((menuItem) => {
    if (menuItem.text === 'YEN PURCHASE' && !showPurchaseMenu) return false;
    if (menuItem.text === 'YEN BOOK' && !showBookMenu) return false;
    if (menuItem.text === 'YEN INVENTORY' && !showInventoryMenu) return false;
    if (menuItem.text === 'YEN REPORTS' && !showReportsMenu) return false;
    if (menuItem.text === 'ACCOUNT SETTINGS' && !isSuperAdmin) return false;
    if (menuItem.text === 'SETTINGS') return hasSettingsRead;
    if (menuItem.text === 'MASTER-ADMIN' && !isSuperAdmin) return false;
    if (menuItem.text === 'YEN POS' && !isSuperAdmin) return false;
    if (menuItem.text === 'WHATSAPP' && !isSuperAdmin) return false;
    return true;
  });

  const mainItems = visibleItems.filter((item) => !['ACCOUNT SETTINGS', 'SETTINGS'].includes(item.text));
  const systemItems = visibleItems.filter((item) => ['ACCOUNT SETTINGS', 'SETTINGS'].includes(item.text));

  const renderItem = (menuItem: MenuItem) => (
    <ListItem
      button
      key={menuItem.path}
      onClick={() => onMenuClick(menuItem)}
      className={`erp-sidebar-item ${isActive(menuItem.path) ? 'is-active' : ''}`}
    >
      <ListItemIcon className="erp-sidebar-icon">{menuItem.icon}</ListItemIcon>
      <ListItemText
        primary={menuItem.text.replace('MASTER-ADMIN', 'Dashboard')}
        primaryTypographyProps={{ className: 'erp-sidebar-label' }}
      />
    </ListItem>
  );

  return (
    <Drawer
      variant="permanent"
      className="erp-sidebar"
      PaperProps={{ className: 'erp-sidebar-paper', style: { width: drawerWidth } }}
    >
      <Box className="erp-sidebar-brand">
        <Box className="erp-brand-mark">
          <Image src="/images/vmasoftlogo.jpeg" alt="YEN ERP" width={38} height={38} priority />
        </Box>
        <Box>
          <Typography className="erp-brand-title">YENERP</Typography>
          <Typography className="erp-brand-subtitle">ENTERPRISE</Typography>
        </Box>
      </Box>

      <Box className="erp-sidebar-scroll">
        <Typography className="erp-sidebar-section">MAIN</Typography>
        <List disablePadding>
          <ListItem button onClick={() => onMenuClick({ path: '/master-admin', text: 'Dashboard' })} className={`erp-sidebar-item ${activePath === '/master-admin' ? 'is-active' : ''}`}>
            <ListItemIcon className="erp-sidebar-icon"><DashboardOutlinedIcon /></ListItemIcon>
            <ListItemText primary="Dashboard" primaryTypographyProps={{ className: 'erp-sidebar-label' }} />
          </ListItem>
          {mainItems.filter((item) => item.text !== 'MASTER-ADMIN').map(renderItem)}
        </List>

        {systemItems.length > 0 && (
          <>
            <Typography className="erp-sidebar-section erp-sidebar-system">SYSTEM</Typography>
            <List disablePadding>{systemItems.map(renderItem)}</List>
          </>
        )}
      </Box>

      <Box className="erp-sidebar-footer">
        <BusinessOutlinedIcon />
        <span>YEN ERP Workspace</span>
      </Box>
    </Drawer>
  );
};

export default SideMenu;
