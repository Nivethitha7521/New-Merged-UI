

// 'use client';

// import React, { useEffect, useState, useMemo } from 'react';
// import { Box, Typography } from '@mui/material';
// import { useDispatch, useSelector } from 'react-redux';
// import { AppDispatch } from '../../redux/store';
// import { fetchBusinesses, selectBusinesses, fetchPhoto } from '@/app/yen-recipie/RecipeManagement/Features/businessSlice';
// import './Navbar.css';
// import Image from 'next/image';
// import LogoutDialog from './logout';

// export interface NavbarProps {
//   moduleName: string;
//   onLogout: () => void;
// }

// const Navbar: React.FC<NavbarProps> = ({ moduleName }) => {
//   const dispatch = useDispatch<AppDispatch>();
//   const { businesses } = useSelector(selectBusinesses);

//   // Initialize fetchedBusinessIds from localStorage only once (stable reference)
//   const [fetchedBusinessIds, setFetchedBusinessIds] = useState<Set<string>>(() => {
//     if (typeof window === 'undefined') return new Set<string>();
//     const stored = localStorage.getItem('fetchedBusinessIds');
//     return stored ? new Set(JSON.parse(stored)) : new Set<string>();
//   });

//   // Memoize business IDs to prevent unnecessary dependency changes
//   const businessIds = useMemo(() => {
//     return businesses.map((business) => business.businessId);
//   }, [businesses]);

//   // Fetch businesses only once on mount
//   useEffect(() => {
//     dispatch(fetchBusinesses());
//   }, [dispatch]);

//   // Fetch photos only for NEW business IDs
//   useEffect(() => {
//     const newIds = businessIds.filter((id) => !fetchedBusinessIds.has(id));

//     if (newIds.length === 0) return;

//     // Dispatch photo fetch for each new business
//     newIds.forEach((id) => {
//       dispatch(fetchPhoto(id));
//     });

//     // Update state immutably
//     setFetchedBusinessIds((prev) => {
//       const next = new Set(prev);
//       newIds.forEach((id) => next.add(id));
//       return next;
//     });
//   }, [businessIds, fetchedBusinessIds, dispatch]);

//   // Persist fetchedBusinessIds to localStorage whenever it changes
//   useEffect(() => {
//     if (typeof window !== 'undefined') {
//       localStorage.setItem('fetchedBusinessIds', JSON.stringify(Array.from(fetchedBusinessIds)));
//     }
//   }, [fetchedBusinessIds]);

//   // Logout dialog
//   const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
//   const handleOpenLogoutDialog = () => {
//     setLogoutDialogOpen(true);
//   };

//   return (
//     <header className="navbar">
//       <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
//         {/* Logo at the start */}
//         <Box sx={{ flexShrink: 0 }}>
//           <Image
//             src="/images/blacklogo.png"
//             alt="YEN ERP Logo"
//             className="logo"
//             width={100}
//             height={40}
//             style={{ marginLeft: '20px' }}
//           />
//         </Box>

//         {/* Module Name centered */}
//         <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
//           <Typography
//             className={`module-name ${
//               moduleName === moduleName.toLowerCase() ? 'module-name-uppercase' : ''
//             }`}
//           >
//             {moduleName}
//           </Typography>
//         </Box>

//         {/* Business Logos + Logout */}
//         <Box sx={{ display: 'flex', alignItems: 'center', marginRight: '20px', gap: '12px' }}>
//           {businesses && businesses.length > 0 ? (
//             businesses.map((business) => (
//               <div className="navbar-logo" key={business.businessId}>
//                 {business.imageUrl ? (
//                   <Image
//                     src={business.imageUrl}
//                     alt={business.companyName}
//                     className="navbar-image"
//                     width={40}
//                     height={50}
//                     style={{ borderRadius: '5%', objectFit: 'cover' }}
//                   />
//                 ) : (
//                   <span className="no-logo">No Logo</span>
//                 )}
//               </div>
//             ))
//           ) : (
//             <div className="navbar-logo">
//               <span className="no-logo">No Businesses</span>
//             </div>
//           )}

//           <Box className="navbar-logout">
//             <button onClick={handleOpenLogoutDialog} className="text-white">
//               Logout
//             </button>
//           </Box>
//         </Box>
//       </Box>

//       {/* Logout Confirmation Dialog */}
//       <LogoutDialog open={logoutDialogOpen} setOpen={setLogoutDialogOpen} />
//     </header>
//   );
// };

// export default Navbar;