



"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useMemo, useCallback } from 'react';
import { Button } from '@mui/material';
import React from 'react';
// import SideMenu from '../Components/SideMenu';
import SideMenu from '@/components/SideMenu';


const MasterAdminPage = () => {
  const pathname = usePathname();
  const router = useRouter();

  const subItems = useMemo(
    () => [
      { label: 'Warehouse', path: '/master-admin/WarehouseMaster' },
      { label: 'Locations', path: '/master-admin/Locations' },
      { label: 'Item Master', path: '/master-admin/Items' },
      { label: 'UOM', path: '/master-admin/Uom' },
      { label: 'Tax', path: '/master-admin/Tax' },
      { label: 'Vehicle', path: '/master-admin/Vehicle' },
      { label: 'Discount', path: '/master-admin/Discount' },
      { label: 'Online Partners', path: '/master-admin/OnlinePartners' },
      { label: 'MixBox', path: '/master-admin/MixBox' },
      { label: 'KOT Master', path: '/master-admin/KOTMaster' },
      { label: 'Sale Order', path: '/master-admin/SaleOrder' },
      { label: 'section', path: '/master-admin/SectionMaster' },
    ],
    []
  );

  // Handle logout action
  const handleLogout = () => {
    router.push('/');
  };

  //const showSideMenu = true;

  React.useEffect(() => {
    if (pathname === '/master-admin' || pathname === '/master-admin/') {
      router.replace('/master-admin');
    }
  }, [pathname, router]);

  // Updated isActiveRoute function to handle Item Master sub-routes
  const isActiveRoute = (itemPath: string) => {
    const currentPath = pathname || '';
    
    
    return currentPath.startsWith(itemPath);
  };

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

      {/* <div className=" flex-wrap gap-2 ml-7.5 mt-2 "> */}
      <div className="ml-8 mt-6 flex flex-wrap gap-4" >
        {subItems.map((item) => {
          const isActive = isActiveRoute(item.path);

          return (
            <Link key={item.label} href={item.path} prefetch={false} >
              <Button
                variant={isActive ? 'contained' : 'outlined'}
                color="primary"
                size="small"
                sx={{
                  textTransform: 'none',
                  fontWeight: isActive ? 'bold' : 'normal',
                  fontSize: isActive ? '10px' : '10.5px',
                  borderRadius: '5px',
                  minWidth: '20px',
                  width: isActive ? '70px' : '80px',
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

export default MasterAdminPage;



// "use client";
// import Link from 'next/link';
// import { usePathname, useRouter } from 'next/navigation';
// import { useCallback } from 'react';
// import React from 'react';
// import Navbar from '../Components/NavBar';
// import SideMenu from '../Components/SideMenu';

// const subItems = [
//   { label: 'Warehouse',       icon: 'ti-building-warehouse', path: '/master-admin/WarehouseMaster' },
//   { label: 'Locations',       icon: 'ti-map-pin',            path: '/master-admin/Locations' },
//   { label: 'Item Master',     icon: 'ti-package',            path: '/master-admin/Items' },
//   { label: 'UOM',             icon: 'ti-ruler',              path: '/master-admin/Uom' },
//   { label: 'Tax',             icon: 'ti-receipt-tax',        path: '/master-admin/Tax' },
//   { label: 'Vehicle',         icon: 'ti-truck',              path: '/master-admin/Vehicle' },
//   { label: 'Discount',        icon: 'ti-tag',                path: '/master-admin/Discount' },
//   { label: 'Online Partners', icon: 'ti-world',              path: '/master-admin/OnlinePartners' },
//   { label: 'MixBox',         icon: 'ti-box-multiple',       path: '/master-admin/MixBox' },
//   { label: 'KOT Master',     icon: 'ti-chef-hat',           path: '/master-admin/KOTMaster' },
//   { label: 'Sale Order',     icon: 'ti-clipboard-list',     path: '/master-admin/SaleOrder' },
//   { label: 'Section',        icon: 'ti-layout-grid',        path: '/master-admin/SectionMaster' },
// ];

// const MasterAdminPage = () => {
//   const pathname = usePathname();
//   const router = useRouter();

//   const handleLogout = () => {
//     router.push('/');
//   };

//   React.useEffect(() => {
//     if (pathname === '/master-admin' || pathname === '/master-admin/') {
//       router.replace('/master-admin');
//     }
//   }, [pathname, router]);

//   const isActiveRoute = (itemPath: string) => {
//     return (pathname || '').startsWith(itemPath);
//   };

//   const handleMenuClick = useCallback((menuItem: { path: string }) => {
//     router.push(menuItem.path);
//   }, [router]);

// return (
//   <div>
//     <Navbar moduleName="MASTER - ADMIN" onLogout={handleLogout} />
//     <SideMenu onMenuClick={handleMenuClick} activePath={pathname || '/'} />

//     <p className="subnav-section-label"></p>

//     {/* wrapper handles the bottom border, strip handles scroll */}
//     <div className="nav-btn-strip-wrapper">
//       <div className="nav-btn-strip">
//         {subItems.map((item) => (
//           <Link key={item.label} href={item.path} prefetch={false}>
//             <span className={`nav-btn-pill ${isActiveRoute(item.path) ? 'active' : ''}`}>
//               <i className={`ti ${item.icon}`} aria-hidden="true" />
//               {item.label}
//             </span>
//           </Link>
//         ))}
//       </div>
//     </div>
//   </div>
// );
// };

// export default MasterAdminPage;