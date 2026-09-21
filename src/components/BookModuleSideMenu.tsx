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
  PaymentsOutlined,
  AccountBalanceWalletOutlined,
  AccountBalanceOutlined,
} from '@mui/icons-material';

import { RootState } from '@/redux/store';
import './BookModuleSideMenu.css';

interface BookModuleSideMenuProps {
  expanded: boolean;
  onToggle: () => void;
  onNavigate: (item: {
    path: string;
    text: string;
  }) => void;
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
    permissionKeys: [
      'expensecategory',
      'expensesubcategory',
      'expensename',
    ],
  },
];

const BookModuleSideMenu: React.FC<
  BookModuleSideMenuProps
> = ({
  expanded,
  onToggle,
  onNavigate,
}) => {
  const pathname = usePathname();

  const permissions = useSelector(
    (state: RootState) =>
      state.auth.permissions?.yenerp || {},
  );

  const isModuleVisible = React.useCallback(
    (key: string) => {
      const permission = permissions?.[key];

      if (!permission) {
        return false;
      }

      if (
        permission.hide === true ||
        permission.hide === 1
      ) {
        return false;
      }

      return (
        permission.read === true ||
        permission.read === 1
      );
    },
    [permissions],
  );

  const visibleModules = useMemo(
    () =>
      bookModules.filter((module) =>
        module.permissionKeys.some((key) =>
          isModuleVisible(key),
        ),
      ),
    [isModuleVisible],
  );

  const isActive = (path: string) =>
    pathname === path ||
    pathname?.startsWith(`${path}/`);

  return (
    <Box
      className={`book-module-sidebar ${
        expanded
          ? 'is-expanded'
          : 'is-collapsed'
      }`}
    >
      {/* Header */}
      <Box className="book-module-sidebar-header">

        <Tooltip
          title={!expanded ? 'YEN Book' : ''}
          placement="right"
          arrow
        >
          <Box className="book-module-brand">

            <Box className="book-module-logo">
              <AccountBalanceOutlined />
            </Box>

            <Box
              className={`book-module-brand-content ${
                expanded ? 'is-visible' : ''
              }`}
            >
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

          </Box>
        </Tooltip>

        <IconButton
          type="button"
          className="book-module-toggle"
          onClick={onToggle}
          aria-label={
            expanded
              ? 'Collapse book navigation'
              : 'Expand book navigation'
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

      {/* Menu items */}
      <List
        disablePadding
        className="book-module-list"
      >
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
              className={`book-module-item ${
                isActive(module.path)
                  ? 'is-active'
                  : ''
              }`}
            >
              <ListItemIcon className="book-module-icon">
                {module.icon}
              </ListItemIcon>

              <Box
                className={`book-module-label-wrapper ${
                  expanded ? 'is-visible' : ''
                }`}
              >
                <ListItemText
                  primary={module.text}
                  primaryTypographyProps={{
                    className:
                      'book-module-label',
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

export default BookModuleSideMenu;