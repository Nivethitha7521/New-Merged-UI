"use client";

/**
 * physcialstockvarience/ui/stockAdjustmentTable.tsx — pure Tailwind CSS.
 * FIX: header/data alignment for System Before, Physical, Variance, System After.
 *      All columns (except S.No) are left-aligned on both <th> and <td>, so a
 *      header label's starting edge and its value's starting edge always match.
 *      Alignment lives on the <th>/<td> elements themselves via `alignClass()`,
 *      not on inner divs/spans inside Tooltip, so it doesn't depend on how
 *      Tooltip renders its children internally.
 * Also: fixed-width columns via <colgroup> for consistent layout, and improved
 * mobile responsiveness (min table width + smooth horizontal scroll).
 */

import { useCallback, useMemo, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { fetchApprovedItems, selectApprovedItems, selectApprovedItemsLoading, selectApprovedItemsError, selectApprovedItemsTotal, selectApprovedItemsPage, selectApprovedItemsLimit, selectApprovedItemsHasMore, selectApprovedItemsIsLoadingMore, resetApprovedItemsPagination, setOpenSnackbar, setSnackbarMessage, ApprovedItem } from "@/features/yen_inventory/OutletPhysicalVarianceSlice";
import DotLoaderLike from "@/components/Loaders/DotLoaderWrapper";
import { Tooltip } from "@/components/ui/Tooltip";
import { Spinner } from "@/components/ui/Spinner";
import { cn } from "@/lib/utils";

interface StockAdjustmentTableProps {
  isFullScreen?: boolean;
}

// Added `minWidth` so every column (esp. numeric ones) reserves enough space
// on small/mobile screens — this keeps header label and value inside the
// same box width, which is what actually keeps them aligned.
const HEADERS = [
  { key: "serialNumber",      label: "S.No",          type: "center", minWidth: 56  },
  { key: "itemCode",          label: "Item Code",      type: "text",   minWidth: 110 },
  { key: "itemName",          label: "Item Name",      type: "text",   minWidth: 140 },
  { key: "locationId",        label: "Location ID",    type: "text",   minWidth: 110 },
  { key: "approvedAt",        label: "Approved At",    type: "text",   minWidth: 150 },
  { key: "approvedBy",        label: "Approved By",    type: "text",   minWidth: 110 },
  { key: "systemStockBefore", label: "System Before",  type: "number", minWidth: 120 },
  { key: "physicalClosing",   label: "Physical",       type: "number", minWidth: 100 },
  { key: "actualVariance",    label: "Variance",       type: "number", minWidth: 100 },
  { key: "systemStockAfter",  label: "System After",   type: "number", minWidth: 120 },
  // { key: "description",       label: "Description",    type: "text",   minWidth: 140 },
  // replace the line 12 8 2
    { key: "description",       label: "Description",    type: "text",   minWidth: 260 },
] as const;

const formatValue = (value: unknown) => (value === undefined || value === null || value === "" ? "-" : String(value));
const formatNumber = (value: unknown) => {
  if (value === undefined || value === null || value === "") return "-";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(n);
};

export const StockAdjustmentTable: React.FC<StockAdjustmentTableProps> = ({ isFullScreen = false }) => {
  const dispatch = useDispatch<AppDispatch>();

  const approvedItems = useSelector(selectApprovedItems);
  const approvedItemsLoading = useSelector(selectApprovedItemsLoading);
  const approvedItemsError = useSelector(selectApprovedItemsError);
  const approvedItemsTotal = useSelector(selectApprovedItemsTotal);
  const approvedItemsPage = useSelector(selectApprovedItemsPage);
  const approvedItemsLimit = useSelector(selectApprovedItemsLimit);
  const approvedItemsHasMore = useSelector(selectApprovedItemsHasMore);
  const approvedItemsIsLoadingMore = useSelector(selectApprovedItemsIsLoadingMore);

  const isFetchingRef = useRef(false);

  const loadApprovedItems = useCallback(async (page: number, isLoadMore: boolean = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    try {
      if (!isLoadMore) dispatch(resetApprovedItemsPagination());
      await dispatch(fetchApprovedItems({ page, limit: approvedItemsLimit, isLoadMore })).unwrap();
    } catch (err) {
      console.error("Error fetching approved items:", err);
      dispatch(setSnackbarMessage("Error fetching approved items."));
      dispatch(setOpenSnackbar(true));
    } finally {
      isFetchingRef.current = false;
    }
  }, [dispatch, approvedItemsLimit]);

  useEffect(() => {
    loadApprovedItems(1, false);
  }, [loadApprovedItems]);

  const loadMoreApprovedItems = useCallback(async () => {
    if (approvedItemsIsLoadingMore || !approvedItemsHasMore || isFetchingRef.current) return;
    await loadApprovedItems(approvedItemsPage + 1, true);
  }, [approvedItemsIsLoadingMore, approvedItemsHasMore, approvedItemsPage, loadApprovedItems]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = event.currentTarget;
    if (scrollHeight - scrollTop - clientHeight <= 120 && !approvedItemsLoading && !approvedItemsIsLoadingMore && approvedItemsHasMore) {
      loadMoreApprovedItems();
    }
  }, [approvedItemsLoading, approvedItemsIsLoadingMore, approvedItemsHasMore, loadMoreApprovedItems]);

  type DisplayedApprovedItem = ApprovedItem & { serialNumber: number };

  const displayedItems = useMemo<DisplayedApprovedItem[]>(() => approvedItems.map((item, index) => ({ ...item, serialNumber: index + 1 })), [approvedItems]);
  const isInitialLoading = approvedItemsLoading && approvedItems.length === 0;

  const renderCell = (item: DisplayedApprovedItem, header: typeof HEADERS[number]) => {
    const val = item[header.key as keyof DisplayedApprovedItem];

    if (header.key === "serialNumber") {
      return <span className="text-[12px] font-extrabold text-text-muted">{val}</span>;
    }

    if (header.type === "number") {
      const num = Number(val);
      const isNegative = Number.isFinite(num) && num < 0;
      const isVariance = header.key === "actualVariance";
      const color = isVariance ? (isNegative ? "text-danger-600" : "text-success-700") : "text-text-primary";
      return (
        <Tooltip content={formatNumber(val)} side="top">
          <span className={cn("text-[12px] font-extrabold tabular-nums", color)}>
            {formatNumber(val)}
          </span>
        </Tooltip>
      );
    }

    const strong = header.key === "itemCode" || header.key === "itemName";
    return (
      <Tooltip content={formatValue(val)} side="top">
        <span className={cn("text-[12px]", strong ? "font-extrabold text-text-primary" : "font-semibold text-text-secondary")}>
          {formatValue(val)}
        </span>
      </Tooltip>
    );
  };

  // Left-aligned across the board (S.No stays centered) — header label's
  // start and the value's start now line up on the same left edge for
  // every column, including the numeric ones.
  const alignClass = (type: (typeof HEADERS)[number]["type"]) =>
    type === "center" ? "text-center" : "text-left";

  return (
    <div className={cn("w-full h-full min-h-0 flex flex-col bg-white border border-border rounded-xl overflow-hidden", isFullScreen ? "shadow-2xl" : "shadow-sm")}>

      {/* Table Container */}
      <div onScroll={handleScroll} className="flex-1 min-h-0 w-full overflow-auto bg-white overscroll-contain" style={{ scrollbarWidth: "thin", WebkitOverflowScrolling: "touch" }}>
        <table className="w-full min-w-[1100px] border-separate border-spacing-0" style={{ tableLayout: "fixed" }}>
          <colgroup>
            {HEADERS.map((header) => (
              <col key={header.key} style={{ width: `${header.minWidth}px` }} />
            ))}
          </colgroup>
          <thead className="sticky top-0 z-20">
            <tr>
              {HEADERS.map((header) => (
                <th
                  key={header.key}
                  className={cn(
                    "px-2 py-2 text-[11px] font-extrabold uppercase tracking-wider text-text-primary bg-surface-muted border-b border-border shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-md whitespace-nowrap truncate",
                    alignClass(header.type)
                  )}
                  style={{ width: `${header.minWidth}px` }}
                >
                  {header.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isInitialLoading && (
              <tr>
                <td colSpan={HEADERS.length} className="py-20 text-center">
                  <DotLoaderLike message="Loading approved stock data..." />
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

            {!approvedItemsLoading && approvedItems.length === 0 && !approvedItemsError && (
              <tr>
                <td colSpan={HEADERS.length} className="py-20 text-center">
                  <div className="flex flex-col items-center gap-2 text-text-muted">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-brand-50 text-brand-600">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
                    </div>
                    <p className="text-[14px] font-bold text-text-primary">No adjustment records found</p>
                    <p className="text-[12px] font-semibold">Approved records will appear here after stock approval.</p>
                  </div>
                </td>
              </tr>
            )}

            {displayedItems.map((item) => (
              <tr key={item._id || `${item.itemCode}-${item.serialNumber}`} className="border-b border-surface-subtle hover:bg-brand-50/40 transition-colors bg-white">
                {HEADERS.map((header) => (
                  <td
                    key={header.key}
                    className={cn(
                      "px-2 py-1.5 border-b border-surface-subtle text-[12px] overflow-hidden whitespace-nowrap truncate",
                      alignClass(header.type),
                      header.key === "itemCode" && "border-l border-surface-subtle"
                    )}
                    style={{ width: `${header.minWidth}px` }}
                  >
                    {renderCell(item, header)}
                  </td>
                ))}
              </tr>
            ))}

            {approvedItemsIsLoadingMore && (
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

      {/* Footer */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-surface-muted backdrop-blur-md shrink-0 flex-wrap gap-1">
        <span className="text-[11px] font-extrabold text-text-secondary">Showing {approvedItems.length} of {approvedItemsTotal} items</span>
        <span className="text-[10px] font-bold text-text-muted">
          {approvedItemsHasMore ? "Scroll down to load more records" : approvedItems.length > 0 ? "All approved records loaded" : "No records loaded"}
        </span>
      </div>

    </div>
  );
};  