

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button, Box } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
// import MasterAdminMenu from '../page';


const subItems = [
  { label: 'Opening Cash', path: '/yen-pos/CashManagement/OpeningCash' },
  { label: 'Petty Cash', path: '/yen-pos/CashManagement/PettyCash' },
];

const CashManagementPage = () => {

    const pathname = usePathname();
    const router = useRouter();
  
    useEffect(() => {
      if (pathname === '/yen-pos/CashManagement' || pathname === '/yen-pos/CashManagement/') {
        router.replace('/yen-pos/CashManagement/OpeningCash');
      }
    }, [pathname, router]);
  
    if (pathname === '/yen-pos/CashManagement' || pathname === '/yen-pos/CashManagement/') {
      return (
        <Box>
          {/* <MasterAdminMenu /> */}
        </Box>
      );
    }
  
    const isActiveRoute = (itemPath: string) => pathname.startsWith(itemPath);
  

  return (
    <Box>
      {/* <MasterAdminMenu /> */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 3, ml: 4.5, mt: 1 }}>
        {subItems.map((item) => {
          const isActive = isActiveRoute(item.path);
          return (
            <Link key={item.label} href={item.path} passHref style={{ textDecoration: 'none' }} prefetch={false}>
              <Button
                variant="contained"
                sx={{
                  textTransform: 'none',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontSize: '10.5px',
                  borderRadius: '5px',
                  minWidth: '80px',
                  width: '80px',
                  height: '40px',
                  backgroundColor: isActive ? 'white' : 'primary.main',
                  color: isActive ? 'black' : 'white',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0px 0px 10px rgba(0,0,0,0.15)' : 'none',
                  '&:hover': {
                    backgroundColor: isActive ? 'rgba(255,255,255,0.9)' : 'primary.dark',
                  },
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                {item.label}
              </Button>
            </Link>
          );
        })}
      </Box>
    </Box>
  );
};

export default CashManagementPage;