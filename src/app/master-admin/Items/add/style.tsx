'use client';

import { useEffect, useCallback } from 'react';
import { Box } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
// import Navbar from '../../../Components/NavBar';
// import SideMenu from '../../../Components/SideMenu';



const ItemMaster = () => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/master-admin/Items' || pathname === '/master-admin/Items/') {
      router.replace('/master-admin/Items/Item');
    }
  }, [pathname, router]);

  // Handle logout action
  const handleLogout = () => {
    router.push('/');
  };

  const handleMenuClick = useCallback((menuItem: { path: string }) => {
    router.push(menuItem.path);
  }, [router]);


  return (
    <Box>
      {/* Navbar at the top
      <Navbar moduleName="ITEMS" onLogout={handleLogout} />

      {/* SideMenu */}
      {/* <SideMenu onMenuClick={handleMenuClick} activePath={pathname || '/'} />  */}

      {/* Item Master submenu */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        flexWrap: 'wrap', 
        gap: 2, 
        mb: 3, 
        ml: 8, // Adjusted to match MasterAdminPage
        mt: -4 // Adjusted to match MasterAdminPage
      }}>
      </Box>
    </Box>
  );
};

export default ItemMaster;