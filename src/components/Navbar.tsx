'use client';
import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { logout} from '../features/authSlice';
import { fetchBusinesses, selectBusinesses, fetchPhoto } from '@/features/account-setting/businessSlice';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import './Navbar.css';
import ConfirmationDialog from './confirmationDialog';
import { FiLogOut, FiMenu, FiUser, FiClock } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { setManualLogoutFlag } from '@/utils/api';


interface NavbarProps {
  moduleName: string;
  username: string;
  onToggleMenu: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ moduleName, username, onToggleMenu }) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { businesses } = useSelector(selectBusinesses);
  const [fetchedBusinessIds, setFetchedBusinessIds] = useState(new Set<string>());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [companyName, setCompanyName] = useState('YEN ERP');

  useEffect(() => {
    const storedName = sessionStorage.getItem('tenantName') || sessionStorage.getItem('companyName');
    if (storedName) setCompanyName(storedName);
  }, []);

  // Fetch businesses on mount
// Fetch businesses on mount — only if not already loaded
useEffect(() => {
  if (businesses.length === 0) {
    dispatch(fetchBusinesses());
  }
}, [dispatch, businesses.length]);

// Fetch business photos — only if imageUrl missing
useEffect(() => {
  businesses.forEach((business) => {
    if (!business.imageUrl && !fetchedBusinessIds.has(business.businessId)) {
      dispatch(fetchPhoto(business.businessId));
      setFetchedBusinessIds((prevSet) => new Set([...prevSet, business.businessId]));
    }
  });
}, [businesses, fetchedBusinessIds, dispatch]);




  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };


const handleConfirmLogout = async () => {
    setManualLogoutFlag();

    setIsDialogOpen(false);
      
  try {
  await dispatch(logout('manual')).unwrap();

  sessionStorage.clear();
  localStorage.removeItem('browserSessionId');

  // 🔥 Full page reload — clears ALL in-memory Redux state
  // (businesses, roles, permissions etc from the previous session)
  window.location.href = '/';
} catch (error) {
  console.error('Logout failed:', error);

  sessionStorage.clear();
  localStorage.removeItem('browserSessionId');

  window.location.href = '/';
}

  };

  

  return (
    <>
      <header className="navbar">
        <div className="navbar-content">
          <div className="navbar-left">
            <button onClick={onToggleMenu} className="menu-toggle-button" aria-label="Toggle menu">
              <FiMenu />
            </button>
            <Typography
              sx={{
                fontSize: '20px !important',
                fontWeight: 700,
                color: '#1a1a1a',
                whiteSpace: 'nowrap',
              }}
            >
              {companyName}
            </Typography>
          </div>

    <div className="navbar-center">
  <Typography 
    sx={{ 
      fontSize: '18px !important', 
      '&.module-name-uppercase': {
        textTransform: 'uppercase !important',
      }
    }}
    className={`${moduleName === moduleName.toLowerCase() ? 'module-name-uppercase' : ''}`}
  >
    {moduleName}
  </Typography>
</div>

          <div className="navbar-right">
  
{/* 
          
            <div className="user-info">
              <div className="user-avatar">
                {username?.charAt(0).toUpperCase()}
              </div>
              <span className="username">{username}</span>
            </div> */}

            {/* Business Logos */}
            {businesses?.length > 0 ? (
              businesses.map((business) => (
                <div className="navbar-logo" key={business.businessId}>
                  {business.imageUrl ? (
                    <Image
                      src={business.imageUrl}
                      alt={business.companyName}
                      width={70}
                      height={60}
                      className="navbar-image"
                      unoptimized={business.imageUrl.includes('http')}
                    />
                  ) : (
                    <span className="no-logo">{business.companyName || 'No Logo'}</span>
                  )}
                </div>
              ))
            ) : (
              <div className="navbar-logo">
                <span className="no-logo">No Businesses</span>
              </div>
            )}

            {/* Logout Button */}
            <div className="navbar-logout">
              <button onClick={handleOpenDialog}>
                <FiLogOut />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

   

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        open={isDialogOpen}
        onClose={handleCloseDialog}
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
