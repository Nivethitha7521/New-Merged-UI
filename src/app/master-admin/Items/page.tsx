

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button, Box } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import MasterAdminMenu from '../page';

const subItems = [
  { label: 'Item', path: '/master-admin/Items/Item' },
//  { label: 'SFG', path: '/master-admin/Items/SFG' },
  { label: 'Category', path: '/master-admin/Items/Category' },
  { label: 'Sub Category', path: '/master-admin/Items/Subcategory' },
  { label: 'Item Group', path: '/master-admin/Items/itemGroup' },
  { label: 'Inventory Type', path: '/master-admin/Items/InventoryType' },
  { label: 'Order Type', path: '/master-admin/Items/OrderType' },
 // { label: 'Measurement Type', path: '/master-admin/Items/MeasurementType' },
];

const ItemMasterPage = () => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/master-admin/Items' || pathname === '/master-admin/Items/') {
      router.replace('/master-admin/Items/Item');
    }
  }, [pathname, router]);

  if (pathname === '/master-admin/Items' || pathname === '/master-admin/Items/') {
    return (
      <Box>
        <MasterAdminMenu />
      </Box>
    );
  }

  const isActiveRoute = (itemPath: string) => pathname.startsWith(itemPath);

  return (
    <Box>
      <MasterAdminMenu />

      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3, ml: 4.5, mt: 1 }}>
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

export default ItemMasterPage;

















// 'use client';

// import React, { useEffect } from 'react';
// import Link from 'next/link';
// import { Box } from '@mui/material';
// import { usePathname, useRouter } from 'next/navigation';
// import MasterAdminMenu from '../page';

// const subItems = [
//   { label: 'Item',           icon: 'ti-package',       path: '/master-admin/Items/Item' },
//   { label: 'Category',       icon: 'ti-category',      path: '/master-admin/Items/Category' },
//   { label: 'Sub Category',   icon: 'ti-sitemap',       path: '/master-admin/Items/Subcategory' },
//   { label: 'Item Group',     icon: 'ti-layout-grid',   path: '/master-admin/Items/itemGroup' },
//   { label: 'Inventory Type', icon: 'ti-building-warehouse', path: '/master-admin/Items/InventoryType' },
//   { label: 'Order Type',     icon: 'ti-clipboard-list', path: '/master-admin/Items/OrderType' },
// ];

// const ItemMasterPage = () => {
//   const pathname = usePathname();
//   const router = useRouter();

//   useEffect(() => {
//     if (pathname === '/master-admin/Items' || pathname === '/master-admin/Items/') {
//       router.replace('/master-admin/Items/Item');
//     }
//   }, [pathname, router]);

//   if (pathname === '/master-admin/Items' || pathname === '/master-admin/Items/') {
//     return <Box><MasterAdminMenu /></Box>;
//   }

//   const isActiveRoute = (itemPath: string) => pathname.startsWith(itemPath);

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

// export default ItemMasterPage;