// components/SideMenu.tsx
import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
} from '@mui/material';
import {
  BookOnline as BookOnlineIcon,
  ShoppingCart as ShoppingCartIcon,
  Inventory2 as Inventory2Icon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Assessment as AssessmentIcon,
  
  ReceiptLong as ReceiptLongIcon,
  WhatsApp as WhatsAppIcon,
  DashboardOutlined as DashboardOutlinedIcon,
 BusinessOutlined as BusinessOutlinedIcon,
ChevronRightRounded as ChevronRightRoundedIcon,
ChevronLeftRounded as ChevronLeftRoundedIcon,
  PaletteOutlined as PaletteOutlinedIcon,

} from '@mui/icons-material';
import Image from 'next/image';
import './SideMenu.css';
import { useSelector } from 'react-redux';
import { RootState } from '@/redux/store';


export interface MenuItem {
  text: string;
  icon: React.ReactNode;
  subItems: string[];
  path: string;
}

export const menuItems: MenuItem[] = [
 {
  text: 'MASTER-ADMIN',
  icon: <DashboardOutlinedIcon />,
  subItems: [],
  path: '/master-admin',
},
  {
    text: 'YEN POS', icon: <ReceiptLongIcon />,
    subItems: ['Cash Management', 'Table Master', 'Bill Receipts', 'EB Reading', 'POS Devices', 'Print Barcodes', 'Print Unique Barcodes'],
    path: '/yen-pos',
  },
  { text: 'WHATSAPP', icon: <WhatsAppIcon />, subItems: ['WhatsAppAdmin', 'WhatsAppMaster'], path: '/WhatsApp' },
  { text: 'YEN PURCHASE', icon: <ShoppingCartIcon />, subItems: ['Purchase Master', 'Vendor', 'Purchase Item', 'Purchase Order', 'Service Order', 'GRN Note', 'AP Invoice'], path: '/yen-purchase' },
  { text: 'YEN INVENTORY', icon: <Inventory2Icon />, subItems: ['Outlets Inventory Management', 'Warehouse Inventory Management'], path: '/yen-inventory' },
  { text: 'YEN BOOK', icon: <BookOnlineIcon />, subItems: ['OutGoing Payment'], path: '/yen-book' },
  { text: 'YEN REPORTS', icon: <AssessmentIcon />, subItems: [], path: '/QlikReport' },
  { text: 'ACCOUNT SETTINGS', icon: <AccountCircleIcon />, subItems: ['Business Details', 'Personal Details'], path: '/account-settings' },
  { text: 'SETTINGS', icon: <SettingsIcon />, subItems: ['Date Settings', 'Purchase Settings', 'General Settings'], path: '/yen-settings' },
  { text: 'DISPLAY SETTINGS', icon: <PaletteOutlinedIcon />, subItems: [], path: '/yen-settings/DisplaySettings' },
];



interface SideMenuProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onMenuClick: (menuItem: MenuItem) => void;
  activePath: string;
  showPurchaseMenu: boolean;
  showBookMenu: boolean;
  showInventoryMenu: boolean;
  showReportsMenu: boolean;
}

const SideMenu: React.FC<SideMenuProps> = ({
  collapsed,
  onToggleCollapse,
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

  const mainItems = visibleItems.filter((item) => !['ACCOUNT SETTINGS', 'SETTINGS', 'DISPLAY SETTINGS'].includes(item.text));
  const systemItems = visibleItems.filter((item) => ['ACCOUNT SETTINGS', 'SETTINGS', 'DISPLAY SETTINGS'].includes(item.text));

const renderItem = (menuItem: MenuItem) => {
  const displayText = menuItem.text
    .replace('MASTER-ADMIN', 'Master Admin')
    .replace('YEN PURCHASE', 'YEN Purchase')
    .replace('YEN INVENTORY', 'YEN Inventory')
    .replace('YEN BOOK', 'YEN Book')
    .replace('YEN REPORTS', 'YEN Reports')
    .replace('ACCOUNT SETTINGS', 'Account Settings')
    .replace('DISPLAY SETTINGS', 'Display Settings')
    .replace('SETTINGS', 'Settings')
    .replace('WHATSAPP', 'Whatsapp');

  return (
    <ListItem
      button
      key={menuItem.path}
      onClick={() => onMenuClick(menuItem)}
      className={`erp-sidebar-item ${
        isActive(menuItem.path) ? 'is-active' : ''
      }`}
      title={collapsed ? displayText : undefined}
    >
      <ListItemIcon className="erp-sidebar-icon">
        {menuItem.icon}
      </ListItemIcon>

{!collapsed && (
  <ListItemText
    primary={displayText}
    primaryTypographyProps={{
      className: 'erp-sidebar-label',
    }}
  />
)}
    </ListItem>
  );
};

return (
  <Drawer
    variant="permanent"
    className={`erp-sidebar ${
      collapsed ? 'is-collapsed' : 'is-expanded'
    }`}
    PaperProps={{
      className: 'erp-sidebar-paper',
    }}
  >
    <button
      type="button"
      className="erp-sidebar-toggle"
      onClick={onToggleCollapse}
      aria-label={
        collapsed
          ? 'Expand sidebar'
          : 'Collapse sidebar'
      }
      title={
        collapsed
          ? 'Expand sidebar'
          : 'Collapse sidebar'
      }
    >
      {collapsed ? (
        <ChevronRightRoundedIcon />
      ) : (
        <ChevronLeftRoundedIcon />
      )}
    </button>

<Box className="erp-sidebar-brand">
  <Box className="erp-brand-mark">
<Image
  src="/images/vmasoftlogo.jpeg"
  alt="YEN ERP"
  width={52}
  height={52}
  priority
/>
  </Box>

  {!collapsed && (
    <Box className="erp-sidebar-brand-text">
      <Typography className="erp-brand-title">
        YENERP
      </Typography>
    </Box>
  )}
</Box>

    <Box className="erp-sidebar-scroll">
      {!collapsed && (
        <Typography className="erp-sidebar-section">
          MAIN
        </Typography>
      )}

<List disablePadding>
  {mainItems.map(renderItem)}
</List>

      {systemItems.length > 0 && (
        <>
          {!collapsed && (
            <Typography
              className="erp-sidebar-section erp-sidebar-system"
            >
              SYSTEM
            </Typography>
          )}

          <List disablePadding>
            {systemItems.map(renderItem)}
          </List>
        </>
      )}
    </Box>

<Box className="erp-sidebar-footer">
  <BusinessOutlinedIcon />

  {!collapsed && (
    <span className="erp-sidebar-footer-text">
      YEN ERP Workspace
    </span>
  )}
</Box>
  </Drawer>
);
};

export default SideMenu;
