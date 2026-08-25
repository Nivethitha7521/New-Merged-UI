  // "use client";

  // /**
  //  * storestockvarience/ui/approvedStocktable.tsx — rewritten with pure Tailwind CSS.
  //  * Replaces 779-line MUI version.
  //  */

  // import React, { useCallback, useEffect, useMemo, useRef } from "react";
  // import { useDispatch, useSelector } from "react-redux";
  // import { AppDispatch, RootState } from "@/redux/store";
  // import { fetchApprovedItems, resetApprovedItems, setSnackbarMessage, setOpenSnackbar, ApprovedStockItem } from "@/features/yen_inventory/wharehoueStoreSlice";
  // import DotLoaderLike from "@/components/Loaders/DotLoaderWrapper";
  // import { Tooltip } from "@/components/ui/Tooltip";
  // import { Spinner } from "@/components/ui/Spinner";
  // import { cn } from "@/lib/utils";

  // interface ApprovedStockTableProps {
  //   isFullScreen?: boolean;
  //   scrollContainerRef: React.RefObject<HTMLDivElement>;
  // }

  // const HEADERS = [
  //   { key: "serialNumber",          label: "S.No",             type: "center", width: "w-[5%]" },
  //   { key: "itemName",              label: "Item Name",         type: "text",   width: "min-w-[180px] w-auto" },
  //   { key: "locationName",          label: "Location ID",       type: "text",   width: "min-w-[120px] w-auto" },
  //   { key: "date",                  label: "Approved At",       type: "text",   width: "min-w-[150px] w-auto" },
  //   { key: "approvedBy",            label: "Approved By",       type: "text",   width: "min-w-[120px] w-auto" },
  //   { key: "currentSystem",         label: "System Before",     type: "number", width: "min-w-[100px] w-auto" },
  //   { key: "physicalClosing",       label: "Physical Closing",  type: "number", width: "min-w-[120px] w-auto" },
  //   { key: "actualVariance",        label: "Actual Variance",   type: "number", width: "min-w-[120px] w-auto" },
  //   { key: "updatedCurrentSystem",  label: "System After",      type: "number", width: "min-w-[100px] w-auto" },
  //   { key: "description",           label: "Description",       type: "text",   width: "min-w-[150px] w-auto" },
  // ];

  // const formatText = (value: unknown) => (value === undefined || value === null || value === "" ? "-" : String(value));
  // const formatNumber = (value: unknown) => {
  //   if (value === undefined || value === null || value === "") return "-";
  //   const n = Number(value);
  //   if (!Number.isFinite(n)) return String(value);
  //   return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
  // };

  // const ITEMS_PER_PAGE = 30;

  // const ApprovedStockTable: React.FC<ApprovedStockTableProps> = ({ isFullScreen = false, scrollContainerRef }) => {
  //   const dispatch = useDispatch<AppDispatch>();
  //   const { approvedItems, approvedItemsTotal, approvedItemsStatus, approvedItemsError, isLoadingMore } = useSelector((state: RootState) => state.purchaseItems);
  //   const isFetchingRef = useRef(false);

  //   const loadApprovedItems = useCallback(async (page: number) => {
  //     if (isFetchingRef.current) return;
  //     isFetchingRef.current = true;
  //     try {
  //       await dispatch(fetchApprovedItems({ page, limit: ITEMS_PER_PAGE })).unwrap();
  //     } catch (err) {
  //       console.error("Error fetching approved items:", err);
  //       dispatch(setSnackbarMessage("Error fetching approved items."));
  //       dispatch(setOpenSnackbar(true));
  //     } finally {
  //       isFetchingRef.current = false;
  //     }
  //   }, [dispatch]);

  //   useEffect(() => {
  //     dispatch(resetApprovedItems());
  //     loadApprovedItems(1);
  //   }, [dispatch, loadApprovedItems]);

  //   const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
  //     const target = event.currentTarget;
  //     const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 160;
  //     if (isNearBottom && approvedItemsStatus !== "loading" && !isLoadingMore && approvedItems.length < approvedItemsTotal && !isFetchingRef.current) {
  //       loadApprovedItems(Math.ceil(approvedItems.length / ITEMS_PER_PAGE) + 1);
  //     }
  //   }, [approvedItemsStatus, isLoadingMore, approvedItems.length, approvedItemsTotal, loadApprovedItems]);

  //   type DisplayedApprovedItem = ApprovedStockItem & {
  //     serialNumber: number;
  //     locationName: string;
  //     date: string;
  //     currentSystem: number;
  //     updatedCurrentSystem: number;
  //   };

  //   const displayedItems = useMemo<DisplayedApprovedItem[]>(() => {
  //     return approvedItems.map((item, index) => ({
  //       ...item, serialNumber: index + 1, locationName: item.locationId, date: item.approvedAt,
  //       currentSystem: item.systemStockBefore, updatedCurrentSystem: item.systemStockAfter,
  //     }));
  //   }, [approvedItems]);

  //   const isInitialLoading = approvedItemsStatus === "loading" && approvedItems.length === 0;

  //   const renderCell = (item: DisplayedApprovedItem, header: typeof HEADERS[number]) => {
  //     const val = (item as unknown as Record<string, unknown>)[header.key];
  //     if (header.key === "serialNumber") {
  //       return <div className="text-[12px] font-extrabold text-text-muted text-center">{formatText(val)}</div>;
  //     }
  //     if (header.type === "number") {
  //       const num = Number(val);
  //       const isNegative = Number.isFinite(num) && num < 0;
  //       const isVariance = header.key === "actualVariance";
  //       const color = isVariance ? (isNegative ? "text-danger-600" : "text-success-700") : "text-text-primary";
  //       return (
  //         <Tooltip content={formatNumber(val)} side="top">
  //           <div className={cn("text-[12px] font-extrabold tabular-nums text-right truncate", color)}>
  //             {formatNumber(val)}
  //           </div>
  //         </Tooltip>
  //       );
  //     }
  //     const strong = header.key === "itemName" || header.key === "locationName";
  //     return (
  //       <Tooltip content={formatText(val)} side="top">
  //         <div className={cn("text-[12px] truncate text-left", strong ? "font-extrabold text-text-primary" : "font-semibold text-text-secondary")}>
  //           {formatText(val)}
  //         </div>
  //       </Tooltip>
  //     );
  //   };

  //   return (
  //     <div className={cn("w-full h-full min-h-0 flex flex-col bg-white border border-border rounded-xl overflow-hidden", isFullScreen ? "shadow-2xl" : "shadow-sm")}>
        

  //       {/* Table Container */}
  //       <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 w-full overflow-auto bg-white" style={{ scrollbarWidth: "thin" }}>
  //         <table className="w-full border-separate border-spacing-0" style={{ tableLayout: "auto" }}>
  //           <thead className="sticky top-0 z-10">
  //             <tr>
  //               {HEADERS.map((header) => (
  //                 <th key={header.key} className={cn("px-2 py-2 text-[11px] font-extrabold uppercase tracking-wider text-text-primary bg-surface-muted border-b border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-md whitespace-nowrap", header.width)}>
  //                   <div className={cn("truncate w-full", header.type === "number" ? "text-right" : header.type === "center" ? "text-center" : "text-left")}>
  //                     {header.label}
  //                   </div>
  //                 </th>
  //               ))}
  //             </tr>
  //           </thead>
  //           <tbody>
  //             {isInitialLoading && (
  //               <tr>
  //                 <td colSpan={HEADERS.length} className="py-20 text-center">
  //                   <DotLoaderLike message="" />
  //                 </td>
  //               </tr>
  //             )}
              
  //             {approvedItemsError && (
  //               <tr>
  //                 <td colSpan={HEADERS.length} className="py-20 text-center text-danger-600 font-bold">
  //                   Error loading records: {approvedItemsError}
  //                 </td>
  //               </tr>
  //             )}

  //             {!isInitialLoading && approvedItemsStatus !== "loading" && approvedItems.length === 0 && !approvedItemsError && (
  //               <tr>
  //                 <td colSpan={HEADERS.length} className="py-20 text-center">
  //                   <div className="flex flex-col items-center gap-2 text-text-muted">
  //                     <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600">
  //                       <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
  //                     </div>
  //                     <p className="text-[14px] font-bold text-text-primary">No approved items found</p>
  //                     <p className="text-[12px] font-semibold">Approved warehouse records will appear here.</p>
  //                   </div>
  //                 </td>
  //               </tr>
  //             )}

  //             {displayedItems.map((item, index) => (
  //               <tr key={item.id || item.randomId || `approved-row-${index}`} className="border-b border-surface-subtle hover:bg-brand-50/40 transition-colors bg-white">
  //                 {HEADERS.map((header) => (
  //                   <td key={header.key} className={cn("px-2 py-1.5 border-b border-surface-subtle text-[12px]")}>
  //                     {renderCell(item, header)}
  //                   </td>
  //                 ))}
  //               </tr>
  //             ))}

  //             {isLoadingMore && (
  //               <tr>
  //                 <td colSpan={HEADERS.length} className="py-3 bg-white text-center">
  //                   <div className="flex items-center justify-center gap-2 text-text-muted">
  //                     <Spinner size="sm" />
  //                     <span className="text-[12px] font-bold">Loading more records...</span>
  //                   </div>
  //                 </td>
  //               </tr>
  //             )}
  //           </tbody>
  //         </table>
  //       </div>

  //       {/* Footer */}
  //       <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-surface-muted backdrop-blur-md shrink-0">
  //         <span className="text-[11px] font-extrabold text-text-secondary">Showing {approvedItems.length} of {approvedItemsTotal} items</span>
  //         <span className="text-[10px] font-bold text-text-muted">
  //           {approvedItems.length < approvedItemsTotal ? "Scroll down to load more records" : approvedItems.length > 0 ? "All approved records loaded" : "No records loaded"}
  //         </span>
  //       </div>

  //     </div>
  //   );
  // };

  // export default React.memo(ApprovedStockTable);
  // replace the entire part 5 8 1
//   "use client";

//   /**
//    * storestockvarience/ui/approvedStocktable.tsx — rewritten with pure Tailwind CSS.
//    * Replaces 779-line MUI version.
//    */

//   import React, { useCallback, useEffect, useMemo, useRef } from "react";
//   import { useDispatch, useSelector } from "react-redux";
//   import { AppDispatch, RootState } from "@/redux/store";
//   import { fetchApprovedItems, resetApprovedItems, setSnackbarMessage, setOpenSnackbar, ApprovedStockItem } from "@/features/yen_inventory/wharehoueStoreSlice";
//   import DotLoaderLike from "@/components/Loaders/DotLoaderWrapper";
//   import { Tooltip } from "@/components/ui/Tooltip";
//   import { Spinner } from "@/components/ui/Spinner";
//   import { cn } from "@/lib/utils";
//   // Imported the shared table config to match the exact same heading style as dataTable.tsx
//   import { TH_BASE_CLS } from "@/components/Inventory/shared/tableConfig";

//   interface ApprovedStockTableProps {
//     isFullScreen?: boolean;
//     scrollContainerRef: React.RefObject<HTMLDivElement>;
//   }

//   const HEADERS = [
//     { key: "serialNumber",          label: "S.No",             type: "center", width: "w-[5%]" },
//     { key: "itemName",              label: "Item Name",         type: "text",   width: "min-w-[180px] w-auto" },
//     { key: "locationName",          label: "Location ID",       type: "text",   width: "min-w-[120px] w-auto" },
//     { key: "date",                  label: "Approved At",       type: "text",   width: "min-w-[150px] w-auto" },
//     { key: "approvedBy",            label: "Approved By",       type: "text",   width: "min-w-[120px] w-auto" },
//     { key: "currentSystem",         label: "System Before",     type: "number", width: "min-w-[100px] w-auto" },
//     { key: "physicalClosing",       label: "Physical Closing",  type: "number", width: "min-w-[120px] w-auto" },
//     { key: "actualVariance",        label: "Actual Variance",   type: "number", width: "min-w-[120px] w-auto" },
//     { key: "updatedCurrentSystem",  label: "System After",      type: "number", width: "min-w-[100px] w-auto" },
//     { key: "description",           label: "Description",       type: "text",   width: "min-w-[150px] w-auto" },
//   ];

//   const formatText = (value: unknown) => (value === undefined || value === null || value === "" ? "-" : String(value));
//   const formatNumber = (value: unknown) => {
//     if (value === undefined || value === null || value === "") return "-";
//     const n = Number(value);
//     if (!Number.isFinite(n)) return String(value);
//     return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
//   };

//   const ITEMS_PER_PAGE = 30;

//   const ApprovedStockTable: React.FC<ApprovedStockTableProps> = ({ isFullScreen = false, scrollContainerRef }) => {
//     const dispatch = useDispatch<AppDispatch>();
//     const { approvedItems, approvedItemsTotal, approvedItemsStatus, approvedItemsError, isLoadingMore } = useSelector((state: RootState) => state.purchaseItems);
//     const isFetchingRef = useRef(false);

//     const loadApprovedItems = useCallback(async (page: number) => {
//       if (isFetchingRef.current) return;
//       isFetchingRef.current = true;
//       try {
//         await dispatch(fetchApprovedItems({ page, limit: ITEMS_PER_PAGE })).unwrap();
//       } catch (err) {
//         console.error("Error fetching approved items:", err);
//         dispatch(setSnackbarMessage("Error fetching approved items."));
//         dispatch(setOpenSnackbar(true));
//       } finally {
//         isFetchingRef.current = false;
//       }
//     }, [dispatch]);

//     useEffect(() => {
//       dispatch(resetApprovedItems());
//       loadApprovedItems(1);
//     }, [dispatch, loadApprovedItems]);
    
//     const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
//       const target = event.currentTarget;
//         console.log("scrollHeight =", target.scrollHeight);
//   console.log("clientHeight =", target.clientHeight);
//   console.log("scrollTop =", target.scrollTop);
//   console.log("approvedItems.length =", approvedItems.length);
//   console.log("approvedItemsTotal =", approvedItemsTotal);
//       // const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight <= 160;
//       // replace the part 11 8 1
//       if (target.scrollHeight <= target.clientHeight) {
//   return;
// }

// const isNearBottom =
//   target.scrollHeight -
//   target.scrollTop -
//   target.clientHeight <= 160;
//   console.log("PAGE CALL", {
//   loaded: approvedItems.length,
//   total: approvedItemsTotal,
//   nextPage: Math.ceil(approvedItems.length / ITEMS_PER_PAGE) + 1,
//   fetching: isFetchingRef.current,
// });
//       if (isNearBottom && approvedItemsStatus !== "loading" && !isLoadingMore && approvedItems.length < approvedItemsTotal && !isFetchingRef.current) {
//         loadApprovedItems(Math.ceil(approvedItems.length / ITEMS_PER_PAGE) + 1);
//       }
//     }, [approvedItemsStatus, isLoadingMore, approvedItems.length, approvedItemsTotal, loadApprovedItems]);

//     type DisplayedApprovedItem = ApprovedStockItem & {
//       serialNumber: number;
//       locationName: string;
//       date: string;
//       currentSystem: number;
//       updatedCurrentSystem: number;
//     };

//     const displayedItems = useMemo<DisplayedApprovedItem[]>(() => {
//       return approvedItems.map((item, index) => ({
//         ...item, serialNumber: index + 1, locationName: item.locationId, date: item.approvedAt,
//         currentSystem: item.systemStockBefore, updatedCurrentSystem: item.systemStockAfter,
//       }));
//     }, [approvedItems]);

//     const isInitialLoading = approvedItemsStatus === "loading" && approvedItems.length === 0;
//     console.log("TOTAL =", approvedItemsTotal);
//     console.log("LOADED =", approvedItems.length);
//     console.log("STATUS =", approvedItemsStatus);
//     console.log("LOADING_MORE =", isLoadingMore);
//     const renderCell = (item: DisplayedApprovedItem, header: typeof HEADERS[number]) => {
//       const val = (item as unknown as Record<string, unknown>)[header.key];
//       if (header.key === "serialNumber") {
//         return <div className="text-[12px] font-extrabold text-text-muted text-center">{formatText(val)}</div>;
//       }
//       if (header.type === "number") {
//         const num = Number(val);
//         const isNegative = Number.isFinite(num) && num < 0;
//         const isVariance = header.key === "actualVariance";
//         const color = isVariance ? (isNegative ? "text-danger-600" : "text-success-700") : "text-text-primary";
//         return (
//           <Tooltip content={formatNumber(val)} side="top">
//             <div className={cn("text-[12px] font-extrabold tabular-nums text-right truncate", color)}>
//               {formatNumber(val)}
//             </div>
//           </Tooltip>
//         );
//       }
//       const strong = header.key === "itemName" || header.key === "locationName";
//       return (
//         <Tooltip content={formatText(val)} side="top">
//           <div className={cn("text-[12px] truncate text-left", strong ? "font-extrabold text-text-primary" : "font-semibold text-text-secondary")}>
//             {formatText(val)}
//           </div>
//         </Tooltip>
//       );
//     };

//     return (
//       <div className={cn("w-full h-full min-h-0 flex flex-col bg-white border border-border rounded-xl overflow-hidden", isFullScreen ? "shadow-2xl" : "shadow-sm")}>
        
//         {/* Table Container */}
//         <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 w-full overflow-auto bg-white" style={{ scrollbarWidth: "thin" }}>
//           <table className="w-full border-separate border-spacing-0" style={{ tableLayout: "auto" }}>
//             <thead className="sticky top-0 z-10">
//               <tr>
//                 {HEADERS.map((header) => (
//                   <th 
//                     key={header.key} 
//                     className={cn(
//                       TH_BASE_CLS,
//                       "whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_0_rgba(226,232,240,0.28)]",
//                       header.type === "number" ? "text-right" : header.type === "center" ? "text-center" : "text-left",
//                       header.width
//                     )}
//                   >
//                     <div className="truncate w-full" title={header.label}>
//                       {header.label}
//                     </div>
//                   </th>
//                 ))}
//               </tr>
//             </thead>
//             <tbody>
//               {isInitialLoading && (
//                 <tr>
//                   <td colSpan={HEADERS.length} className="py-20 text-center">
//                     <DotLoaderLike message="" />
//                   </td>
//                 </tr>
//               )}
              
//               {approvedItemsError && (
//                 <tr>
//                   <td colSpan={HEADERS.length} className="py-20 text-center text-danger-600 font-bold">
//                     Error loading records: {approvedItemsError}
//                   </td>
//                 </tr>
//               )}

//               {!isInitialLoading && approvedItemsStatus !== "loading" && approvedItems.length === 0 && !approvedItemsError && (
//                 <tr>
//                   <td colSpan={HEADERS.length} className="py-20 text-center">
//                     <div className="flex flex-col items-center gap-2 text-text-muted">
//                       <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600">
//                         <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
//                       </div>
//                       <p className="text-[14px] font-bold text-text-primary">No approved items found</p>
//                       <p className="text-[12px] font-semibold">Approved warehouse records will appear here.</p>
//                     </div>
//                   </td>
//                 </tr>
//               )}

//               {displayedItems.map((item, index) => (
//                 <tr key={item.id || item.randomId || `approved-row-${index}`} className="border-b border-surface-subtle hover:bg-brand-50/40 transition-colors bg-white">
//                   {HEADERS.map((header) => (
//                     <td key={header.key} className={cn("px-2 py-1.5 border-b border-surface-subtle text-[12px]")}>
//                       {renderCell(item, header)}
//                     </td>
//                   ))}
//                 </tr>
//               ))}

//               {isLoadingMore && (
//                 <tr>
//                   <td colSpan={HEADERS.length} className="py-3 bg-white text-center">
//                     <div className="flex items-center justify-center gap-2 text-text-muted">
//                       <Spinner size="sm" />
//                       <span className="text-[12px] font-bold">Loading more records...</span>
//                     </div>
//                   </td>
//                 </tr>
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* Footer */}
//         <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-surface-muted backdrop-blur-md shrink-0">
//           <span className="text-[11px] font-extrabold text-text-secondary">Showing {approvedItems.length} of {approvedItemsTotal} items</span>
//           <span className="text-[10px] font-bold text-text-muted">
//             {approvedItems.length < approvedItemsTotal ? "Scroll down to load more records" : approvedItems.length > 0 ? "All approved records loaded" : "No records loaded"}
//           </span>
//         </div>

//       </div>
//     );
//   };

//   export default React.memo(ApprovedStockTable);
// replace the part 11 8 1
"use client";

/**
 * storestockvarience/ui/approvedStocktable.tsx
 * With status toggle (Approved / Pending) + filter + infinite-scroll fix.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import {
  fetchApprovedItems,
  resetApprovedItems,
  setSnackbarMessage,
  setOpenSnackbar,
  ApprovedStockItem,
} from "@/features/yen_inventory/wharehoueStoreSlice";
import DotLoaderLike from "@/components/Loaders/DotLoaderWrapper";
import { Tooltip } from "@/components/ui/Tooltip";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";
import { TH_BASE_CLS } from "@/components/Inventory/shared/tableConfig";

interface ApprovedStockTableProps {
  isFullScreen?: boolean;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

interface ActiveFilters {
  status: string;
  itemName: string;
  approvedBy: string;
  fromDate: string;
  toDate: string;
}

const DEFAULT_FILTERS: ActiveFilters = {
  status: "approved",
  itemName: "",
  approvedBy: "",
  fromDate: "",
  toDate: "",
};

const HEADERS = [
  { key: "serialNumber", label: "S.No", type: "center", width: "w-[5%]" },
  { key: "itemName", label: "Item Name", type: "text", width: "min-w-[180px] w-auto" },
  { key: "locationName", label: "Location ID", type: "text", width: "min-w-[120px] w-auto" },
  { key: "date", label: "Approved At", type: "text", width: "min-w-[150px] w-auto" },
  { key: "approvedBy", label: "Approved By", type: "text", width: "min-w-[120px] w-auto" },
  { key: "currentSystem", label: "System Before", type: "number", width: "min-w-[100px] w-auto" },
  { key: "physicalClosing", label: "Physical Closing", type: "number", width: "min-w-[120px] w-auto" },
  { key: "actualVariance", label: "Actual Variance", type: "number", width: "min-w-[120px] w-auto" },
  { key: "updatedCurrentSystem", label: "System After", type: "number", width: "min-w-[100px] w-auto" },
  { key: "description", label: "Description", type: "text", width: "min-w-[150px] w-auto" },
];

const formatText = (value: unknown) =>
  value === undefined || value === null || value === "" ? "-" : String(value);

const formatNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
};

const ITEMS_PER_PAGE = 30;

const INPUT_CLS =
  "h-7 px-2 text-[11px] font-semibold rounded-md border border-border bg-white text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand-400 focus:border-brand-400 transition-colors";

const ApprovedStockTable: React.FC<ApprovedStockTableProps> = ({
  isFullScreen = false,
  scrollContainerRef,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    approvedItems,
    approvedItemsTotal,
    approvedItemsStatus,
    approvedItemsError,
    isLoadingMore,
  } = useSelector((state: RootState) => state.rawMaterialStore);

  const isFetchingRef = useRef(false);

  // ── Filter state ──
  const [filterItemName, setFilterItemName] = useState("");
  const [filterApprovedBy, setFilterApprovedBy] = useState("");
  const [filterFromDate, setFilterFromDate] = useState("");
  const [filterToDate, setFilterToDate] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>(DEFAULT_FILTERS);
  const [filtersVisible, setFiltersVisible] = useState(true);

  const activeFiltersRef = useRef<ActiveFilters>(activeFilters);
  activeFiltersRef.current = activeFilters;

  // ── Load function ──
  const loadApprovedItems = useCallback(
    async (page: number) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      try {
        const f = activeFiltersRef.current;
        await dispatch(
          fetchApprovedItems({
            page,
            limit: ITEMS_PER_PAGE,
            status: f.status || undefined,
            itemName: f.itemName || undefined,
            approvedBy: f.approvedBy || undefined,
            fromDate: f.fromDate || undefined,
            toDate: f.toDate || undefined,
          })
        ).unwrap();
      } catch (err) {
        console.error("Error fetching approved items:", err);
        dispatch(setSnackbarMessage("Error fetching approved items."));
        dispatch(setOpenSnackbar(true));
      } finally {
        isFetchingRef.current = false;
      }
    },
    [dispatch]
  );

  // ── Reload when filters change ──
  useEffect(() => {
    dispatch(resetApprovedItems());
    const timer = setTimeout(() => {
      loadApprovedItems(1);
    }, 0);
    return () => clearTimeout(timer);
  }, [dispatch, loadApprovedItems, activeFilters]);

  // ── Scroll handler ──
  const handleScroll = useCallback(
    (event: React.UIEvent<HTMLDivElement>) => {
      const target = event.currentTarget;
      if (target.scrollHeight <= target.clientHeight) return;

      const isNearBottom =
        target.scrollHeight - target.scrollTop - target.clientHeight <= 160;

      if (
        isNearBottom &&
        approvedItemsStatus !== "loading" &&
        !isLoadingMore &&
        approvedItems.length < approvedItemsTotal &&
        !isFetchingRef.current
      ) {
        loadApprovedItems(Math.ceil(approvedItems.length / ITEMS_PER_PAGE) + 1);
      }
    },
    [approvedItemsStatus, isLoadingMore, approvedItems.length, approvedItemsTotal, loadApprovedItems]
  );

  // ── Auto-load when content doesn't overflow ──
  const autoLoadTriggerRef = useRef(0);

  useEffect(() => {
    if (approvedItemsStatus === "loading" && approvedItems.length === 0) return;
    if (approvedItems.length === 0) return;

    const el = scrollContainerRef.current;
    if (!el) return;

    const hasMore = approvedItems.length < approvedItemsTotal;
    const notLoading =
      approvedItemsStatus !== "loading" && !isLoadingMore && !isFetchingRef.current;
    const noOverflow = el.scrollHeight - el.clientHeight <= 2;

    if (noOverflow && hasMore && notLoading) {
      const nextPage = Math.ceil(approvedItems.length / ITEMS_PER_PAGE) + 1;
      if (nextPage !== autoLoadTriggerRef.current) {
        autoLoadTriggerRef.current = nextPage;
        loadApprovedItems(nextPage);
      }
    }
  }, [approvedItems.length, approvedItemsTotal, approvedItemsStatus, isLoadingMore, loadApprovedItems, scrollContainerRef]);

  // ── Status toggle handler ──
  const handleStatusToggle = useCallback((newStatus: string) => {
    setActiveFilters((prev) => ({ ...prev, status: newStatus }));
    autoLoadTriggerRef.current = 0;
  }, []);

  // ── Apply / Clear filters ──
  const hasActiveFilters = useMemo(() => {
    return (
      activeFilters.status !== "approved" ||
      activeFilters.itemName !== "" ||
      activeFilters.approvedBy !== "" ||
      activeFilters.fromDate !== "" ||
      activeFilters.toDate !== ""
    );
  }, [activeFilters]);

  const applyFilters = useCallback(() => {
    setActiveFilters((prev) => ({
      ...prev,
      itemName: filterItemName.trim(),
      approvedBy: filterApprovedBy.trim(),
      fromDate: filterFromDate,
      toDate: filterToDate,
    }));
    autoLoadTriggerRef.current = 0;
  }, [filterItemName, filterApprovedBy, filterFromDate, filterToDate]);

  const clearFilters = useCallback(() => {
    setFilterItemName("");
    setFilterApprovedBy("");
    setFilterFromDate("");
    setFilterToDate("");
    setActiveFilters(DEFAULT_FILTERS);
    autoLoadTriggerRef.current = 0;
  }, []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeFilters.status !== "approved") count++;
    if (activeFilters.itemName) count++;
    if (activeFilters.approvedBy) count++;
    if (activeFilters.fromDate) count++;
    if (activeFilters.toDate) count++;
    return count;
  }, [activeFilters]);

  const isPending = activeFilters.status === "pendingapproval";

  // ── Displayed items ──
  type DisplayedApprovedItem = ApprovedStockItem & {
    serialNumber: number;
    locationName: string;
    date: string;
    currentSystem: number;
    updatedCurrentSystem: number;
  };

  const displayedItems = useMemo<DisplayedApprovedItem[]>(() => {
    return approvedItems.map((item, index) => ({
      ...item,
      serialNumber: index + 1,
      locationName: item.locationId,
      date: item.approvedAt,
      currentSystem: item.systemStockBefore,
      updatedCurrentSystem: item.systemStockAfter,
    }));
  }, [approvedItems]);

  const isInitialLoading = approvedItemsStatus === "loading" && approvedItems.length === 0;

  // ── Cell renderer ──
  const renderCell = (item: DisplayedApprovedItem, header: (typeof HEADERS)[number]) => {
    const val = (item as unknown as Record<string, unknown>)[header.key];
    if (header.key === "serialNumber") {
      return (
        <div className="text-[12px] font-extrabold text-text-muted text-center">
          {formatText(val)}
        </div>
      );
    }
    if (header.type === "number") {
      const num = Number(val);
      const isNegative = Number.isFinite(num) && num < 0;
      const isVariance = header.key === "actualVariance";
      const color = isVariance
        ? isNegative ? "text-danger-600" : "text-success-700"
        : "text-text-primary";
      return (
        <Tooltip content={formatNumber(val)} side="top">
          <div className={cn("text-[12px] font-extrabold tabular-nums text-right truncate", color)}>
            {formatNumber(val)}
          </div>
        </Tooltip>
      );
    }
    const strong = header.key === "itemName" || header.key === "locationName";
    return (
      <Tooltip content={formatText(val)} side="top">
        <div className={cn("text-[12px] truncate text-left", strong ? "font-extrabold text-text-primary" : "font-semibold text-text-secondary")}>
          {formatText(val)}
        </div>
      </Tooltip>
    );
  };

  return (
    <div className={cn("w-full h-full min-h-0 flex flex-col bg-white border border-border rounded-xl overflow-hidden", isFullScreen ? "shadow-2xl" : "shadow-sm")}>
      {/* ── Filter Bar ── */}
      <div className="shrink-0 border-b border-border bg-surface-muted">
        {/* Top row: Status toggle + filter toggle */}
        <div className="flex items-center justify-between px-3 py-1.5">
          <div className="flex items-center gap-2">
            {/* Status Toggle */}
            <div className="flex items-center rounded-lg border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => handleStatusToggle("approved")}
                className={cn(
                  "px-3 h-6 text-[10px] font-extrabold transition-colors",
                  !isPending
                    ? "bg-emerald-600 text-white"
                    : "bg-white text-text-secondary hover:bg-surface-muted"
                )}
              >
                Approved
              </button>
              <button
                type="button"
                onClick={() => handleStatusToggle("pendingapproval")}
                className={cn(
                  "px-3 h-6 text-[10px] font-extrabold transition-colors border-l border-border",
                  isPending
                    ? "bg-amber-500 text-white"
                    : "bg-white text-text-secondary hover:bg-surface-muted"
                )}
              >
                Pending
              </button>
            </div>

            {/* Filter toggle */}
            <button
              type="button"
              onClick={() => setFiltersVisible((v) => !v)}
              className="flex items-center gap-1.5 text-[11px] font-extrabold text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-brand-600 text-white text-[9px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[10px] font-bold text-danger-600 hover:text-danger-700 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Filter inputs */}
        {filtersVisible && (
          <div className="flex items-end gap-2 px-3 pb-2 flex-wrap">
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold text-text-muted">Item Name</label>
              <input
                type="text"
                placeholder="Search item..."
                value={filterItemName}
                onChange={(e) => setFilterItemName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
                className={cn(INPUT_CLS, "w-[160px]")}
              />
            </div>

            {/* Approved By — only for approved status */}
            {!isPending && (
              <div className="flex flex-col gap-0.5">
                <label className="text-[10px] font-bold text-text-muted">Approved By</label>
                <input
                  type="text"
                  placeholder="Search name..."
                  value={filterApprovedBy}
                  onChange={(e) => setFilterApprovedBy(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") applyFilters(); }}
                  className={cn(INPUT_CLS, "w-[140px]")}
                />
              </div>
            )}

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold text-text-muted">From</label>
              <input
                type="date"
                value={filterFromDate}
                onChange={(e) => setFilterFromDate(e.target.value)}
                className={cn(INPUT_CLS, "w-[130px]")}
              />
            </div>

            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-bold text-text-muted">To</label>
              <input
                type="date"
                value={filterToDate}
                onChange={(e) => setFilterToDate(e.target.value)}
                className={cn(INPUT_CLS, "w-[130px]")}
              />
            </div>

            <button
              type="button"
              onClick={applyFilters}
              className="h-7 px-3 text-[11px] font-extrabold rounded-md bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-800 transition-colors shrink-0"
            >
              Apply
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="h-7 px-3 text-[11px] font-extrabold rounded-md border border-border text-text-secondary hover:text-danger-600 hover:border-danger-300 transition-colors shrink-0"
              >
                Reset
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Table Container ── */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 w-full overflow-auto bg-white" style={{ scrollbarWidth: "thin" }}>
        <table className="w-full border-separate border-spacing-0" style={{ tableLayout: "auto" }}>
          <thead className="sticky top-0 z-10">
            <tr>
              {HEADERS.map((header) => (
                <th
                  key={header.key}
                  className={cn(
                    TH_BASE_CLS,
                    "whitespace-nowrap shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_1px_0_rgba(226,232,240,0.28)]",
                    header.type === "number" ? "text-right" : header.type === "center" ? "text-center" : "text-left",
                    header.width
                  )}
                >
                  <div className="truncate w-full" title={header.label}>{header.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isInitialLoading && (
              <tr>
                <td colSpan={HEADERS.length} className="py-20 text-center">
                  <DotLoaderLike message="" />
                </td>
              </tr>
            )}

            {approvedItemsError && (
              <tr>
                <td colSpan={HEADERS.length} className="py-20 text-center text-danger-600 font-bold">
                  Error loading records: {approvedItemsError}
                </td>
              </tr>
            )}

            {!isInitialLoading && approvedItemsStatus !== "loading" && approvedItems.length === 0 && !approvedItemsError && (
              <tr>
                <td colSpan={HEADERS.length} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2 text-text-muted">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                        <line x1="12" y1="22.08" x2="12" y2="12" />
                      </svg>
                    </div>
                    <p className="text-[14px] font-bold text-text-primary">
                      {isPending ? "No pending items found" : "No approved items found"}
                    </p>
                    <p className="text-[12px] font-semibold">
                      {isPending ? "Items waiting for approval will appear here." : "Approved warehouse records will appear here."}
                    </p>
                  </div>
                </td>
              </tr>
            )}

            {displayedItems.map((item, index) => (
              <tr key={item.id || item.randomId || `approved-row-${index}`} className="border-b border-surface-subtle hover:bg-brand-50/40 transition-colors bg-white">
                {HEADERS.map((header) => (
                  <td key={header.key} className="px-2 py-1.5 border-b border-surface-subtle text-[12px]">
                    {renderCell(item, header)}
                  </td>
                ))}
              </tr>
            ))}

            {isLoadingMore && (
              <tr>
                <td colSpan={HEADERS.length} className="py-3 bg-white text-center">
                  <div className="flex items-center justify-center gap-2 text-text-muted">
                    <Spinner size="sm" />
                    <span className="text-[12px] font-bold">Loading more records...</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-surface-muted backdrop-blur-md shrink-0">
        <span className="text-[11px] font-extrabold text-text-secondary">
          Showing {approvedItems.length} of {approvedItemsTotal} {isPending ? "pending" : "approved"} items
        </span>
        <span className="text-[10px] font-bold text-text-muted">
          {approvedItems.length < approvedItemsTotal
            ? "Scroll down to load more records"
            : approvedItems.length > 0
              ? "All records loaded"
              : "No records loaded"}
        </span>
      </div>
    </div>
  );
};

export default React.memo(ApprovedStockTable);