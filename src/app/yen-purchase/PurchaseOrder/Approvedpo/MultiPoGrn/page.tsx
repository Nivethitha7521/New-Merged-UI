"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  Box, TextField, Button, Typography, Paper, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, CircularProgress,
  Snackbar, Chip, IconButton, Tooltip, Dialog,
  DialogTitle, DialogContent, DialogActions, Switch,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from "@mui/icons-material";
import { format } from "date-fns";
import { ArrowBack as ArrowBackIcon, Save as SaveIcon, Clear as ClearIcon, Add as AddIcon, Edit as EditIcon } from "@mui/icons-material";
import { AppDispatch } from "@/redux/store";
import {
  fetchPurchaseOrders,
  convertMultiplePOsToSingleGRN,
  selectPurchaseListState,
  selectCurrentPage,
  selectPageSize,
  calculateOverallDiscount,saveMultiPoGrnDraft,
fetchMultiPoGrnDraftById,
markMultiPoGrnDraftOpened,
deleteMultiPoGrnDraft,
} from "../../../../../features/yen-purchase/PurchaseOrder/purchaseListSlice";
import { checkInvoiceAvailability } from "@/features/yen-purchase/GRN/grnSlice";
import LocationAutocomplete from "@/components/yen-purchase/pocreationcomponent/locationautocomplete";
import { Location } from "@/Models/storagelocation";
import { UnifiedDatePicker } from "../../Component/UnifiedDatePicker";
import { PurchaseOrderWithItems, ItemWithCalculations, OverallDiscountResponse, OverallDiscountResponseItem } from '@/app/yen-purchase/PurchaseOrder/Models/Itemcalculation';
import { isValid } from "date-fns";
import FreightSelectionDialog, { FreightData } from "../../Component/freightSelectionDialog";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const customRound = (v: number) => Math.round(v * 100) / 100;

const parseLocalDate = (s: string | null | undefined): Date | null => {
  if (!s) return null;
  const d = new Date(s.split("T")[0] + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
};

// ─── Component ────────────────────────────────────────────────────────────────
const MultiPoGrnPage: React.FC = () => {
  const router = useRouter();
  const searchParamsRaw = useSearchParams();
  const searchParams = searchParamsRaw!;
  const dispatch = useDispatch<AppDispatch>();

  const { purchaseList } = useSelector(selectPurchaseListState);
  const currentPage = useSelector(selectCurrentPage);
  const pageSize = useSelector(selectPageSize);

  // ── State ──────────────────────────────────────────────────────────────────
  const [selectedOrders, setSelectedOrders] = useState<PurchaseOrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
const [collapsedPos, setCollapsedPos] = useState<Record<string, boolean>>({});
  // Per-item editable state: key = `${poId}__${itemId}`
  const [receivedQty, setReceivedQty] = useState<Record<string, number>>({});
  const [grnPrice, setGrnPrice] = useState<Record<string, number | undefined>>({});
  const [expiryDate, setExpiryDate] = useState<Record<string, Date | null>>({});
  const [befDiscount, setBefDiscount] = useState<Record<string, number>>({});
  const [aftDiscount, setAftDiscount] = useState<Record<string, number>>({});

  // Invoice / GRN header
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date());
  const [grnDate] = useState<Date>(new Date());
  const [receivingLocation, setReceivingLocation] = useState<Location | null>(null);

  // Invoice duplicate check
  const [isInvoiceDuplicate, setIsInvoiceDuplicate] = useState(false);
  const [checkingInvoice, setCheckingInvoice] = useState(false);

  // Per-PO freight
  const [freightsPerPo, setFreightsPerPo] = useState<Record<string, FreightData[]>>({});
  const [openFreightDialog, setOpenFreightDialog] = useState(false);
  const [freightDialogPoId, setFreightDialogPoId] = useState<string | null>(null);

  // Per-PO round off
  const [roundOffPerPo, setRoundOffPerPo] = useState<Record<string, number>>({});

  // Per-PO overall discount
  const [overallDiscountPerPo, setOverallDiscountPerPo] = useState<Record<string, number>>({});
  const [discountTypePerPo, setDiscountTypePerPo] = useState<Record<string, 'before' | 'after'>>({});
  const [applyingDiscountForPo, setApplyingDiscountForPo] = useState<Record<string, boolean>>({});

  // UI
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ── Load POs from query string ─────────────────────────────────────────────
  const poIdsParam = searchParams.get("poIds") || "";
  const poIds = useMemo(() => poIdsParam.split(",").filter(Boolean), [poIdsParam]);
const draftIdParam = searchParams.get("draftId");
const [activeDraftId, setActiveDraftId] = useState<string | null>(draftIdParam);
const [draftRestored, setDraftRestored] = useState(false);
const [hasUserEditedDraft, setHasUserEditedDraft] = useState(false);
  useEffect(() => {
    if (purchaseList.length === 0) {
      dispatch(fetchPurchaseOrders({ page: currentPage, size: pageSize, dateField: "approvedDate" }));
    }
  }, [dispatch, currentPage, pageSize, purchaseList.length]);


  useEffect(() => {
  if (!draftIdParam || purchaseList.length === 0) return;

  const restoreDraft = async () => {
    try {
      const draft: any = await dispatch(fetchMultiPoGrnDraftById(draftIdParam)).unwrap();

      const orders: PurchaseOrderWithItems[] = draft.purchaseOrderIds
        .map((id: string) => purchaseList.find(o => o.purchaseOrderId === id))
        .filter(Boolean)
        .map((raw: any) => ({
          ...raw,
          orderDate: raw.orderDate ? new Date(raw.orderDate) : null,
          expectedDeliveryDate: raw.expectedDeliveryDate ? new Date(raw.expectedDeliveryDate) : null,
          invoiceDate: raw.invoiceDate ? parseLocalDate(raw.invoiceDate as any) : null,
          grnDate: null,
          items: raw.items.map((item: any) => ({
            ...item,
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
          })),
        }));

      const s = draft.state || {};

      setSelectedOrders(orders);
      setInvoiceNumber(draft.invoiceNo || "");
      setInvoiceDate(draft.invoiceDate ? parseLocalDate(draft.invoiceDate) : new Date());
      setReceivingLocation(
        draft.locationId
          ? ({ locationId: draft.locationId, locationName: draft.locationName } as any)
          : null
      );

      setReceivedQty(s.receivedQty || {});
      setGrnPrice(s.grnPrice || {});
      setExpiryDate(
        Object.fromEntries(
          Object.entries(s.expiryDate || {}).map(([k, v]: any) => [k, v ? parseLocalDate(v) : null])
        )
      );
      setBefDiscount(s.befDiscount || {});
      setAftDiscount(s.aftDiscount || {});
      setFreightsPerPo(s.freightsPerPo || {});
      setRoundOffPerPo(s.roundOffPerPo || {});
      setOverallDiscountPerPo(s.overallDiscountPerPo || {});
      setDiscountTypePerPo(s.discountTypePerPo || {});
      setCollapsedPos(s.collapsedPos || {});

      setActiveDraftId(draft.draftId);
      setDraftRestored(true);
      setLoading(false);

      await dispatch(markMultiPoGrnDraftOpened(draft.draftId));
    } catch (err: any) {
      setSnackbarMessage(err?.message || "Failed to restore draft");
      setSnackbarOpen(true);
      setLoading(false);
    }
  };

  restoreDraft();
}, [draftIdParam, purchaseList, dispatch]);

  useEffect(() => {
  if (draftIdParam) return;
if (purchaseList.length === 0 || poIds.length === 0) return;

    const orders: PurchaseOrderWithItems[] = poIds
      .map(id => purchaseList.find(o => o.purchaseOrderId === id))
      .filter(Boolean)
      .map(raw => ({
        ...raw!,
        orderDate: raw!.orderDate ? new Date(raw!.orderDate) : null,
        expectedDeliveryDate: raw!.expectedDeliveryDate ? new Date(raw!.expectedDeliveryDate) : null,
        invoiceDate: raw!.invoiceDate ? parseLocalDate(raw!.invoiceDate as any) : null,
        grnDate: null,
        items: raw!.items.map((item: any) => ({
          ...item,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
        })),
      })) as PurchaseOrderWithItems[];

    setSelectedOrders(orders);

    // Initialise per-item state
    const initQty: Record<string, number> = {};
    const initPrice: Record<string, number | undefined> = {};
    const initExpiry: Record<string, Date | null> = {};
    const initBef: Record<string, number> = {};
    const initAft: Record<string, number> = {};

    // Initialise per-PO state
    const initFreights: Record<string, FreightData[]> = {};
    const initRoundOff: Record<string, number> = {};
    const initOverallDiscount: Record<string, number> = {};
    const initDiscountType: Record<string, 'before' | 'after'> = {};

    orders.forEach(order => {
      initFreights[order.purchaseOrderId] = order.freights?.map((freight: any) => ({
        id: freight.id || freight.freightId || '',
        name: freight.name || freight.freightName || '',
        amt: freight.amt || freight.amount || 0,
        tCode: freight.tCode || freight.taxCode || '',
        tAmt: freight.tAmt || freight.taxAmount || 0,
        totalAmt: freight.totalAmt || 0,
        sgst: freight.sgst || 0,
        cgst: freight.cgst || 0,
        igst: freight.igst || 0,
        taxType: freight.taxType || 'cgst_sgst',
        taxPercentage: freight.taxPercentage || 0,
      })) || [];
      initRoundOff[order.purchaseOrderId] = 0;
      initOverallDiscount[order.purchaseOrderId] = 0;
      initDiscountType[order.purchaseOrderId] = 'after';

      order.items.forEach((item: any) => {
        const k = `${order.purchaseOrderId}__${item.itemId}`;
        initQty[k] = item.pendingTotalQuantity || 0;
        initPrice[k] = undefined;
        initExpiry[k] = null; // Always start empty — user must explicitly select expiry date
        initBef[k] = item.befTaxDiscount || 0;
        initAft[k] = item.afTaxDiscount || 0;
      });
    });

    setReceivedQty(initQty);
    setGrnPrice(initPrice);
    setExpiryDate(initExpiry);
    setBefDiscount(initBef);
    setAftDiscount(initAft);
    setFreightsPerPo(initFreights);
    setRoundOffPerPo(initRoundOff);
    setOverallDiscountPerPo(initOverallDiscount);
    setDiscountTypePerPo(initDiscountType);
const initCollapsed: Record<string, boolean> = {};
orders.forEach(o => { initCollapsed[o.purchaseOrderId] = true; });
setCollapsedPos(initCollapsed);
    setLoading(false);
  }, [purchaseList, poIds]);

  // ── Invoice duplicate check ────────────────────────────────────────────────
  useEffect(() => {
    if (!invoiceNumber || selectedOrders.length === 0) return;

    const timer = setTimeout(async () => {
      try {
        setCheckingInvoice(true);
        const result = await dispatch(
          checkInvoiceAvailability({
            invoiceNo: invoiceNumber,
            vendorName: selectedOrders[0]?.vendorName || "",
          })
        ).unwrap();
        setIsInvoiceDuplicate(!result.available);
      } catch {
        setIsInvoiceDuplicate(false);
      } finally {
        setCheckingInvoice(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [invoiceNumber, selectedOrders, dispatch]);

  // ── Calculated items per PO ────────────────────────────────────────────────
  const calcItemsPerPo = useMemo(() => {
    const result: Record<string, ItemWithCalculations[]> = {};
    selectedOrders.forEach(order => {
      result[order.purchaseOrderId] = order.items
        .filter((item: any) => (item.pendingTotalQuantity || 0) > 0)
        .map((item: any) => {
          const k = `${order.purchaseOrderId}__${item.itemId}`;
          const rq = receivedQty[k] ?? item.pendingTotalQuantity ?? 0;
          const price = grnPrice[k] !== undefined ? grnPrice[k]! : (item.newPrice || item.existingPrice || 0);
          const tax = item.taxPercentage || 0;
          const bef = befDiscount[k] || 0;
          const aft = aftDiscount[k] || 0;

          const baseAmount = rq * price;
          const befDiscAmt = customRound(baseAmount * (bef / 100));
          const taxableAmt = customRound(baseAmount - befDiscAmt);
          const taxAmt = customRound(taxableAmt * (tax / 100));
          const afterTax = customRound(taxableAmt + taxAmt);
          const aftDiscAmt = customRound(afterTax * (aft / 100));
          const finalPrice = customRound(afterTax - aftDiscAmt);

          // Per unit calc
          const perUnitTaxable = customRound(price * (1 - bef / 100));
          const perUnitTax = customRound(perUnitTaxable * (tax / 100));
          const perUnit = perUnitTaxable + perUnitTax;

          return {
            ...item,
            receivedQuantity: rq,
            grnPrice: grnPrice[k],
            existingPrice: item.newPrice || item.existingPrice || 0,
            expiryDate: expiryDate[k],
            befTaxDiscount: bef,
            afTaxDiscount: aft,
            perUnit,
            calculatedTaxableAmount: taxableAmt,
            calculatedTaxAmount: taxAmt,
            calculatedFinalPrice: finalPrice,
            calculatedTotalPrice: baseAmount,
          } as ItemWithCalculations;
        });
    });
    return result;
  }, [selectedOrders, receivedQty, grnPrice, expiryDate, befDiscount, aftDiscount]);

  // ── Tax details per PO ────────────────────────────────────────────────────
  const taxDetailsPerPo = useMemo(() => {
    const result: Record<string, Record<string, { amount: number; percentage: number; type: string }>> = {};
    selectedOrders.forEach(order => {
      const details: Record<string, { amount: number; percentage: number; type: string }> = {};
      (calcItemsPerPo[order.purchaseOrderId] || []).forEach(item => {
        const taxAmt = item.calculatedTaxAmount || 0;
        const taxPct = item.taxPercentage || 0;
        if ((item as any).taxType === "igst") {
          const key = `igst-${taxPct}`;
          details[key] = { amount: (details[key]?.amount || 0) + taxAmt, percentage: taxPct, type: "IGST" };
        } else {
          const half = taxAmt / 2;
          const sgstKey = `sgst-${taxPct / 2}`;
          const cgstKey = `cgst-${taxPct / 2}`;
          details[sgstKey] = { amount: (details[sgstKey]?.amount || 0) + half, percentage: taxPct / 2, type: "SGST" };
          details[cgstKey] = { amount: (details[cgstKey]?.amount || 0) + half, percentage: taxPct / 2, type: "CGST" };
        }
      });
      result[order.purchaseOrderId] = details;
    });
    return result;
  }, [calcItemsPerPo, selectedOrders]);

  // ── Per-PO totals ─────────────────────────────────────────────────────────
  const poTotalsMap = useMemo(() => {
    const result: Record<string, {
      subTotal: number;
      taxTotal: number;
      freightAmt: number;
      freightTax: number;
      beforeRoundOff: number;
      finalTotal: number;
    }> = {};

    selectedOrders.forEach(order => {
      const pid = order.purchaseOrderId;
      const items = calcItemsPerPo[pid] || [];
      const freights = freightsPerPo[pid] || [];
      const roundOff = roundOffPerPo[pid] || 0;

      const subTotal = customRound(items.reduce((s, i) => s + (i.calculatedTaxableAmount || 0), 0));
      const taxTotal = customRound(Object.values(taxDetailsPerPo[pid] || {}).reduce((s, t) => s + t.amount, 0));
      const freightAmt = customRound(freights.reduce((s, f) => s + f.amt, 0));
      const freightTax = customRound(freights.reduce((s, f) => s + f.tAmt, 0));
      const itemsTotal = customRound(items.reduce((s, i) => s + (i.calculatedFinalPrice || 0), 0));
      const beforeRoundOff = customRound(itemsTotal + freightAmt + freightTax);
      const finalTotal = customRound(beforeRoundOff + roundOff);

      result[pid] = { subTotal, taxTotal, freightAmt, freightTax, beforeRoundOff, finalTotal };
    });
    return result;
  }, [selectedOrders, calcItemsPerPo, taxDetailsPerPo, freightsPerPo, roundOffPerPo]);

  // ── Grand total ───────────────────────────────────────────────────────────
  const grandTotal = useMemo(() =>
    customRound(
      selectedOrders.reduce((sum, order) => {
        return sum + (poTotalsMap[order.purchaseOrderId]?.finalTotal || 0);
      }, 0)
    ),
    [selectedOrders, poTotalsMap]);

  // ── Apply Overall Discount per PO ─────────────────────────────────────────
  const handleApplyDiscount = useCallback(async (poId: string) => {
    const discountAmt = overallDiscountPerPo[poId] || 0;
    const discType = discountTypePerPo[poId] || 'after';
    if (discountAmt <= 0) return;

    setApplyingDiscountForPo(prev => ({ ...prev, [poId]: true }));

    try {
      const order = selectedOrders.find(o => o.purchaseOrderId === poId);
      if (!order) return;

      const requestItems = order.items
        .filter((item: any) => {
          const k = `${poId}__${item.itemId}`;
          return (receivedQty[k] || 0) > 0;
        })
        .map((item: any) => {
          const k = `${poId}__${item.itemId}`;
          return {
            itemId: item.itemId,
            poQuantity: item.poQuantity || 0,
            pendingTotalQuantity: receivedQty[k] || 0,
            newPrice: grnPrice[k] !== undefined ? grnPrice[k] : (item.newPrice || item.existingPrice || 0),
            befTaxDiscount: befDiscount[k] || 0,
            afTaxDiscount: aftDiscount[k] || 0,
            taxPercentage: item.taxPercentage || 0,
            taxType: item.taxType || 'igst',
            befTaxDiscountType: 'percentage' as const,
            afTaxDiscountType: 'percentage' as const,
          };
        });

      const result: OverallDiscountResponse = await dispatch(calculateOverallDiscount({
        items: requestItems,
        applyOverallDiscount: true,
        overallDiscountAmount: discountAmt,
        discount_type: discType,
      })).unwrap();

      if (result.success) {
        const newBef = { ...befDiscount };
        const newAft = { ...aftDiscount };
        result.items.forEach((r: OverallDiscountResponseItem) => {
          const k = `${poId}__${r.itemId}`;
          newBef[k] = r.befTaxDiscount;
          newAft[k] = r.afTaxDiscount;
        });
        setBefDiscount(newBef);
        setAftDiscount(newAft);
        setSnackbarMessage(`Discount of ₹${discountAmt.toFixed(2)} applied (${discType} tax)`);
        setSnackbarOpen(true);
      }
    } catch (err: any) {
      setSnackbarMessage(err?.message || 'Failed to apply discount');
      setSnackbarOpen(true);
    } finally {
      setApplyingDiscountForPo(prev => ({ ...prev, [poId]: false }));
    }
  }, [overallDiscountPerPo, discountTypePerPo, selectedOrders, receivedQty, grnPrice, befDiscount, aftDiscount, dispatch]);

  const handleRemoveDiscount = useCallback((poId: string, order: PurchaseOrderWithItems) => {
    const newBef = { ...befDiscount };
    const newAft = { ...aftDiscount };
    order.items.forEach((item: any) => {
      const k = `${poId}__${item.itemId}`;
      newBef[k] = item.befTaxDiscount || 0;
      newAft[k] = item.afTaxDiscount || 0;
    });
    setBefDiscount(newBef);
    setAftDiscount(newAft);
    setOverallDiscountPerPo(prev => ({ ...prev, [poId]: 0 }));
    setDiscountTypePerPo(prev => ({ ...prev, [poId]: 'after' }));
  }, [befDiscount, aftDiscount]);

  // ── Round Off handler ─────────────────────────────────────────────────────
  const handleRoundOffChange = useCallback((poId: string, value: string) => {
    if (value === '') {
      setRoundOffPerPo(prev => ({ ...prev, [poId]: 0 }));
      return;
    }
    if (/^-?\d*\.?\d{0,2}$/.test(value)) {
      const parsed = parseFloat(value) || 0;
      if (Math.abs(parsed) <= 2) {
        setRoundOffPerPo(prev => ({ ...prev, [poId]: parsed }));
      }
    }
  }, []);

  // ── Validation ────────────────────────────────────────────────────────────
const isValid_ = useCallback((): { ok: boolean; msg: string } => {
  if (!invoiceNumber.trim())
    return { ok: false, msg: "Invoice Number required" };

  if (isInvoiceDuplicate)
    return { ok: false, msg: "Invoice Number already exists" };

  if (!invoiceDate)
    return { ok: false, msg: "Invoice Date required" };

  if (!receivingLocation)
    return { ok: false, msg: "Receiving Location required" };

  const anyReceived = selectedOrders.some(order =>
    order.items.some((item: any) => {
      const k = `${order.purchaseOrderId}__${item.itemId}`;
      return (receivedQty[k] || 0) > 0;
    })
  );

  if (!anyReceived)
    return { ok: false, msg: "At least one item must have received quantity" };

  const missingExpiry = selectedOrders.some(order =>
    order.items
      .filter((item: any) => (item.pendingTotalQuantity || 0) > 0)
      .some((item: any) => {
        const k = `${order.purchaseOrderId}__${item.itemId}`;
        const qty = Number(receivedQty[k] || 0);
        return qty > 0 && !expiryDate[k];
      })
  );

  if (missingExpiry)
    return {
      ok: false,
      msg: "Please select an expiry date for all items before converting to GRN.",
    };

  return { ok: true, msg: "" };
}, [
  invoiceNumber,
  invoiceDate,
  receivingLocation,
  isInvoiceDuplicate,
  selectedOrders,
  receivedQty,
  expiryDate,
]);
const buildDraftPayload = useCallback(() => ({
  draftId: activeDraftId,
  purchaseOrderIds: selectedOrders.map(o => o.purchaseOrderId),
  poRandomIds: selectedOrders.map(o => o.randomId),
  vendorId: (selectedOrders[0] as any)?.vendorId || "",
  vendorName: selectedOrders[0]?.vendorName || "",
  invoiceNo: invoiceNumber,
  invoiceDate: invoiceDate ? invoiceDate.toISOString() : null,
  grnDate: grnDate ? grnDate.toISOString() : null,
  locationId: receivingLocation?.locationId || "",
  locationName: (receivingLocation as any)?.locationName || "",
  state: {
    receivedQty,
    grnPrice,
    expiryDate: Object.fromEntries(
      Object.entries(expiryDate).map(([k, v]) => [k, v ? v.toISOString() : null])
    ),
    befDiscount,
    aftDiscount,
    freightsPerPo,
    roundOffPerPo,
    overallDiscountPerPo,
    discountTypePerPo,
    collapsedPos,
  },
}), [
  activeDraftId,
  selectedOrders,
  invoiceNumber,
  invoiceDate,
  grnDate,
  receivingLocation,
  receivedQty,
  grnPrice,
  expiryDate,
  befDiscount,
  aftDiscount,
  freightsPerPo,
  roundOffPerPo,
  overallDiscountPerPo,
  discountTypePerPo,
  collapsedPos,
]);
useEffect(() => {
  if (loading) return;
  if (selectedOrders.length < 2) return;
  if (draftIdParam && !draftRestored) return;

  const timer = setTimeout(async () => {
    try {
      const saved: any = await dispatch(saveMultiPoGrnDraft(buildDraftPayload())).unwrap();

      if (!activeDraftId && saved?.draftId) {
        setActiveDraftId(saved.draftId);
      }

      setHasUserEditedDraft(true);
    } catch (err) {
      console.error("Draft auto-save failed", err);
    }
  }, 1000);

  return () => clearTimeout(timer);
}, [
  buildDraftPayload,
  dispatch,
  loading,
  selectedOrders.length,
  draftIdParam,
  draftRestored,
  activeDraftId,
]);
  // ── Convert to GRN ────────────────────────────────────────────────────────
const handleConvert = useCallback(async () => {
  setConfirmOpen(false);
  setIsProcessing(true);

  try {
    const payload = {
      purchaseOrderIds: selectedOrders.map((o) => o.purchaseOrderId),
      invoiceNo: invoiceNumber.trim(),
      invoiceDate: invoiceDate ? invoiceDate.toISOString() : new Date().toISOString(),
      grnDate: grnDate.toISOString(),
      locationId: receivingLocation?.locationId,
      locationName: receivingLocation?.branchName || "",

      orders: selectedOrders.map((order) => ({
        purchaseOrderId: order.purchaseOrderId,
        freights: freightsPerPo[order.purchaseOrderId] || [],
        grnRoundOffAmount: roundOffPerPo[order.purchaseOrderId] || 0,
        grndiscountPrice: overallDiscountPerPo[order.purchaseOrderId] || 0,

        items: (calcItemsPerPo[order.purchaseOrderId] || [])
  .filter((item) => Number(item.receivedQuantity || 0) > 0)
  .map((item) => ({
    itemId: item.itemId,
    receivedQuantity: Number(item.receivedQuantity || 0),
    damagedQuantity: 0,
    grnPrice: Number(item.grnPrice ?? item.existingPrice ?? 0),
    expiryDate: item.expiryDate ? item.expiryDate.toISOString() : null,
    nos: Number(
      item.count ||
      item.pendingCount ||
      item.nos ||
      0
    ),
    eachQuantity: Number(
      item.eachQuantity ||
      item.pendingQuantity ||
      0
    ),
  })),
      })),
    };

   const result = await dispatch(convertMultiplePOsToSingleGRN(payload)).unwrap();
if (activeDraftId) {
  await dispatch(deleteMultiPoGrnDraft(activeDraftId)).unwrap();
  setActiveDraftId(null);
}

    if (result?.isHoldGrn) {
      setSnackbarMessage("Price exceeds limit — moved to Hold GRN for approval.");
      setSnackbarOpen(true);
      setTimeout(() => router.push("/yen-purchase/PurchaseOrder/HoldGrn"), 1500);
    } else {
      setSnackbarMessage("Multi PO GRN created successfully");
      setSnackbarOpen(true);
      router.push("/yen-purchase/PurchaseOrder/Approvedpo");
    }
 } catch (err: any) {
  const detail =
    err?.response?.data?.detail ||
    err?.payload?.detail ||
    err?.message ||
    err;

  const message =
    typeof detail === "string"
      ? detail
      : detail?.detail || "Failed to convert Multi PO to GRN";

  setSnackbarMessage(message);
  setSnackbarOpen(true);
} finally {
    setIsProcessing(false);
  }
}, [
  selectedOrders,
  calcItemsPerPo,
  invoiceNumber,
  invoiceDate,
  grnDate,
  receivingLocation,
  freightsPerPo,
  roundOffPerPo,
  overallDiscountPerPo,
  dispatch,
  router,
]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (selectedOrders.length === 0) {
    return (
      <Box p={4}>
        <Typography color="error">No valid POs found. Please go back and select POs.</Typography>
        <Button onClick={() => router.back()} startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>Back</Button>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, py: 1, height: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Header ── */}
      <Box display="flex" alignItems="center" gap={2} mb={2} sx={{ flexShrink: 0 }}>
        <IconButton onClick={() => router.back()} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight="bold">
          Multi-PO GRN Conversion ({selectedOrders.length} POs selected)
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Selected PO : {selectedOrders.length}
        </Typography>
      </Box>

      {/* ── Shared Header Fields ── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
          Vendor : {selectedOrders[0]?.vendorName}
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, alignItems: "flex-start" }}>
          {/* Invoice Number */}
          <Box>
            <TextField
              label="Invoice Number"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              size="small"
              fullWidth
            />
            {checkingInvoice && (
              <Typography variant="caption" color="info.main">Checking invoice...</Typography>
            )}
            {isInvoiceDuplicate && (
              <Typography variant="caption" color="error">Invoice already exists</Typography>
            )}
          </Box>

          {/* Invoice Date - editable via UnifiedDatePicker (same as ApprovedPO when orderDate is present) */}
          <UnifiedDatePicker
  value={invoiceDate}
  onChange={(date) => setInvoiceDate(date)}
  onValidationChange={() => {}}
  dateType="invoice"
  label="Invoice Date"
  required={true}
  orderDate={selectedOrders[0]?.orderDate}
  disabled={!selectedOrders[0]?.orderDate}
  skipInitialValidation={true}
/>

          {/* GRN Date - non-editable */}
          <TextField
            label="GRN Date"
            type="date"
            value={format(grnDate, "yyyy-MM-dd")}
            disabled
            size="small"
            InputLabelProps={{ shrink: true }}
          />

          {/* Location */}
          <Box sx={{ minWidth: 250 }}>
            <LocationAutocomplete
              value={receivingLocation}
              onChange={(location) => setReceivingLocation(location)}
              label="Receiving Location"
            />
          </Box>
        </Box>
      </Paper>

      {/* ── Scrollable content ── */}
     <Box
  sx={{
    flex: 1,
    overflowY: "auto",
    pb: 20,
  }}
>
        {selectedOrders.map(order => {
          const pid = order.purchaseOrderId;
          const items = calcItemsPerPo[pid] || [];
          const totals = poTotalsMap[pid] || { subTotal: 0, taxTotal: 0, freightAmt: 0, freightTax: 0, beforeRoundOff: 0, finalTotal: 0 };
          const freights = freightsPerPo[pid] || [];
          const roundOff = roundOffPerPo[pid] || 0;
          const overallDiscount = overallDiscountPerPo[pid] || 0;
          const discType = discountTypePerPo[pid] || 'after';
          const applyingDisc = applyingDiscountForPo[pid] || false;
          const taxDetails = taxDetailsPerPo[pid] || {};
          const discountType = discountTypePerPo[pid] || 'after';

          // Round-off suggestion
          const roundOffSuggestion = (() => {
            const frac = totals.beforeRoundOff % 1;
            return frac !== 0 ? (Math.round(totals.beforeRoundOff) - totals.beforeRoundOff).toFixed(2) : '0.00';
          })();

          return (
            <Paper key={pid} variant="outlined" sx={{ mb: 3 }}>
              {/* ── PO Title Bar ── */}
            {/* ── PO Title Bar ── */}
<Box
  onClick={() => setCollapsedPos(prev => ({ ...prev, [pid]: !prev[pid] }))}
  sx={{
    px: 2, py: 1,
    backgroundColor: "#e3f2fd",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 1,
    cursor: "pointer",
    userSelect: "none",
    "&:hover": { backgroundColor: "#d0e8fb" },
  }}
>
  {/* LEFT: PO ID + Vendor */}
  <Box display="flex" alignItems="center" gap={1}>
    <Typography variant="subtitle1" fontWeight="bold" color="primary">
      PO ID: {order.randomId}
    </Typography>
    <Chip label={order.vendorName} size="small" color="default" />
  </Box>

  {/* RIGHT: Amount + Chevron only */}
  <Box display="flex" alignItems="center" gap={1}>
    <Typography variant="subtitle2" fontWeight="bold" color="primary">
      PO Final Amount: ₹{totals.finalTotal.toFixed(2)}
    </Typography>
    {collapsedPos[pid]
      ? <ExpandMoreIcon sx={{ color: "primary.main" }} />
      : <ExpandLessIcon sx={{ color: "primary.main" }} />
    }
  </Box>
</Box>

              {/* ── Items table ── */}
              {!collapsedPos[pid] && (
              <TableContainer sx={{ overflowX: "auto" }}>
                <Table size="small" stickyHeader sx={{ tableLayout: 'fixed', minWidth: 1100 }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell align="right" sx={{ width: 40, whiteSpace: 'nowrap' }}>S.No</TableCell>
                      <TableCell sx={{ width: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Item Name</TableCell>
                      <TableCell sx={{ width: 60 }}>UOM</TableCell>
                      <TableCell align="right" sx={{ width: 80, whiteSpace: 'nowrap' }}>Pending Qty</TableCell>
                      <TableCell align="right" sx={{ width: 70, whiteSpace: 'nowrap' }}>Total Qty</TableCell>
                      <TableCell align="right" sx={{ width: 95, whiteSpace: 'nowrap' }}>Received Qty</TableCell>
                      <TableCell align="right" sx={{ width: 75, whiteSpace: 'nowrap' }}>PO Price</TableCell>
                      <TableCell align="right" sx={{ width: 100, whiteSpace: 'nowrap' }}>GRN Price</TableCell>
                      <TableCell align="right" sx={{ width: 90, whiteSpace: 'nowrap' }}>Taxable Amt</TableCell>
                      <TableCell align="right" sx={{ width: 85, whiteSpace: 'nowrap' }}>BefTax Disc</TableCell>
                      <TableCell align="right" sx={{ width: 85, whiteSpace: 'nowrap' }}>AfTax Disc</TableCell>
                      <TableCell align="right" sx={{ width: 55, whiteSpace: 'nowrap' }}>Tax %</TableCell>
                      <TableCell sx={{ width: 140, whiteSpace: 'nowrap' }}>Expiry Date</TableCell>
                      <TableCell align="right" sx={{ width: 90, whiteSpace: 'nowrap' }}>Item Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, idx) => {
                      const k = `${pid}__${item.itemId}`;
                      const poPrice = item.existingPrice || 0;
                      return (
                        <TableRow key={item.itemId}>
                          <TableCell align="right">{idx + 1}</TableCell>
                          <TableCell sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.itemName}>{item.itemName}</TableCell>
                          <TableCell>{item.uom}</TableCell>
                          <TableCell align="right">{item.pendingTotalQuantity}</TableCell>
                          <TableCell align="right">{item.poQuantity}</TableCell>

                          {/* Received Qty */}
                          <TableCell align="right">
                            <TextField
                              type="number"
                              value={receivedQty[k] ?? ""}
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setReceivedQty(prev => ({ ...prev, [k]: isNaN(val) ? 0 : val }));
                              }}
                              inputProps={{ step: "0.001", min: 0, max: Number(item.pendingTotalQuantity) }}
                              sx={{ width: 80 }}
                              size="small"
                            />
                          </TableCell>

                          {/* PO Price (read-only) */}
                          <TableCell align="right">{poPrice}</TableCell>

                          {/* GRN Price */}
                          <TableCell align="right" sx={{ px: 0.5 }}>
                            <TextField
                              type="number"
                              value={grnPrice[k] !== undefined ? grnPrice[k] : poPrice}
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setGrnPrice(prev => ({ ...prev, [k]: isNaN(val) ? undefined : val }));
                              }}
                              inputProps={{ step: "0.01", min: 0 }}
                              sx={{ width: 80 }}
                              size="small"
                            />
                          </TableCell>

                          {/* Taxable Amt */}
                          <TableCell align="right">{(item.calculatedTaxableAmount || 0).toFixed(2)}</TableCell>

                          {/* BefTax Discount */}
                          <TableCell align="right" sx={{ px: 0.5 }}>
                            <TextField
                              type="number"
                              value={befDiscount[k] === 0 || befDiscount[k] === undefined ? "" : befDiscount[k]}
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setBefDiscount(prev => ({ ...prev, [k]: isNaN(val) ? 0 : val }));
                              }}
                              inputProps={{ step: "0.01", min: 0 }}
                              sx={{ width: 70 }}
                              size="small"
                              disabled={discType === 'after' || applyingDisc}
                            />
                          </TableCell>

                          {/* AfTax Discount */}
                          <TableCell align="right" sx={{ px: 0.5 }}>
                            <TextField
                              type="number"
                              value={aftDiscount[k] === 0 || aftDiscount[k] === undefined ? "" : aftDiscount[k]}
                              onChange={e => {
                                const val = parseFloat(e.target.value);
                                setAftDiscount(prev => ({ ...prev, [k]: isNaN(val) ? 0 : val }));
                              }}
                              inputProps={{ step: "0.01", min: 0 }}
                              sx={{ width: 70 }}
                              size="small"
                              disabled={discType === 'before' || applyingDisc}
                            />
                          </TableCell>

                          {/* Tax % */}
                          <TableCell align="right">{item.taxPercentage}%</TableCell>

                          {/* Expiry Date */}
                          <TableCell sx={{ px: 0.5 }}>
                            <TextField
                              type="date"
                              value={
                                expiryDate[k] && isValid(expiryDate[k]!)
                                  ? format(expiryDate[k]!, "yyyy-MM-dd")
                                  : ""
                              }
                              onChange={e => {
                                const d = e.target.value ? new Date(e.target.value) : null;
                                setExpiryDate(prev => ({ ...prev, [k]: d }));
                              }}
                              inputProps={{ min: format(new Date(), "yyyy-MM-dd") }}
                              InputLabelProps={{ shrink: true }}
                              sx={{ width: 135 }}
                              size="small"
                            />
                          </TableCell>

                          {/* Item Total */}
                          <TableCell align="right">{(item.calculatedFinalPrice || 0).toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}

                    {/* ── Sub Total row ── */}
                    <TableRow sx={{ backgroundColor: "#e8f5e9" }}>
                      <TableCell colSpan={13} align="right"><strong>Sub Total :</strong></TableCell>
                      <TableCell align="right"><strong>{totals.subTotal.toFixed(2)}</strong></TableCell>
                    </TableRow>

                    {/* ── Tax rows ── */}
                    {Object.entries(taxDetails).map(([key, tax]) => (
                      <TableRow key={key}>
                        <TableCell colSpan={13} align="right">
                          <strong>{tax.type} ({tax.percentage.toFixed(2)}%):</strong>
                        </TableCell>
                        <TableCell align="right">{tax.amount.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}

                    {/* ── Freight Amount ── */}
                    <TableRow>
                      <TableCell colSpan={13} align="right"><strong>Freight Amount:</strong></TableCell>
                      <TableCell align="right">{totals.freightAmt.toFixed(2)}</TableCell>
                    </TableRow>

                    {/* ── Freight Tax ── */}
                    <TableRow sx={{ backgroundColor: "#f0f8ff" }}>
                      <TableCell colSpan={13} align="right">
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1 }}>
                          <strong>Freight Tax:</strong>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => {
                              setFreightDialogPoId(pid);
                              setOpenFreightDialog(true);
                            }}
                            startIcon={freights.length > 0 ? <EditIcon /> : <AddIcon />}
                          />
                        </Box>
                      </TableCell>
                      <TableCell align="right">{totals.freightTax.toFixed(2)}</TableCell>
                    </TableRow>

                    {/* ── Discount ── */}
                    <TableRow>
                     <TableCell
  colSpan={13}
  align="right"
  sx={{ verticalAlign: "middle" }}
><strong>Discount:</strong></TableCell>
                     <TableCell
  align="right"
  sx={{
    minWidth: 380,
    width: 380,
  }}
>
                      <Box
  sx={{
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 1,
    width: "100%",
  }}
>
                          <TextField
                            type="number"
                            value={overallDiscount === 0 ? '' : overallDiscount}
                            onChange={e => setOverallDiscountPerPo(prev => ({ ...prev, [pid]: Number(e.target.value) || 0 }))}
                            onBlur={() => {
                              if (overallDiscount > 0) handleApplyDiscount(pid);
                            }}
                            size="small"
                            label="₹"
                            inputProps={{ min: '0', step: '0.01' }}
                            sx={{
  width: 180,
  "& .MuiInputBase-root": {
    width: 180,
  },
}}
                            disabled={applyingDisc}
                          />
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontSize: '0.60rem' }}>
                              {discType === 'before' ? 'Before' : 'After'} Tax
                            </Typography>
                            <Switch
                              checked={discType === 'after'}
                              onChange={e => {
                                const newType = e.target.checked ? 'after' : 'before';
                                setDiscountTypePerPo(prev => ({ ...prev, [pid]: newType }));
                                setOverallDiscountPerPo(prev => ({ ...prev, [pid]: 0 }));
                              }}
                              size="small"
                              disabled={applyingDisc}
                            />
                          </Box>
                          <Tooltip title="Apply discount">
                            <span>
                              <IconButton
                                onClick={() => handleApplyDiscount(pid)}
                                size="small"
                                disabled={applyingDisc || overallDiscount <= 0}
                                sx={{ color: 'success.main' }}
                              >
                                {applyingDisc ? <CircularProgress size={20} /> : <SaveIcon />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          {overallDiscount > 0 && (
                            <IconButton
                              onClick={() => handleRemoveDiscount(pid, order)}
                              size="small"
                              color="error"
                            >
                              <ClearIcon />
                            </IconButton>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>

                    {/* ── Before Round Off ── */}
                    <TableRow>
                      <TableCell colSpan={13} align="right"><strong>Before RoundOff:</strong></TableCell>
                      <TableCell align="right">{totals.beforeRoundOff.toFixed(2)}</TableCell>
                    </TableRow>

                    {/* ── Round Off ── */}
                    <TableRow>
                      <TableCell colSpan={13} align="right"><strong>Round Off Amount:</strong></TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={roundOff === 0 ? '' : roundOff}
                          onChange={e => handleRoundOffChange(pid, e.target.value)}
                          onBlur={() => {
                            // Cap at ±2
                            const capped = Math.max(-2, Math.min(2, roundOff));
                            setRoundOffPerPo(prev => ({ ...prev, [pid]: Math.round(capped * 100) / 100 }));
                          }}
                          size="small"
                          label="₹"
                          inputProps={{ min: '-2', max: '2', step: '0.01' }}
                          placeholder={roundOffSuggestion}
                          sx={{ width: 120 }}
                        />
                      </TableCell>
                    </TableRow>

                    {/* ── Tax Amount ── */}
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell colSpan={13} align="right"><strong>Tax Amount:</strong></TableCell>
                      <TableCell align="right">
                        <strong>{totals.taxTotal.toFixed(2)}</strong>
                      </TableCell>
                    </TableRow>

                    {/* ── Final Amount ── */}
                    <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                      <TableCell colSpan={13} align="right">
                        <strong style={{ fontSize: '1.05em' }}>Final Amount:</strong>
                      </TableCell>
                      <TableCell align="right" sx={{ color: totals.finalTotal < 0 ? 'error.main' : 'inherit' }}>
                        <strong style={{ fontSize: '1.05em' }}>{totals.finalTotal.toFixed(2)}</strong>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
              )}
            </Paper>
          );
        })}

        {/* ── Grand Total ── */}
        <Paper variant="outlined" sx={{ p: 2, backgroundColor: "#e8eaf6", mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Grand Total ({selectedOrders.length} POs)
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary">
              ₹ {grandTotal.toFixed(2)}
            </Typography>
          </Box>
        </Paper>

        {/* ── Sticky footer ── */}
        <Box
  sx={{
    position: "fixed",
    bottom: 0,
    left: 80,
    right: 0,
    zIndex: 1300,
    background: "#fff",
    borderTop: "1px solid #ddd",
    p: 2,
    display: "flex",
    justifyContent: "flex-end",
    gap: 2,
    boxShadow: "0 -2px 10px rgba(0,0,0,0.08)",
  }}
>
          <Button variant="outlined" onClick={() => router.back()} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            disabled={isProcessing}
            onClick={() => {
              const validation = isValid_();
              if (!validation.ok) {
                setSnackbarMessage(validation.msg);
                setSnackbarOpen(true);
                return;
              }
              setConfirmOpen(true);
            }}
          >
            {isProcessing
              ? <CircularProgress size={20} color="inherit" />
              : `Convert To GRN (${selectedOrders.length})`
            }
          </Button>
        </Box>
      </Box>

      {/* ── Freight Dialog ── */}
      {freightDialogPoId && (
        <FreightSelectionDialog
          open={openFreightDialog}
          onClose={() => {
            setOpenFreightDialog(false);
            setFreightDialogPoId(null);
          }}
          onAddFreights={(newFreights) => {
            setFreightsPerPo(prev => ({ ...prev, [freightDialogPoId]: newFreights }));
            setOpenFreightDialog(false);
            setFreightDialogPoId(null);
          }}
          existingFreights={freightsPerPo[freightDialogPoId] || []}
        />
      )}

      {/* ── Confirm Dialog ── */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Multi-PO GRN Conversion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to convert {selectedOrders.length} Purchase Orders to GRN?
          </Typography>
          <Box mt={1}>
            {selectedOrders.map(order => {
              const totals = poTotalsMap[order.purchaseOrderId];
              return (
                <Box key={order.purchaseOrderId} display="flex" justifyContent="space-between" mb={0.5}>
                  <Typography variant="body2">{order.randomId}</Typography>
                  <Typography variant="body2">₹ {totals?.finalTotal.toFixed(2)}</Typography>
                </Box>
              );
            })}
            <Box display="flex" justifyContent="space-between" sx={{ borderTop: "1px solid #eee", pt: 1, mt: 1 }}>
              <Typography variant="body2" fontWeight="bold">Grand Total:</Typography>
              <Typography variant="body2" fontWeight="bold">₹ {grandTotal.toFixed(2)}</Typography>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleConvert}>
            Confirm Convert to GRN
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Snackbar ── */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default MultiPoGrnPage;