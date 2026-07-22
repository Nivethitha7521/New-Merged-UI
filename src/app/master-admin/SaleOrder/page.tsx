'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button, Box } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import MasterAdminMenu from '../page';


const subItems = [

  { label: "Payment Type", path: "/master-admin/SaleOrder/PaymentType" },
  { label: "Events", path: "/master-admin/SaleOrder/Events" },
  { label: "Advance Amount", path: "/master-admin/SaleOrder/AdvanceAmount" },
  { label: "Charges", path: "/master-admin/SaleOrder/Charges" },  
  { label: "DeliveryDate", path: "/master-admin/SaleOrder/DeliveryDate" },
  { label: "Delivery Type", path: "/master-admin/SaleOrder/DeliveryType" },
  
];

const MenuPage = () => {
  const pathname = usePathname();
  const router = useRouter();

      // Redirect to Category by default when accessing the main Items path
      useEffect(() => {
        if (pathname === '/master-admin/SaleOrder' || pathname === '/master-admin/SaleOrder/') {
          router.replace('/master-admin/SaleOrder/PaymentType');
        }
      }, [pathname, router]);
  
      // Early return if redirecting — avoids rendering buttons
    if (pathname === '/master-admin/SaleOrder' || pathname === '/master-admin/SaleOrder/') {
      return (
        <Box>
          <MasterAdminMenu />
        </Box>
      );
    }

  // Function to determine if a route is active (matches or starts with the current pathname)
  const isActiveRoute = (itemPath: string) => (pathname || '').startsWith(itemPath);

  return (
    <Box>
      <MasterAdminMenu />
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1, ml: 4, mt: 1 }}>
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

export default MenuPage;

















// 'use client';

// import React, { useEffect } from 'react';
// import Link from 'next/link';
// import { Box } from '@mui/material';
// import { usePathname, useRouter } from 'next/navigation';
// import MasterAdminMenu from '../page';

// const subItems = [
//   { label: 'Payment Type',   icon: 'ti-credit-card',   path: '/master-admin/SaleOrder/PaymentType' },
//   { label: 'Events',         icon: 'ti-calendar-event', path: '/master-admin/SaleOrder/Events' },
//   { label: 'Advance Amount', icon: 'ti-cash',           path: '/master-admin/SaleOrder/AdvanceAmount' },
//   { label: 'Charges',        icon: 'ti-receipt',        path: '/master-admin/SaleOrder/Charges' },
//   { label: 'Delivery Date',  icon: 'ti-calendar',       path: '/master-admin/SaleOrder/DeliveryDate' },
//   { label: 'Delivery Type',  icon: 'ti-truck',          path: '/master-admin/SaleOrder/DeliveryType' },
// ];

// const MenuPage = () => {
//   const pathname = usePathname();
//   const router = useRouter();

//   useEffect(() => {
//     if (pathname === '/master-admin/SaleOrder' || pathname === '/master-admin/SaleOrder/') {
//       router.replace('/master-admin/SaleOrder/PaymentType');
//     }
//   }, [pathname, router]);

//   if (pathname === '/master-admin/SaleOrder' || pathname === '/master-admin/SaleOrder/') {
//     return <Box><MasterAdminMenu /></Box>;
//   }

//   const isActiveRoute = (itemPath: string) => (pathname || '').startsWith(itemPath);

//   return (
//     <Box>
//       <MasterAdminMenu />

//       <p className="subnav-section-label"></p>
//       <div className="subnav-btn-strip-wrapper">
//         <div className="nav-btn-strip">
//           {subItems.map((item) => (
//             <Link key={item.label} href={item.path} prefetch={false} style={{ textDecoration: 'none' }}>
//               <span className={`nav-btn-pill ${isActiveRoute(item.path) ? 'active' : ''}`}>
//                 <i className={`ti ${item.icon}`} aria-hidden="true" />
//                 {item.label}
//               </span>
//             </Link>
//           ))}
//         </div>
//       </div>
//     </Box>
//   );
// };

// export default MenuPage;