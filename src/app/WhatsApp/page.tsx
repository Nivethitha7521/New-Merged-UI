'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

const WhatsappPage = () => {
 
  const router = useRouter();

useEffect(() => {
    router.replace('/WhatsApp/WhatsappAdmin');
  }, [router]);

return null;
};

export default WhatsappPage;























// "use client";
// import Link from 'next/link';
// import { usePathname, useRouter } from 'next/navigation';
// import { useCallback } from 'react';
// import React from 'react';
// import Navbar from '../Components/NavBar';
// import SideMenu from '../Components/SideMenu';

// const subItems = [
//   { label: 'WhatsApp Admin',  icon: 'ti-shield',   path: '/WhatsApp/WhatsappAdmin' },
//   { label: 'WhatsApp Master', icon: 'ti-brand-whatsapp', path: '/WhatsApp/WhatsappMaster' },
// ];

// const WhatsappPage = () => {
//   const pathname = usePathname();
//   const router = useRouter();

//   const handleLogout = () => router.push('/');

//   React.useEffect(() => {
//     if (pathname === '/WhatsApp' || pathname === '/WhatsApp/') {
//       router.replace('/WhatsApp');
//     }
//   }, [pathname, router]);

//   const isActiveRoute = (itemPath: string) => (pathname || '').startsWith(itemPath);

//   const handleMenuClick = useCallback((menuItem: { path: string }) => {
//     router.push(menuItem.path);
//   }, [router]);

//   return (
//     <div>
//       <Navbar moduleName="WHATSAPP MASTER" onLogout={handleLogout} />
//       <SideMenu onMenuClick={handleMenuClick} activePath={pathname || '/'} />

//       <p className="nav-section-label">WhatsApp</p>
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

// export default WhatsappPage;