

"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useCallback } from 'react';
import { Button } from '@mui/material';
import React from 'react';
import Navbar from '../Components/NavBar';
// import SideMenu from '../Components/SideMenu';
import SideMenu from '@/components/SideMenu';

const YenPosPage = () => {
  const pathname = usePathname();
  const router = useRouter();

  const subItems = useMemo(
    () => [

      { label: 'Cash Management', path: '/yen-pos/CashManagement' },
      { label: 'POS Devices', path: '/yen-pos/POSDevicePage' },
      { label: 'Reasons', path: '/yen-pos/reasons' },  
      { label: 'Prefix Master', path: '/yen-pos/prefixMaster' },          
    ],
    []
  );


  // Handle logout action (optional, can be customized if needed)
  const handleLogout = () => {
    // Additional logout logic can be added here if needed
    router.push('/'); // Redirect to login page (already handled by LogoutDialog, but can be used for additional control)
  };


  const showSideMenu = true;

  React.useEffect(() => {
    if (pathname === '/yen-pos' || pathname === '/yen-pos/') {
     router.replace('/yen-pos/CashManagement/OpeningCash');
    }
  }, [pathname, router]);

  const isActiveRoute = (itemPath: string) => (pathname || '').startsWith(itemPath);

  const handleMenuClick = useCallback((menuItem: { path: string }) => {
    router.push(menuItem.path);
  }, [router]);

  return (
    <div>

      {/* Navbar at the top */}
     

      {/* SideMenu */}
    <SideMenu
  onMenuClick={handleMenuClick}
  activePath={pathname || '/'}
  showPurchaseMenu={true}
  showBookMenu={true}
  showInventoryMenu={true}
  showReportsMenu={true}
/>

      <div className="flex flex-wrap gap-2 ml-9 mt-2 items-center justify-start">
        {subItems.map((item) => {
          const isActive = isActiveRoute(item.path);

          // {
          //   showSideMenu && (
          //     <SideMenu onMenuClick={handleMenuClick} activePath={''} />
          //   )
          // }

          return (
            <Link key={item.label} href={item.path} className="no-underline" prefetch={false}>
              <Button
                variant={isActive ? 'contained' : 'outlined'}
                color="primary"
                size="medium"
                sx={{
                  textTransform: 'none',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontSize: isActive ? '10px' : '10.5px',
                  borderRadius: '5px',
                  minWidth: '20px',
                  width: isActive ? '80px' : '80px',
                  height: isActive ? '40px' : '40px',
                  transition: 'all 0.2s ease',
                  boxShadow: isActive ? '0px 0px 10px rgba(0, 0, 0, 0.1)' : 'none',
                  fontFamily: "'Poppins', sans-serif",
                }}
              >
                {item.label}
              </Button>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default YenPosPage;


















// "use client";
// import Link from 'next/link';
// import { usePathname, useRouter } from 'next/navigation';
// import { useCallback } from 'react';
// import React from 'react';
// import Navbar from '../Components/NavBar';
// import SideMenu from '../Components/SideMenu';

// const subItems = [
//   { label: 'Cash Management', icon: 'ti-cash',        path: '/yen-pos/CashManagement' },
//   { label: 'Prefix Master',   icon: 'ti-tag',         path: '/yen-pos/prefixMaster' },
//   { label: 'POS Devices',     icon: 'ti-device-desktop', path: '/yen-pos/POSDevicePage' },
// ];

// const YenPosPage = () => {
//   const pathname = usePathname();
//   const router = useRouter();

//   const handleLogout = () => router.push('/');

//   React.useEffect(() => {
//     if (pathname === '/yen-pos' || pathname === '/yen-pos/') {
//       router.replace('/yen-pos');
//     }
//   }, [pathname, router]);

//   const isActiveRoute = (itemPath: string) => (pathname || '').startsWith(itemPath);

//   const handleMenuClick = useCallback((menuItem: { path: string }) => {
//     router.push(menuItem.path);
//   }, [router]);

//   return (
//     <div>
//       <Navbar moduleName="YEN-POS" onLogout={handleLogout} />
//       <SideMenu onMenuClick={handleMenuClick} activePath={pathname || '/'} />

//       <p className="nav-section-label">Yen POS</p>
//       <div className="nav-btn-strip-wrapper">
//         <div className="nav-btn-strip">
//           {subItems.map((item) => (
//             <Link key={item.label} href={item.path} prefetch={false}>
//               <span className={`nav-btn-pill ${isActiveRoute(item.path) ? 'active' : ''}`}>
//                 <i className={`ti ${item.icon}`} aria-hidden="true" />
//                 {item.label}
//               </span>
//             </Link>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default YenPosPage;