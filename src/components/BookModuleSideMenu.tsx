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
  PaymentsOutlined,
  AccountBalanceWalletOutlined,
} from '@mui/icons-material';

import { RootState } from '@/redux/store';
import './BookModuleSideMenu.css';

interface BookModuleSideMenuProps {
  onNavigate: (item: { path: string; text: string }) => void;
}

interface BookModuleItem {
  text: string;
  path: string;
  icon: React.ReactNode;
  permissionKeys: string[];
}

const bookModules: BookModuleItem[] = [
  {
    text: 'Outgoing Payment',
    path: '/yen-book/OutgoingPaymentPage',
    icon: <PaymentsOutlined />,
    permissionKeys: ['outgoingpayment'],
  },
  {
    text: 'Expense Management',
    path: '/yen-book/ExpenseManagementPage',
    icon: <AccountBalanceWalletOutlined />,
    permissionKeys: ['expensecategory', 'expensesubcategory', 'expensename'],
  },
];

const BookModuleSideMenu: React.FC<BookModuleSideMenuProps> = ({
  onNavigate,
}) => {
  const pathname = usePathname();

  const permissions = useSelector(
    (state: RootState) => state.auth.permissions?.yenerp || {},
  );

  const isModuleVisible = React.useCallback(
    (key: string) => {
      const permission = permissions?.[key];

      if (!permission) return false;
      if (permission.hide === true || permission.hide === 1) return false;

      return permission.read === true || permission.read === 1;
    },
    [permissions],
  );

  const visibleModules = useMemo(
    () =>
      bookModules.filter((module) =>
        module.permissionKeys.some((key) => isModuleVisible(key)),
      ),
    [isModuleVisible],
  );

  const isActive = (path: string) =>
    pathname === path || pathname?.startsWith(`${path}/`);

  return (
    <Box className="book-module-sidebar">
      <Box className="book-module-sidebar-header">
        <Typography className="book-module-sidebar-caption">
          MODULE
        </Typography>

        <Typography className="book-module-sidebar-title">
          YEN Book
        </Typography>

        <Typography className="book-module-sidebar-description">
          Payments and expense management
        </Typography>
      </Box>

      <List disablePadding className="book-module-list">
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
            className={`book-module-item ${
              isActive(module.path) ? 'is-active' : ''
            }`}
          >
            <ListItemIcon className="book-module-icon">
              {module.icon}
            </ListItemIcon>

            <ListItemText
              primary={module.text}
              primaryTypographyProps={{
                className: 'book-module-label',
              }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default BookModuleSideMenu;
