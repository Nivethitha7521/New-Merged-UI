'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '../redux/store';
import { logout } from '../features/authSlice';
import { fetchBusinesses, selectBusinesses, fetchPhoto } from '@/features/account-setting/businessSlice';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import './Navbar.css';
import ConfirmationDialog from './confirmationDialog';
import {
  FiChevronRight,
  FiLogOut,
} from 'react-icons/fi';
import { setManualLogoutFlag } from '@/utils/api';

interface NavbarProps {
  moduleName: string;
  username: string;
}

const routeLabels: Record<string, string> = {
  'yen-purchase': 'YEN Purchase',
  'yen-book': 'YEN Book',
  'yen-inventory': 'YEN Inventory',
  'yen-pos': 'YEN POS',
  'master-admin': 'Master Admin',
  'account-settings': 'Account Settings',
  QlikReport: 'YEN Reports',
  WhatsApp: 'WhatsApp',
  'yen-settings': 'Settings',
};

const prettify = (value: string) => decodeURIComponent(value)
  .replace(/[-_]/g, ' ')
  .replace(/([a-z])([A-Z])/g, '$1 $2')
  .replace(/\b\w/g, (char) => char.toUpperCase());

const Navbar: React.FC<NavbarProps> = ({
  moduleName,
  username,
}) => {  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();
  const { businesses } = useSelector(selectBusinesses);
  const currentBusiness = businesses?.[0];

const companyName =
  currentBusiness?.companyName?.trim() ||
  'YEN ERP';

const companyLogo = currentBusiness?.imageUrl;
  const [fetchedBusinessIds, setFetchedBusinessIds] = useState(new Set<string>());
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (businesses.length === 0) dispatch(fetchBusinesses());
  }, [dispatch, businesses.length]);

  useEffect(() => {
    businesses.forEach((business) => {
      if (!business.imageUrl && !fetchedBusinessIds.has(business.businessId)) {
        dispatch(fetchPhoto(business.businessId));
        setFetchedBusinessIds((previous) => new Set([...previous, business.businessId]));
      }
    });
  }, [businesses, fetchedBusinessIds, dispatch]);

  const breadcrumbs = useMemo(() => {
    const parts = (pathname || '').split('/').filter(Boolean);
    if (parts.length === 0) return [];
    const root = routeLabels[parts[0]] || prettify(parts[0]);
    const current = moduleName || (parts.length > 1 ? prettify(parts[parts.length - 1]) : root);
    return root === current ? [root] : [root, current];
  }, [pathname, moduleName]);

  const handleConfirmLogout = async () => {
    setManualLogoutFlag();
    setIsDialogOpen(false);
    try {
      await dispatch(logout('manual')).unwrap();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      sessionStorage.clear();
      localStorage.removeItem('browserSessionId');
      window.location.href = '/';
    }
  };

  return (
    <>
<header className="erp-navbar">
  <Box className="erp-navbar-left">
    <Box className="erp-breadcrumbs">
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={`${item}-${index}`}>
          {index > 0 && (
            <FiChevronRight className="erp-breadcrumb-separator" />
          )}

          <Typography
            className={
              index === breadcrumbs.length - 1
                ? 'erp-breadcrumb-current'
                : 'erp-breadcrumb-item'
            }
          >
            {item}
          </Typography>
        </React.Fragment>
      ))}
    </Box>
  </Box>

  <Box className="erp-navbar-company">
    <Typography className="erp-navbar-company-name">
      {companyName}
    </Typography>
  </Box>

  <Box className="erp-navbar-right">
    <Box
      className="erp-navbar-business"
      title={companyName}
    >
      <Box className="erp-navbar-business-logo">
        {companyLogo ? (
          <Image
            src={companyLogo}
            alt={companyName}
            width={38}
            height={38}
            className="erp-navbar-business-image"
            unoptimized={
              companyLogo.startsWith('http') ||
              companyLogo.startsWith('data:')
            }
          />
        ) : (
          <span>
            {companyName.charAt(0).toUpperCase()}
          </span>
        )}
      </Box>
    </Box>

    <button
      type="button"
      className="erp-navbar-logout-button"
      onClick={() => setIsDialogOpen(true)}
      aria-label="Logout"
      title="Logout"
    >
      <FiLogOut />

      <span>Logout</span>
    </button>
  </Box>
</header>

      <ConfirmationDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={handleConfirmLogout}
        title="Confirm Logout"
        description="Are you sure you want to log out?"
        confirmText="Logout"
        cancelText="Cancel"
      />
    </>
  );
};

export default Navbar;
