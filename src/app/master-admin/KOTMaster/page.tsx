'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { Button, Box } from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
// import MasterAdminMenu from '../page';

const subItems = [

  { label: "AddOn", path: "/master-admin/KOTMaster/addOn" },
  { label: "Variant", path: "/master-admin/KOTMaster/variants" },
  { label: "KOT Table", path: "/master-admin/KOTMaster/TableMaster" },
];

const MenuPage = () => {
  const pathname = usePathname();
  const router = useRouter();


  // Redirect to Category by default when accessing the main Items path
  useEffect(() => {
    if (pathname === '/master-admin/KOTMaster' || pathname === '/master-admin/KOTMaster/') {
      router.replace('/master-admin/KOTMaster/addOn');
    }
  }, [pathname, router]);

  // Early return if redirecting — avoids rendering buttons
  if (pathname === '/master-admin/KOTMaster' || pathname === '/master-admin/KOTMaster/') {
    return (
      <Box>
        {/* <MasterAdminMenu /> */}
      </Box>
    );
  }

  // Function to determine if a route is active (matches or starts with the current pathname)
  const isActiveRoute = (itemPath: string) => (pathname || '').startsWith(itemPath);

  return (
    <Box>
      {/* <MasterAdminMenu /> */}
      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mb: 1, ml: 4.5, mt: 1 }}>
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
//   { label: 'AddOn',     icon: 'ti-circle-plus',  path: '/master-admin/KOTMaster/addOn' },
//   { label: 'Variant',   icon: 'ti-adjustments',  path: '/master-admin/KOTMaster/variants' },
//   { label: 'KOT Table', icon: 'ti-table',         path: '/master-admin/KOTMaster/TableMaster' },
// ];

// const MenuPage = () => {
//   const pathname = usePathname();
//   const router = useRouter();

//   useEffect(() => {
//     if (pathname === '/master-admin/KOTMaster' || pathname === '/master-admin/KOTMaster/') {
//       router.replace('/master-admin/KOTMaster/addOn');
//     }
//   }, [pathname, router]);

//   if (pathname === '/master-admin/KOTMaster' || pathname === '/master-admin/KOTMaster/') {
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