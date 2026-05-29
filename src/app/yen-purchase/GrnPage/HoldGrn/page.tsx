"use client";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import Link from "next/link";
import {
  Box, Button, Typography, Paper, TableContainer, Table,
  TableHead, TableRow, TableCell, TableBody, CircularProgress,
  IconButton, Snackbar, Tooltip, Grid, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Switch,
} from "@mui/material";
import {
  fetchHoldGrns,
  approveHoldGrn,
  downloadHoldGrnPDF,
  selectGrn,
  clearSnackbarMessage,
} from "@/features/yen-purchase/GRN/grnSlice";
import VisibilityIcon from "@mui/icons-material/Visibility";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import InventoryIcon from "@mui/icons-material/Inventory";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ClearIcon from "@mui/icons-material/Clear";
import SaveIcon from "@mui/icons-material/Save";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { ChevronLeft, ChevronRight } from "@mui/icons-material";
import { format, isValid } from "date-fns";
import { AppDispatch } from "@/redux/store";

import YenPurchasePage from "../../page";
import DateRangeDialog from "@/components/dateRange";
import VendorSearchAutocomplete from "@/components/vendorsearchautocomplete";
import { VendorSearch } from "@/Models/vendor";
import moment from "moment";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ConfirmationDialog from "@/components/confirmationDialog";
import FreightSelectionDialog, { FreightData } from "../../PurchaseOrder/Component/freightSelectionDialog";
import purchaseApi from "@/utils/api";
const customRoundDigit = (value: number): number => Math.round(value * 100) / 100;

// Table Row Component - Same as Approved PO page
const TableRowMemo = React.memo(({
  item,
  index,
  touched,
  errors,
  handleQuantityChange,
  handlePriceChange,
  handleDiscountChange,
  handleExpiryDateChange,
  discountType,
  applyingDiscount,
  poPrice,
}: {
  item: any;
  index: number;
  touched: Record<number, Record<string, boolean>>;
  errors: Record<number, Record<string, string>>;
  handleQuantityChange: (itemId: string, field: string, value: string | number) => void;
  handlePriceChange: (itemId: string, value: string) => void;
  handleDiscountChange: (itemId: string, field: "befTaxDiscount" | "afTaxDiscount", value: string) => void;
  handleExpiryDateChange: (itemId: string, value: Date | null) => void;
  discountType: 'before' | 'after';
  applyingDiscount: boolean;
  poPrice: number;
}) => {
  const [localGrnValue, setLocalGrnValue] = useState<string>(
    item.grnPrice !== undefined && item.grnPrice !== null ? String(item.grnPrice) : String(poPrice || '')
  );

  useEffect(() => {
    setLocalGrnValue(
      item.grnPrice !== undefined && item.grnPrice !== null ? String(item.grnPrice) : String(poPrice || '')
    );
  }, [item.itemId, item.grnPrice, poPrice]);

  const receivedQty = Number(item.receivedQuantity) || 0;
  const grnPriceNum = Number(item.grnPrice) || poPrice || 0;
  const befDiscount = Number(item.befTaxDiscount) || 0;
  const aftDiscount = Number(item.afTaxDiscount) || 0;
  const taxPercent = Number(item.taxPercentage) || 0;

  const totalPrice = receivedQty * grnPriceNum;
  const befDiscountAmt = totalPrice * (befDiscount / 100);
  const taxableAmt = totalPrice - befDiscountAmt;
  const taxAmt = taxableAmt * (taxPercent / 100);
  const afterTaxAmt = taxableAmt + taxAmt;
  const aftDiscountAmt = afterTaxAmt * (aftDiscount / 100);
  const itemTotal = afterTaxAmt - aftDiscountAmt;

  return (
    <TableRow>
      <TableCell className='table-number-right'>{index + 1}</TableCell>
      <TableCell>{item.itemName}</TableCell>
      <TableCell>{item.uom || "Nos"}</TableCell>
      <TableCell className='table-number-right'>{item.pendingTotalQuantity || 0}</TableCell>
      <TableCell className='table-number-right'>{item.poQuantity || 0}</TableCell>
      <TableCell className='table-number-right'>
        <TextField
          type="number"
          autoComplete="off"
          value={item.receivedQuantity ?? ""}
          onChange={(e) => handleQuantityChange(item.itemId, "receivedQuantity", e.target.value)}
          inputProps={{ step: "0.001", min: "0" }}
          sx={{ width: "100px" }}
          error={touched[index]?.receivedQuantity && !!errors[index]?.receivedQuantity}
          helperText={touched[index]?.receivedQuantity && errors[index]?.receivedQuantity}
        />
      </TableCell>
      <TableCell className='table-number-right'>{poPrice}</TableCell>
      <TableCell className='table-number-right'>
        <TextField
          type="number"
          autoComplete="off"
          value={localGrnValue}
          onChange={(e) => {
            setLocalGrnValue(e.target.value);
            handlePriceChange(item.itemId, e.target.value);
          }}
          inputProps={{ step: "0.01" }}
          sx={{ width: "100px" }}
          placeholder="Enter price"
        />
      </TableCell>
      <TableCell className='table-number-right'>{taxableAmt.toFixed(2)}</TableCell>
      <TableCell className='table-number-right'>
        <TextField
          autoComplete="off"
          type="number"
          value={item.befTaxDiscount === 0 ? "" : item.befTaxDiscount}
          onChange={(e) => handleDiscountChange(item.itemId, "befTaxDiscount", e.target.value)}
          inputProps={{ step: "0.01" }}
          sx={{ width: "80px" }}
          disabled={discountType === 'after' || applyingDiscount}
        />
      </TableCell>
      <TableCell className='table-number-right'>
        <TextField
          autoComplete="off"
          type="number"
          value={item.afTaxDiscount === 0 ? "" : item.afTaxDiscount}
          onChange={(e) => handleDiscountChange(item.itemId, "afTaxDiscount", e.target.value)}
          inputProps={{ step: "0.01" }}
          sx={{ width: "80px" }}
          disabled={discountType === 'before' || applyingDiscount}
        />
      </TableCell>
      <TableCell className='table-number-right'>{taxPercent}%</TableCell>
      <TableCell>
        <TextField
          label="Expiry Date"
          type="date"
          value={item.expiryDate && isValid(item.expiryDate) ? format(item.expiryDate, 'yyyy-MM-dd') : ''}
          onChange={(e) => handleExpiryDateChange(item.itemId, e.target.value ? new Date(e.target.value) : null)}
          InputLabelProps={{ shrink: true }}
        />
      </TableCell>
      <TableCell className='table-number-right'>{itemTotal.toFixed(2)}</TableCell>
    </TableRow>
  );
});
TableRowMemo.displayName = "TableRowMemo";

const HoldGrnPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    holdGrns,
    holdGrnTotalItems,
    loading,
    snackbarMessageGRN,
    snackbarOpenGRN,
  } = useSelector(selectGrn);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(50);
  const [selectedVendor, setSelectedVendor] = useState<VendorSearch | null>(null);
  const [selectionRange, setSelectionRange] = useState({
    startDate: new Date(),
    endDate: new Date(),
    key: "selection",
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedGrn, setSelectedGrn] = useState<any>(null);
  const [updatedItems, setUpdatedItems] = useState<any[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(null);
  const [grnDate, setGrnDate] = useState<Date | null>(null);
  const [roundOffAmount, setRoundOffAmount] = useState(0);
  const [overallDiscountAmount, setOverallDiscountAmount] = useState(0);
  const [discountType, setDiscountType] = useState<'before' | 'after'>('after');
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [touched, setTouched] = useState<Record<number, Record<string, boolean>>>({});
  const [errors, setErrors] = useState<any>({});
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [freights, setFreights] = useState<FreightData[]>([]);
  const [receivingLocation, setReceivingLocation] = useState<any>(null);
  const [openFreightDialog, setOpenFreightDialog] = useState(false);

  // Fetch on mount
  useEffect(() => {
    dispatch(fetchHoldGrns({ page: 1, size: pageSize }));
  }, [dispatch, pageSize]);

  const handleFilter = () => {
    dispatch(
      fetchHoldGrns({
        page: 1,
        size: pageSize,
        vendorName: selectedVendor?.vendorName || "",
        fromDate: moment(selectionRange.startDate).startOf("day").toDate(),
        toDate: moment(selectionRange.endDate).endOf("day").toDate(),
      })
    );
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSelectedVendor(null);
    setSelectionRange({ startDate: new Date(), endDate: new Date(), key: "selection" });
    dispatch(fetchHoldGrns({ page: 1, size: pageSize }));
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    dispatch(
      fetchHoldGrns({
        page: newPage,
        size: pageSize,
        vendorName: selectedVendor?.vendorName || "",
      })
    );
  };

  const handleApprove = async (grnId: string) => {
    setApprovingId(grnId);
    try {
      await dispatch(approveHoldGrn(grnId)).unwrap();
      setSnackbarMessage("Hold GRN approved! Now visible in GRN List.");
      setSnackbarOpen(true);
      dispatch(fetchHoldGrns({ page: currentPage, size: pageSize }));
      setOpenDialog(false);
      setSelectedGrn(null);
    } catch (err: any) {
      setSnackbarMessage(err || "Failed to approve Hold GRN");
      setSnackbarOpen(true);
    } finally {
      setApprovingId(null);
    }
  };

  // Handle View Details
  const handleViewDetails = (grn: any) => {
    setSelectedGrn(grn);

    const grnItems = grn.itemDetails || [];
    const initializedItems = grnItems.map((item: any, idx: number) => ({
      ...item,
      itemId: item.itemId || `item_${idx}`,
      receivedQuantity: item.receivedQuantity || 0,
      grnPrice: item.grnPrice || item.unitPrice || 0,
      newPrice: item.existingPrice || item.newPrice || item.poPrice || 0,
      befTaxDiscount: item.befTaxDiscount || 0,
      afTaxDiscount: item.afTaxDiscount || 0,
      taxPercentage: item.purchasetaxName || item.taxPercentage || 0,
      taxType: item.taxType || 'cgst_sgst',
      expiryDate: item.expiryDate ? new Date(item.expiryDate) : null,
      pendingTotalQuantity: item.pendingTotalQuantity || 0,
      poQuantity: item.poQuantity || item.quantity || 0,
      uom: item.uom || "Nos",
      status: item.status || "Pending",
    }));
    setUpdatedItems(initializedItems);

    setInvoiceNumber(grn.invoiceNo || "");
    setInvoiceDate(grn.invoiceDate ? new Date(grn.invoiceDate) : new Date());
    setGrnDate(grn.grnDate ? new Date(grn.grnDate) : new Date());
    setRoundOffAmount(grn.grnRoundOffAmount || 0);
    setFreights(grn.freights || []);
    setOverallDiscountAmount(0);
    setDiscountType('after');

    setReceivingLocation({
      locationId: grn.locationId || "WH001",
      branchName: grn.receivingLocation || "Production WH-Main",
    });

    setOpenDialog(true);
  };

  // Calculate items
  const calculatedItems = useMemo(() => {
    if (!updatedItems.length) return [];
    return updatedItems.map((item) => {
      const receivedQuantity = Number(item.receivedQuantity) || 0;
      const grnPrice = item.grnPrice !== undefined ? item.grnPrice : (item.newPrice || 0);
      const taxPercentage = item.taxPercentage || 0;
      const befTaxDiscount = Number(item.befTaxDiscount) || 0;
      const afTaxDiscount = Number(item.afTaxDiscount) || 0;

      if (receivedQuantity === 0) {
        return { ...item, calculatedTaxableAmount: 0, calculatedTaxAmount: 0, calculatedFinalPrice: 0 };
      }

      const baseAmount = receivedQuantity * grnPrice;
      const discountAmountBeforeTax = customRoundDigit(baseAmount * (befTaxDiscount / 100));
      const taxableAmount = customRoundDigit(baseAmount - discountAmountBeforeTax);
      const taxAmount = customRoundDigit(taxableAmount * (taxPercentage / 100));
      const afterTaxAmount = customRoundDigit(taxableAmount + taxAmount);
      const discountAmountAfterTax = customRoundDigit(afterTaxAmount * (afTaxDiscount / 100));
      const finalPrice = customRoundDigit(afterTaxAmount - discountAmountAfterTax);

      return {
        ...item,
        calculatedTaxableAmount: taxableAmount,
        calculatedTaxAmount: taxAmount,
        calculatedFinalPrice: finalPrice,
      };
    });
  }, [updatedItems]);

  // Calculate tax details
  const taxDetails = useMemo(() => {
    const details: Record<string, { amount: number; percentage: number; type: string }> = {};
    calculatedItems.forEach((item) => {
      const taxAmount = item.calculatedTaxAmount || 0;
      const taxPercentage = item.taxPercentage || 0;
      const taxType = item.taxType;
      if (taxType === "igst") {
        const key = `igst-${taxPercentage}`;
        if (details[key]) details[key].amount += taxAmount;
        else details[key] = { amount: taxAmount, percentage: taxPercentage, type: "IGST" };
      } else if (taxType === "cgst_sgst") {
        const sgstKey = `sgst-${taxPercentage / 2}`;
        const cgstKey = `cgst-${taxPercentage / 2}`;
        if (details[sgstKey]) details[sgstKey].amount += taxAmount / 2;
        else details[sgstKey] = { amount: taxAmount / 2, percentage: taxPercentage / 2, type: "SGST" };
        if (details[cgstKey]) details[cgstKey].amount += taxAmount / 2;
        else details[cgstKey] = { amount: taxAmount / 2, percentage: taxPercentage / 2, type: "CGST" };
      }
    });
    return details;
  }, [calculatedItems]);

  // Calculate totals
  const totalOrderAmount = useMemo(() => {
    const itemsTotal = customRoundDigit(calculatedItems.reduce((sum, item) => sum + (item.calculatedFinalPrice || 0), 0));
    const freightTotal = customRoundDigit(freights.reduce((sum, f) => sum + (f.totalAmt || 0), 0));
    return itemsTotal + freightTotal;
  }, [calculatedItems, freights]);

  const freightTotalAmount = useMemo(() => freights.reduce((sum, f) => sum + (f.totalAmt || 0), 0), [freights]);
  const freightTaxTotal = useMemo(() => freights.reduce((sum, f) => sum + (f.tAmt || 0), 0), [freights]);

  const finalTotalAmount = totalOrderAmount + roundOffAmount;
  const totalTaxAmount = useMemo(() => Object.values(taxDetails).reduce((sum, tax: any) => sum + tax.amount, 0), [taxDetails]);

  // Handlers
  const handleQuantityChange = (itemId: string, field: string, value: string | number) => {
    setUpdatedItems(prev => prev.map(item =>
      item.itemId === itemId ? { ...item, [field]: Number(value) || 0 } : item
    ));
  };

  const handlePriceChange = (itemId: string, value: string) => {
    setUpdatedItems(prev => prev.map(item =>
      item.itemId === itemId ? { ...item, grnPrice: value === "" ? undefined : Number(value) } : item
    ));
  };

  const handleDiscountChange = (itemId: string, field: "befTaxDiscount" | "afTaxDiscount", value: string) => {
    setUpdatedItems(prev => prev.map(item =>
      item.itemId === itemId ? { ...item, [field]: value === "" ? 0 : Number(value) } : item
    ));
  };

  const handleExpiryDateChange = (itemId: string, value: Date | null) => {
    setUpdatedItems(prev => prev.map(item =>
      item.itemId === itemId ? { ...item, expiryDate: value } : item
    ));
  };

  const handleRoundOffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRoundOffAmount(e.target.value === '' ? 0 : Number(e.target.value));
  };

  const handleGrnApproveFromDialog = () => {
    setOpenConfirmDialog(true);
  };

  const handleConfirmApprove = () => {
    if (selectedGrn) {
      handleApprove(selectedGrn.grnId);
      setOpenConfirmDialog(false);
    }
  };

const handleDownloadPDF = async (grn: any) => {
  try {

    const poId =
      grn.purchaseOrderId ||
      grn.purchaseorderId ||
      grn.poId;

    if (!poId) {
      setSnackbarMessage("Purchase Order ID not found");
      setSnackbarOpen(true);
      return;
    }

    await dispatch(downloadHoldGrnPDF(poId)).unwrap();

  } catch (error: any) {
    console.error(error);

    setSnackbarMessage(
      error || "Failed to download PDF"
    );

    setSnackbarOpen(true);
  }
};

  const handleViewStockLogs = (grn: any) => {
    setSnackbarMessage(`Stock logs for GRN: ${grn.randomId || grn.grnId}`);
    setSnackbarOpen(true);
  };

  // Number of columns for colSpan (matches approved PO page: 12 empty + label + value = 14 total)
  const TABLE_COLS = 14;
  const SUMMARY_LABEL_COL = TABLE_COLS - 2; // 12 empty cells before label

  if (loading && (!holdGrns || holdGrns.length === 0)) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <YenPurchasePage />
      <Box sx={{ px: 1, backgroundColor: "white" }}>
        {/* Tab Buttons */}
        <Box display="flex" alignItems="center" mb={1} mt={1} ml={1}>
          <Link href={"/yen-purchase/GrnPage"}>
            <Button variant="contained" color="primary" sx={{ mr: 1 }}>
              GRN List
            </Button>
          </Link>
          <Button variant="contained" sx={{ backgroundColor: "white", color: "black", mr: 1 }}>
            Hold GRN
          </Button>
          <Link href={"/yen-purchase/GrnPage/GrnReturn"}>
            <Button variant="contained" color="primary" sx={{ mr: 1 }}>
              Return GRN
            </Button>
          </Link>
        </Box>

        {/* Filters */}
        <Grid container alignItems="center" spacing={0.5} wrap="nowrap" ml={0.5} mb={1}>
          <Grid item>
            <DateRangeDialog selectionRange={selectionRange} setSelectionRange={setSelectionRange} onApply={handleFilter} />
          </Grid>
          <Grid item xs={2}>
            <VendorSearchAutocomplete value={selectedVendor} onChange={(v) => setSelectedVendor(v)} label="All Vendors" />
          </Grid>
<Grid item>
  <Box
    display="flex"
    flexDirection="column"
    alignItems="center"
    justifyContent="center"
    sx={{ ml: 0.5 }}
  >
    <Box display="flex" alignItems="center">
<Box display="flex" alignItems="center" gap={1}>
  <Box display="flex" flexDirection="column" alignItems="center">
    <IconButton
      color="primary"
      onClick={handleFilter}
      sx={{
        border: "1px solid #1976d2",
      }}
    >
      <FilterAltIcon />
    </IconButton>

    <Typography fontSize="12px">
      Filter
    </Typography>
  </Box>

  <Box display="flex" flexDirection="column" alignItems="center">
    <IconButton
      color="primary"
      onClick={handleClear}
      sx={{
        border: "1px solid #1976d2",
      }}
    >
      <ClearIcon />
    </IconButton>

    <Typography fontSize="12px">
      Clear
    </Typography>
  </Box>
</Box>
    </Box>

  </Box>
</Grid>
        </Grid>

        {/* Table */}
        <TableContainer component={Paper} sx={{ maxHeight: "calc(100vh - 250px)", overflowY: "auto", width: "100%", ml: 1 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell className="table-number-right">S.No</TableCell>
                <TableCell>Order ID</TableCell>
                <TableCell>Vendor Name</TableCell>
                <TableCell>Order Date</TableCell>
                <TableCell>GRN Date</TableCell>
                <TableCell className="table-number-right">Total PO Items</TableCell>
                <TableCell className="table-number-right">Total Price</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!holdGrns || holdGrns.length === 0 ? (
                <TableRow><TableCell colSpan={9} align="center">No Hold GRN data available</TableCell></TableRow>
              ) : (
                holdGrns.map((grn, index) => (
                  <TableRow key={grn.grnId}>
                    <TableCell className="table-number-right">{(currentPage - 1) * pageSize + index + 1}</TableCell>
                    <TableCell>{grn.randomId || grn.grnId}</TableCell>
                    <TableCell>{grn.vendorName}</TableCell>
                    <TableCell>{grn.grnDate ? format(new Date(grn.grnDate), "dd-MM-yyyy") : "-"}</TableCell>
                   <TableCell>
  {grn.grnDate
    ? format(new Date(grn.grnDate), "dd-MM-yyyy")
    : "-"}
</TableCell>
                    <TableCell className="table-number-right">
  {grn.itemDetails?.reduce(
    (total: number, item: any) =>
      total + (Number(item.receivedQuantity) || 0),
    0
  ) || 0}
</TableCell>
                    <TableCell className="table-number-right">{customRoundDigit(grn.grnAmount || 0).toFixed(2)}</TableCell>
                    <TableCell>HOLD GRN</TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={0.5}>
                        <Tooltip title="View Details">
                          <IconButton onClick={() => handleViewDetails(grn)} color="primary" size="small">
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
  <IconButton
    onClick={() => handleDownloadPDF(grn)}
    color="primary"
    size="small"
  >
    <PictureAsPdfIcon fontSize="small" />
  </IconButton>
</Tooltip>
                        <Tooltip title="View Stock & Price Update History">
                          <IconButton onClick={() => handleViewStockLogs(grn)} color="info" size="small">
                            <InventoryIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box sx={{ display: "flex", justifyContent: "end", alignItems: "center", mt: 1 }}>
          <IconButton onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="body1" sx={{ mx: 2 }}>Page {currentPage}</Typography>
          <IconButton onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage * pageSize >= holdGrnTotalItems}>
            <ChevronRight />
          </IconButton>
        </Box>

        {/* ─────────────────────────────────────────────────────────────────
            DIALOG — Matches Approved PO page layout exactly
        ───────────────────────────────────────────────────────────────── */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          fullWidth={true}
          fullScreen={isFullScreen}
          container={document.body}
          disablePortal={false}
          sx={isFullScreen ? {
            '& .MuiDialog-container': {
              position: 'fixed !important',
              top: '0 !important',
              left: '0 !important',
              right: '0 !important',
              bottom: '0 !important',
              width: '100vw !important',
              height: '100vh !important',
              maxWidth: 'none !important',
              maxHeight: 'none !important',
              margin: '0 !important',
              zIndex: 9999,
            },
            '& .MuiDialog-paper': {
              width: '100vw !important',
              height: '100vh !important',
              maxWidth: 'none !important',
              maxHeight: 'none !important',
              margin: '0 !important',
              borderRadius: '0 !important',
            }
          } : {}}
          PaperProps={{
            style: {
              height: isFullScreen ? '100vh' : 'auto',
              width: isFullScreen ? '100vw' : '90vw',
              maxWidth: isFullScreen ? 'none' : 'none',
              margin: isFullScreen ? 0 : 'auto',
              borderRadius: isFullScreen ? 0 : undefined,
            },
          }}
        >
          {/* ── Dialog Title — same pattern as Approved PO ── */}
          <DialogTitle sx={{
            fontWeight: 'bold',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: isFullScreen ? '16px 24px' : '16px',
          }}>
            <span>GRN Details - {selectedGrn?.randomId || selectedGrn?.grnId}</span>
            <span>Vendor Name: {selectedGrn?.vendorName || 'Unknown Vendor'}</span>
            <IconButton onClick={() => setIsFullScreen(!isFullScreen)} color="primary" edge="end">
              {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{
            padding: isFullScreen ? '0 24px 24px' : '24px',
            display: 'flex',
            flexDirection: 'column',
            height: isFullScreen ? 'calc(100vh - 64px)' : 'auto',
            overflow: 'hidden',
          }}>

            {/* ── Header fields row — same as Approved PO ── */}
            <Box display="flex" gap={2} mt={1} mb={2} sx={{ flexShrink: 0 }}>
              <TextField
                label="Invoice Number"
                value={invoiceNumber}
                disabled
                autoComplete="off"
              />
              <TextField
                label="Invoice Date"
                type="date"
                value={invoiceDate ? format(invoiceDate, 'yyyy-MM-dd') : ''}
                disabled
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="GRN Date"
                type="date"
                value={grnDate ? format(grnDate, 'yyyy-MM-dd') : ''}
                disabled
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                label="Receiving Location"
                value={receivingLocation?.branchName || "Production WH-Main"}
                disabled
              />
            </Box>

            {/* ── Items + Summary Table (inline rows — same as Approved PO) ── */}
            <TableContainer component={Paper} sx={{ flex: 1, overflow: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell className='table-number-right'>S.No</TableCell>
                    <TableCell>Item Name</TableCell>
                    <TableCell>Uom</TableCell>
                    <TableCell className='table-number-right'>Pending Qty</TableCell>
                    <TableCell className='table-number-right'>Total Qty</TableCell>
                    <TableCell className='table-number-right'>Received Qty</TableCell>
                    <TableCell className='table-number-right'>PO Price</TableCell>
                    <TableCell className='table-number-right'>GRN Price</TableCell>
                    <TableCell className='table-number-right'>Taxable Amt</TableCell>
                    <TableCell className='table-number-right'>BefTax Discount</TableCell>
                    <TableCell className='table-number-right'>AfTax Discount</TableCell>
                    <TableCell className='table-number-right'>Tax</TableCell>
                    <TableCell>Expiry Date</TableCell>
                    <TableCell className='table-number-right'>Item Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {calculatedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={TABLE_COLS} align="center">No items available</TableCell>
                    </TableRow>
                  ) : (
                    calculatedItems
                      .filter(item => item.status !== "Received")
                      .map((item, index) => {
                        const poPrice = item.newPrice || 0;
                        return (
                          <TableRowMemo
                            key={item.itemId}
                            item={item}
                            index={index}
                            touched={touched}
                            errors={errors}
                            handleQuantityChange={handleQuantityChange}
                            handlePriceChange={handlePriceChange}
                            handleDiscountChange={handleDiscountChange}
                            handleExpiryDateChange={handleExpiryDateChange}
                            discountType={discountType}
                            applyingDiscount={applyingDiscount}
                            poPrice={poPrice}
                          />
                        );
                      })
                  )}

                  {/* ── Sub Total row — light green, same as Approved PO ── */}
                  {calculatedItems.length > 0 && (
                    <TableRow sx={{ fontWeight: 'bold', backgroundColor: '#e8f5e8' }}>
                      <TableCell colSpan={SUMMARY_LABEL_COL} />
                      <TableCell><strong>Sub Total :</strong></TableCell>
                      <TableCell className='table-number-right'>
                        {customRoundDigit(
                          calculatedItems
                            .filter(item => item.status !== "Received")
                            .reduce((sum, item) => sum + (item.calculatedTaxableAmount || 0), 0)
                        ).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  )}

                  {/* ── Spacer row ── */}
                  {calculatedItems.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={TABLE_COLS} />
                    </TableRow>
                  )}

                  {/* ── Tax detail rows ── */}
                  {Object.entries(taxDetails).map(([key, tax]: [string, any]) => (
                    <TableRow key={key}>
                      <TableCell colSpan={SUMMARY_LABEL_COL} />
                      <TableCell><strong>{tax.type} ({tax.percentage.toFixed(2)}%):</strong></TableCell>
                      <TableCell className='table-number-right'>{tax.amount.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}

                  {/* ── Freight Amount ── */}
                  <TableRow>
                    <TableCell colSpan={SUMMARY_LABEL_COL} />
                    <TableCell><strong>Freight Amount:</strong></TableCell>
                    <TableCell className='table-number-right'>{freightTotalAmount.toFixed(2)}</TableCell>
                  </TableRow>

                  {/* ── Freight Tax with Add/Edit button — light blue, same as Approved PO ── */}
                  <TableRow sx={{ fontWeight: 'bold', backgroundColor: '#f0f8ff' }}>
                    <TableCell colSpan={SUMMARY_LABEL_COL} />
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <strong>Freight Tax:</strong>
                        <Button
                          variant="outlined"
                          color="primary"
                          onClick={() => setOpenFreightDialog(true)}
                          startIcon={freights.length > 0 ? <EditIcon /> : <AddIcon />}
                          size="small"
                          sx={{ ml: 2 }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell className='table-number-right'>{freightTaxTotal.toFixed(2)}</TableCell>
                  </TableRow>

                  {/* ── Discount row ── */}
                  <TableRow sx={{ fontWeight: 'bold' }}>
                    <TableCell colSpan={SUMMARY_LABEL_COL} />
                    <TableCell><strong>Discount:</strong></TableCell>
                    <TableCell className='table-number-right'>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TextField
                          autoComplete='off'
                          value={overallDiscountAmount === 0 ? '' : overallDiscountAmount}
                          onChange={(e) => setOverallDiscountAmount(Number(e.target.value) || 0)}
                          size="small"
                          type="number"
                          label="₹"
                          inputProps={{ min: '0', max: totalOrderAmount.toString(), step: '0.01' }}
                          sx={{ width: 150 }}
                        />
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontSize: '0.60rem', textAlign: 'center' }}>
                            {discountType === 'before' ? 'Before' : 'After'} Tax
                          </Typography>
                          <Switch
                            checked={discountType === 'after'}
                            onChange={(e) => setDiscountType(e.target.checked ? 'after' : 'before')}
                            size="small"
                          />
                        </Box>
                        <Tooltip title="Apply Overall Discount">
                          <span>
                            <IconButton
                              onClick={() => setApplyingDiscount(true)}
                              size="small"
                              disabled={applyingDiscount || overallDiscountAmount <= 0}
                              sx={{ color: 'success.main' }}
                            >
                              {applyingDiscount ? <CircularProgress size={20} /> : <SaveIcon />}
                            </IconButton>
                          </span>
                        </Tooltip>
                        {overallDiscountAmount > 0 && (
                          <IconButton
                            onClick={() => setOverallDiscountAmount(0)}
                            size="small"
                            color="error"
                          >
                            <ClearIcon />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>

                  {/* ── Before RoundOff ── */}
                  <TableRow>
                    <TableCell colSpan={SUMMARY_LABEL_COL} />
                    <TableCell><strong>Before RoundOff:</strong></TableCell>
                    <TableCell className='table-number-right'>{totalOrderAmount.toFixed(2)}</TableCell>
                  </TableRow>

                  {/* ── Round Off Amount ── */}
                  <TableRow sx={{ fontWeight: 'bold' }}>
                    <TableCell colSpan={SUMMARY_LABEL_COL} />
                    <TableCell><strong>Round Off Amount:</strong></TableCell>
                    <TableCell className='table-number-right'>
                      <TextField
                        autoComplete='off'
                        value={roundOffAmount === 0 ? '' : roundOffAmount}
                        onChange={handleRoundOffChange}
                        size="small"
                        type="number"
                        label="₹"
                        inputProps={{ min: '-2', max: '2', step: '0.01' }}
                        sx={{ width: 150 }}
                      />
                    </TableCell>
                  </TableRow>

                  {/* ── Tax Amount — light grey, same as Approved PO ── */}
                  <TableRow sx={{
                    backgroundColor: '#f5f5f5',
                    '& td': { fontWeight: 'bold', fontSize: '1.1em' },
                  }}>
                    <TableCell colSpan={SUMMARY_LABEL_COL} />
                    <TableCell><strong>Tax Amount:</strong></TableCell>
                    <TableCell className='table-number-right'>{totalTaxAmount.toFixed(2)}</TableCell>
                  </TableRow>

                  {/* ── Final Amount — light grey, same as Approved PO ── */}
                  <TableRow sx={{
                    backgroundColor: '#f5f5f5',
                    '& td': { fontWeight: 'bold', fontSize: '1.1em' },
                  }}>
                    <TableCell colSpan={SUMMARY_LABEL_COL} />
                    <TableCell><strong>Final Amount:</strong></TableCell>
                    <TableCell
                      className='table-number-right'
                      sx={{ color: finalTotalAmount < 0 ? 'error.main' : 'primary.main' }}
                    >
                      {finalTotalAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Freight Selection Dialog */}
            <FreightSelectionDialog
              open={openFreightDialog}
              onClose={() => setOpenFreightDialog(false)}
              onAddFreights={(newFreights: FreightData[]) => {
                setFreights(newFreights);
                setOpenFreightDialog(false);
              }}
              existingFreights={freights}
            />
          </DialogContent>

          {/* ── Dialog Actions — Cancel + GRN Approved ── */}
          <DialogActions>
            <Box display="flex" justifyContent="flex-end" mt={2}>
              <Button onClick={() => setOpenDialog(false)} color="secondary">
                Cancel
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={handleGrnApproveFromDialog}
                disabled={approvingId === selectedGrn?.grnId}
                startIcon={
                  approvingId === selectedGrn?.grnId
                    ? <CircularProgress size={16} />
                    : <CheckCircleIcon />
                }
                sx={{ ml: 1 }}
              >
                GRN Approved
              </Button>
            </Box>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          open={openConfirmDialog}
          onClose={() => setOpenConfirmDialog(false)}
          onConfirm={handleConfirmApprove}
          title="Confirm GRN Approval"
          description="Are you sure you want to approve this GRN? This will move it from Hold GRN to GRN List."
          confirmText="GRN Approved"
          cancelText="Cancel"
        />

        {/* Snackbars */}
        <Snackbar open={snackbarOpen} message={snackbarMessage} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)} />
        <Snackbar open={snackbarOpenGRN} message={snackbarMessageGRN} autoHideDuration={3000} onClose={() => dispatch(clearSnackbarMessage())} />
      </Box>
    </Box>
  );
};

export default HoldGrnPage;