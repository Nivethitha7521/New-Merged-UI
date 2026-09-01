"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDispatch, useSelector } from "react-redux";
import {
  Box, Button, Typography, Paper, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, CircularProgress,
  Snackbar, Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
} from "@mui/material";
import { ExpandMore as ExpandMoreIcon, ExpandLess as ExpandLessIcon } from "@mui/icons-material";
import { format } from "date-fns";
import { ArrowBack as ArrowBackIcon, CheckCircle as CheckCircleIcon } from "@mui/icons-material";
import { AppDispatch } from "@/redux/store";
import {
  approveHoldMultiGrn,
  selectGrn,
} from "@/features/yen-purchase/GRN/grnSlice";
import { GrnData } from "@/Models/grnModel";
import purchaseApi from "@/utils/api";

// ─── Helpers ────────────────────────────────────────────────────────────────
const customRound = (v: number) => Math.round(v * 100) / 100;

// ─── Component ───────────────────────────────────────────────────────────────
const MultiHoldGrnPage: React.FC = () => {
  const router = useRouter();
  const searchParamsRaw = useSearchParams();
  const searchParams = searchParamsRaw!;
  const dispatch = useDispatch<AppDispatch>();

  const grnId = searchParams.get("grnId") || "";

  // ── State ─────────────────────────────────────────────────────────────────
  const [grn, setGrn] = useState<GrnData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [collapsedPoGroups, setCollapsedPoGroups] = useState<Record<string, boolean>>({});

  // ── Load GRN data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!grnId) return;
    const fetchGrn = async () => {
      try {
        const response = await purchaseApi.get(`/grns/${grnId}`);
        const data = response.data;
        setGrn(data);
        // Default all PO groups expanded
        // Default all PO groups collapsed
const groups: Record<string, boolean> = {};
const poIds = new Set<string>();
(data.itemDetails || []).forEach((item: any) => {
  const poId = item.sourcePurchaseOrderId || "unknown";
  poIds.add(poId);
});
poIds.forEach(id => { groups[id] = true; }); // true = collapsed
setCollapsedPoGroups(groups);
      } catch (err) {
        setSnackbarMessage("Failed to load Hold GRN data.");
        setSnackbarOpen(true);
      } finally {
        setLoading(false);
      }
    };
    fetchGrn();
  }, [grnId]);

  // ── Group items by source PO ──────────────────────────────────────────────
  const poGroups = useMemo(() => {
    if (!grn) return {};
    const groups: Record<string, { poRandomId: string; items: any[] }> = {};
    (grn.itemDetails || []).forEach((item: any) => {
      const poId = item.sourcePurchaseOrderId || "unknown";
      const poRandom = item.sourcePoRandomId || "Unknown PO";
      if (!groups[poId]) groups[poId] = { poRandomId: poRandom, items: [] };
      groups[poId].items.push(item);
    });
    return groups;
  }, [grn]);

  // ── Per-PO totals ─────────────────────────────────────────────────────────
  const poTotals = useMemo(() => {
    const result: Record<string, { subTotal: number; taxTotal: number; finalTotal: number }> = {};
    Object.entries(poGroups).forEach(([poId, group]) => {
      const subTotal = customRound(
        group.items.reduce((s, i) => s + ((i.unitPrice || 0) * (i.receivedQuantity || 0)), 0)
      );
      const taxTotal = customRound(
        group.items.reduce((s, i) => s + (i.taxAmount || 0), 0)
      );
      const finalTotal = customRound(
        group.items.reduce((s, i) => s + (i.finalPrice || 0), 0)
      );
      result[poId] = { subTotal, taxTotal, finalTotal };
    });
    return result;
  }, [poGroups]);

  // ── Tax details per PO ────────────────────────────────────────────────────
  const taxDetailsPerPo = useMemo(() => {
    const result: Record<string, Record<string, { amount: number; percentage: number; type: string }>> = {};
    Object.entries(poGroups).forEach(([poId, group]) => {
      const details: Record<string, { amount: number; percentage: number; type: string }> = {};
      group.items.forEach((item: any) => {
        const taxAmt = item.taxAmount || 0;
        const taxPct = (item as any).taxPercentage || item.purchasetaxName || 0;
        const taxType = item.taxType || "cgst_sgst";
        if (taxType === "igst") {
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
      result[poId] = details;
    });
    return result;
  }, [poGroups]);

  const grandTotal = useMemo(() =>
    customRound(Object.values(poTotals).reduce((s, t) => s + t.finalTotal, 0)),
    [poTotals]
  );

  // ── Approve Handler ───────────────────────────────────────────────────────
  const handleApprove = useCallback(async () => {
    setConfirmOpen(false);
    setIsProcessing(true);
    try {
      await dispatch(approveHoldMultiGrn(grnId)).unwrap();
      setSnackbarMessage("Multi PO Hold GRN approved successfully! Moved to GRN List.");
      setSnackbarOpen(true);
      setTimeout(() => router.push("/yen-purchase/GrnPage"), 1500);
    } catch (err: any) {
      setSnackbarMessage(err?.message || "Failed to approve Hold GRN.");
      setSnackbarOpen(true);
    } finally {
      setIsProcessing(false);
    }
  }, [grnId, dispatch, router]);

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!grn) {
    return (
      <Box p={4}>
        <Typography color="error">Hold GRN not found.</Typography>
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
          Multi-PO Hold GRN — {grn.randomId}
        </Typography>
        <Chip label="HOLD GRN" color="warning" size="small" />
        <Typography variant="body2" color="text.secondary">
          {Object.keys(poGroups).length} POs
        </Typography>
      </Box>

      {/* ── GRN Info ── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, flexShrink: 0 }}>
        <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
          Vendor: {grn.vendorName}
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2 }}>
          <Box>
            <Typography variant="caption" color="text.secondary">Invoice Number</Typography>
            <Typography variant="body2" fontWeight="medium">{grn.invoiceNo || "—"}</Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Invoice Date</Typography>
            <Typography variant="body2" fontWeight="medium">
              {grn.invoiceDate ? format(new Date(grn.invoiceDate), "dd-MM-yyyy") : "—"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">GRN Date</Typography>
            <Typography variant="body2" fontWeight="medium">
              {grn.grnDate ? format(new Date(grn.grnDate), "dd-MM-yyyy") : "—"}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Receiving Location</Typography>
            <Typography variant="body2" fontWeight="medium">{grn.receivingLocation || "—"}</Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">Linked POs: </Typography>
          {(grn.poRandomIds || [grn.poRandomID]).map((id: string, i: number) => (
            <Chip key={i} label={id} size="small" sx={{ mr: 0.5, mt: 0.5 }} color="primary" variant="outlined" />
          ))}
        </Box>
      </Paper>

      {/* ── Scrollable content ── */}
      <Box sx={{ flex: 1, overflowY: "auto", pb: 20 }}>
        {Object.entries(poGroups).map(([poId, group]) => {
          const totals = poTotals[poId] || { subTotal: 0, taxTotal: 0, finalTotal: 0 };
          const taxDetails = taxDetailsPerPo[poId] || {};
          const collapsed = collapsedPoGroups[poId] ?? false;
          const roundOff = (grn.grnRoundOffAmount || 0) / Object.keys(poGroups).length;
          const freightAmt = (grn.totalFreightAmount || 0) / Object.keys(poGroups).length;
          const freightTax = (grn.totalFreightTaxAmount || 0) / Object.keys(poGroups).length;

          return (
            <Paper key={poId} variant="outlined" sx={{ mb: 3 }}>
              {/* PO Title Bar */}
              <Box
                onClick={() => setCollapsedPoGroups(prev => ({ ...prev, [poId]: !prev[poId] }))}
                sx={{
                  px: 2, py: 1,
                  backgroundColor: "#fff3e0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 1,
                  cursor: "pointer",
                  userSelect: "none",
                  "&:hover": { backgroundColor: "#ffe0b2" },
                }}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight="bold" color="warning.dark">
                    PO ID: {group.poRandomId}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle2" fontWeight="bold" color="warning.dark">
                    PO Final Amount: ₹{totals.finalTotal.toFixed(2)}
                  </Typography>
                  {collapsed
                    ? <ExpandMoreIcon sx={{ color: "warning.dark" }} />
                    : <ExpandLessIcon sx={{ color: "warning.dark" }} />
                  }
                </Box>
              </Box>

              {/* Items Table — read-only */}
              {!collapsed && (
                <TableContainer sx={{ overflowX: "auto" }}>
                  <Table size="small" stickyHeader sx={{ tableLayout: "fixed", minWidth: 1000 }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell align="right" sx={{ width: 40 }}>S.No</TableCell>
                        <TableCell sx={{ width: 160 }}>Item Name</TableCell>
                        <TableCell sx={{ width: 60 }}>UOM</TableCell>
                        <TableCell align="right" sx={{ width: 90 }}>Received Qty</TableCell>
                        <TableCell align="right" sx={{ width: 80 }}>PO Price</TableCell>
                        <TableCell align="right" sx={{ width: 80 }}>GRN Price</TableCell>
                        <TableCell align="right" sx={{ width: 90 }}>Taxable Amt</TableCell>
                        <TableCell align="right" sx={{ width: 80 }}>BefTax Disc</TableCell>
                        <TableCell align="right" sx={{ width: 80 }}>AfTax Disc</TableCell>
                        <TableCell align="right" sx={{ width: 60 }}>Tax %</TableCell>
                        <TableCell sx={{ width: 110 }}>Expiry Date</TableCell>
                        <TableCell align="right" sx={{ width: 90 }}>Item Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {group.items.map((item: any, idx: number) => {
                        const poPrice = item.existingPrice || 0;
                        const grnPrice = item.grnPrice || item.unitPrice || 0;
                        const taxableAmt = customRound((item.receivedQuantity || 0) * grnPrice * (1 - (item.befTaxDiscount || 0) / 100));
                        const isPriceHigh = poPrice > 0 && grnPrice > poPrice * 1.1;
                        return (
                          <TableRow key={item.itemId || idx} sx={isPriceHigh ? { backgroundColor: "#fff8e1" } : {}}>
                            <TableCell align="right">{idx + 1}</TableCell>
                            <TableCell sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={item.itemName}>
                              {item.itemName}
                              {isPriceHigh && (
                                <Chip label="Price ↑" size="small" color="warning" sx={{ ml: 0.5, height: 16, fontSize: 10 }} />
                              )}
                            </TableCell>
                            <TableCell>{item.uom}</TableCell>
                            <TableCell align="right">{item.receivedQuantity}</TableCell>
                            <TableCell align="right">{poPrice}</TableCell>
                            <TableCell align="right" sx={isPriceHigh ? { color: "warning.dark", fontWeight: "bold" } : {}}>
                              {grnPrice}
                            </TableCell>
                            <TableCell align="right">{taxableAmt.toFixed(2)}</TableCell>
                            <TableCell align="right">{item.befTaxDiscount || 0}%</TableCell>
                            <TableCell align="right">{item.afTaxDiscount || 0}%</TableCell>
                            <TableCell align="right">{item.purchasetaxName || 0}%</TableCell>
                            <TableCell>
                              {item.expiryDate
                                ? format(new Date(item.expiryDate), "dd-MM-yyyy")
                                : "—"}
                            </TableCell>
                            <TableCell align="right">{(item.finalPrice || 0).toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })}

                      {/* Summary rows */}
                      <TableRow sx={{ backgroundColor: "#e8f5e9" }}>
                        <TableCell colSpan={11} align="right"><strong>Sub Total:</strong></TableCell>
                        <TableCell align="right"><strong>{totals.subTotal.toFixed(2)}</strong></TableCell>
                      </TableRow>

                      {Object.entries(taxDetails).map(([key, tax]) => (
                        <TableRow key={key}>
                          <TableCell colSpan={11} align="right">
                            <strong>{tax.type} ({tax.percentage.toFixed(2)}%):</strong>
                          </TableCell>
                          <TableCell align="right">{tax.amount.toFixed(2)}</TableCell>
                        </TableRow>
                      ))}

                      <TableRow>
                        <TableCell colSpan={11} align="right"><strong>Freight Amount:</strong></TableCell>
                        <TableCell align="right">{freightAmt.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={11} align="right"><strong>Freight Tax:</strong></TableCell>
                        <TableCell align="right">{freightTax.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={11} align="right"><strong>Round Off:</strong></TableCell>
                        <TableCell align="right">{roundOff.toFixed(2)}</TableCell>
                      </TableRow>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell colSpan={11} align="right"><strong>Tax Amount:</strong></TableCell>
                        <TableCell align="right"><strong>{totals.taxTotal.toFixed(2)}</strong></TableCell>
                      </TableRow>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        <TableCell colSpan={11} align="right">
                          <strong style={{ fontSize: "1.05em" }}>Final Amount:</strong>
                        </TableCell>
                        <TableCell align="right">
                          <strong style={{ fontSize: "1.05em" }}>{totals.finalTotal.toFixed(2)}</strong>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          );
        })}

        {/* Grand Total */}
        <Paper variant="outlined" sx={{ p: 2, backgroundColor: "#fff3e0", mb: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Typography variant="h6" fontWeight="bold">
              Grand Total ({Object.keys(poGroups).length} POs)
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="warning.dark">
              ₹ {grandTotal.toFixed(2)}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
            GRN Amount: ₹{(grn.grnAmount || 0).toFixed(2)}
          </Typography>
        </Paper>

        {/* Sticky footer */}
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
            Back
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={isProcessing ? <CircularProgress size={18} color="inherit" /> : <CheckCircleIcon />}
            disabled={isProcessing}
            onClick={() => setConfirmOpen(true)}
          >
            {isProcessing ? "Approving..." : "GRN Approved"}
          </Button>
        </Box>
      </Box>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Hold GRN Approval</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to approve this Multi PO Hold GRN?
          </Typography>
          <Box mt={1}>
            <Typography variant="body2"><strong>GRN ID:</strong> {grn.randomId}</Typography>
            <Typography variant="body2"><strong>Vendor:</strong> {grn.vendorName}</Typography>
            <Typography variant="body2"><strong>PO Count:</strong> {Object.keys(poGroups).length}</Typography>
            {(grn.poRandomIds || []).map((id: string, i: number) => (
              <Typography key={i} variant="body2" sx={{ ml: 1 }}>• {id}</Typography>
            ))}
            <Box sx={{ borderTop: "1px solid #eee", pt: 1, mt: 1 }}>
              <Typography variant="body2" fontWeight="bold">Grand Total: ₹{grandTotal.toFixed(2)}</Typography>
            </Box>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            This will update stock and prices. All linked POs will move to GRN Converted status.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={isProcessing}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleApprove}
            disabled={isProcessing}
          >
            {isProcessing ? <CircularProgress size={20} /> : "Confirm Approve"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={5000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default MultiHoldGrnPage;