"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// imports-ல் add பண்ணு (file top-ல்):
import YenPurchasePage from "../../page";
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  TextField, InputAdornment, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Checkbox,
  Snackbar, Alert, TablePagination, Select, MenuItem, FormControl,
  InputLabel, Skeleton,
} from "@mui/material";
import Popover from "@mui/material/Popover";
import SearchIcon        from "@mui/icons-material/Search";
import VisibilityIcon    from "@mui/icons-material/Visibility";
import ShoppingCartIcon  from "@mui/icons-material/ShoppingCart";
import DeleteIcon        from "@mui/icons-material/Delete";

import FilterListIcon    from "@mui/icons-material/FilterList";
import CloseIcon         from "@mui/icons-material/Close";
import AssignmentIcon    from "@mui/icons-material/Assignment";
import InventoryIcon     from "@mui/icons-material/Inventory";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import PendingIcon       from "@mui/icons-material/Pending";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import purchaseApi       from "@/utils/api";
import { useRouter }     from "next/navigation";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
// ─── Types ────────────────────────────────────────────────────────────────────

interface AiRecommendation {
  vendorId:      string;
  vendorName:    string;
  vendorScore:   number;
  risk:          string;
  reliability:   string;
  averagePrice:  number;
  latestPrice:   number;
  priceTrend:    string;
  purchaseCount: number;
  reason:        string[];
  aiExplanation: string;
}

interface PRItem {
  randomId:             string;
  itemName:             string;
  itemCode:             string;
  createdPoRandomId?:   string; 
  uom:                  string;
  warehouseId:          string;
  currentStock:         number;
  reorderLevel:         number;
  targetStockLevel:     number;
  suggestedPurchaseQty: number;
  status:               string;
  prStatus:             string;
  aiRecommendation?:    AiRecommendation;
  updatedAt:            string;
  createdAt:            string;
  prNumber?:            string;
}

interface PRSummary {
  totalLowStockItems:        number;
  notGenerated:              number;
  prGenerated:               number;
  prApproved:                number;
  convertedToPO:             number;
  closed:                    number;
  totalSuggestedPurchaseQty: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d);
  return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const calcAmount = (item: PRItem) => {
  const avg = item.aiRecommendation?.averagePrice || 0;
  return avg * item.suggestedPurchaseQty;
};

const todayStr = () => {
  const d = new Date();
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── PR Number Generator ──────────────────────────────────────────────────────

const getPRNumber = (item: PRItem, idx: number) =>
  item.prNumber || `PR-${String(10044 - idx).padStart(5, "0")}`;

// ─── Risk Badge ───────────────────────────────────────────────────────────────

const RiskBadge = ({ risk }: { risk: string }) => {
  const styles: Record<string, { bg: string; color: string }> = {
    LOW:    { bg: "#dcfce7", color: "#14532d" },
    MEDIUM: { bg: "#fef3c7", color: "#92400e" },
    HIGH:   { bg: "#fee2e2", color: "#991b1b" },
  };
  const s = styles[risk] || { bg: "#f3f4f6", color: "#374151" };
  return (
    <Box component="span" sx={{
      px: "8px", py: "2px", borderRadius: "20px",
      fontSize: "11px", fontWeight: 700,
      bgcolor: s.bg, color: s.color, display: "inline-block",
    }}>
      {risk}
    </Box>
  );
};

// ─── View PR Dialog ───────────────────────────────────────────────────────────

const ViewPRDialog = ({
  open, onClose, item, prNumber, onConvertToPO, onMarkConverted, createdPoId,
}: {
  open: boolean; onClose: () => void;
  item: PRItem | null; prNumber: string;
  onConvertToPO: (item: PRItem) => void;
  onMarkConverted: (item: PRItem) => void;  // ← NEW
  createdPoId?: string;                      // ← NEW: PO ID if already created
}) => {
  if (!item) return null;

  const poAlreadyCreated = !!createdPoId;    // ← NEW
  if (!item) return null;
  const rec = item.aiRecommendation;
  const amount = calcAmount(item);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth
      PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        bgcolor: "#1a1a2e", color: "#fff", py: 1.5, px: 2.5,
      }}>
        <Typography fontWeight={600} fontSize={15}>PR Details - {prNumber}</Typography>
        <IconButton size="small" onClick={onClose} sx={{ color: "#fff" }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>

          {/* Item & Request Details */}
          <Box sx={{ p: 2.5, borderRight: "1px solid #f0f0f0" }}>
            <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={1.5}
              sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Item &amp; Request Details
            </Typography>
            {[
              { label: "Item Name",      value: item.itemName },
              { label: "Item Code",      value: item.itemCode || item.randomId },
              { label: "Warehouse",      value: item.warehouseId || "Main Warehouse" },
              { label: "Current Stock",  value: <span style={{ color: "#dc2626", fontWeight: 600 }}>{item.currentStock} {item.uom}</span> },
              { label: "Reorder Level",  value: `${item.reorderLevel} ${item.uom}` },
              { label: "Target Stock",   value: item.targetStockLevel > 0 ? `${item.targetStockLevel} ${item.uom}` : "—" },
              { label: "Requested Qty",  value: <span style={{ color: "#2563eb", fontWeight: 600 }}>{item.suggestedPurchaseQty} {item.uom}</span> },
              { label: "UOM",            value: item.uom },
              { label: "PR Date",        value: fmt(item.updatedAt) },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ display: "flex", justifyContent: "space-between", mb: 1, alignItems: "center" }}>
                <Typography fontSize={12} color="text.secondary">{label}</Typography>
                <Typography fontSize={12} fontWeight={500}>{value}</Typography>
              </Box>
            ))}
          </Box>

          {/* Vendor Details */}
          <Box sx={{ p: 2.5, borderRight: "1px solid #f0f0f0" }}>
            <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={1.5}
              sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Vendor Details
            </Typography>
            {rec ? (
              <>
                {[
                  { label: "Vendor Name",     value: <span style={{ color: "#2563eb", fontWeight: 600 }}>{rec.vendorName}</span> },
                  { label: "Avg. Price",       value: `₹ ${rec.averagePrice.toLocaleString("en-IN")}` },
                  { label: "Latest Price",     value: `₹ ${rec.latestPrice.toLocaleString("en-IN")}` },
                  { label: "Price Trend",      value: <span style={{ color: rec.priceTrend === "STABLE" ? "#16a34a" : rec.priceTrend === "DECREASING" ? "#16a34a" : "#dc2626", fontWeight: 600 }}>{rec.priceTrend}</span> },
                  { label: "Purchase Count",   value: rec.purchaseCount },
                ].map(({ label, value }) => (
                  <Box key={label} sx={{ display: "flex", justifyContent: "space-between", mb: 1, alignItems: "center" }}>
                    <Typography fontSize={12} color="text.secondary">{label}</Typography>
                    <Typography fontSize={12} fontWeight={500}>{value}</Typography>
                  </Box>
                ))}
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, alignItems: "center" }}>
                  <Typography fontSize={12} color="text.secondary">Risk Level</Typography>
                  <RiskBadge risk={rec.risk} />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1, alignItems: "center" }}>
                  <Typography fontSize={12} color="text.secondary">Reliability</Typography>
                  <Typography fontSize={12} fontWeight={500}>{rec.reliability}</Typography>
                </Box>
              </>
            ) : (
              <Typography fontSize={12} color="text.secondary" fontStyle="italic">
                No vendor recommendation yet.
              </Typography>
            )}
          </Box>

          {/* Summary */}
          <Box sx={{ p: 2.5 }}>
            <Typography fontSize={12} fontWeight={600} color="text.secondary" mb={1.5}
              sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Summary
            </Typography>
            {[
              { label: "Item Amount",    value: `₹ ${(rec ? rec.averagePrice * item.suggestedPurchaseQty : 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` },
              { label: "Tax Amount (5%)", value: `₹ ${(rec ? rec.averagePrice * item.suggestedPurchaseQty * 0.05 : 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}` },
              { label: "Discount",       value: "₹ 0.00" },
            ].map(({ label, value }) => (
              <Box key={label} sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography fontSize={12} color="text.secondary">{label}</Typography>
                <Typography fontSize={12}>{value}</Typography>
              </Box>
            ))}
            <Box sx={{ mt: 2, pt: 1.5, borderTop: "1px solid #e5e7eb", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography fontSize={13} fontWeight={600}>Total Amount</Typography>
              <Typography fontSize={15} fontWeight={700} color="#1a1a2e">
                ₹ {(rec ? rec.averagePrice * item.suggestedPurchaseQty * 1.05 : 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

     <DialogActions sx={{ px: 2.5, py: 1.5, gap: 1.5, bgcolor: "#f9fafb", borderTop: "1px solid #e5e7eb" }}>
        {poAlreadyCreated ? (
          // PO was already created — show PO ID and "Mark as Converted" button
          <>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: "#dcfce7", px: 2, py: 1, borderRadius: 1.5 }}>
              <CheckCircleIcon sx={{ color: "#16a34a", fontSize: 18 }} />
              <Typography fontSize={13} fontWeight={600} color="#16a34a">
                PO Created: {createdPoId}
              </Typography>
            </Box>
            <Button
              variant="contained"
              onClick={() => { onMarkConverted(item); onClose(); }}
              startIcon={<ShoppingCartIcon fontSize="small" />}
              sx={{ bgcolor: "#7c3aed", "&:hover": { bgcolor: "#6d28d9" }, borderRadius: 1.5, textTransform: "none", fontWeight: 600, px: 2.5 }}
            >
              Convert to PO
            </Button>
          </>
        ) : (
          // PO not created yet — navigate to create PO page
          <Button
            variant="contained"
            onClick={() => { onConvertToPO(item); onClose(); }}
            startIcon={<ShoppingCartIcon fontSize="small" />}
            sx={{ bgcolor: "#16a34a", "&:hover": { bgcolor: "#15803d" }, borderRadius: 1.5, textTransform: "none", fontWeight: 600, px: 2.5 }}
          >
            Convert to PO
          </Button>
        )}
        <Button
          variant="contained"
          color="error"
          onClick={onClose}
          startIcon={<CloseIcon fontSize="small" />}
          sx={{ borderRadius: 1.5, textTransform: "none", fontWeight: 600, px: 2.5 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Reject Dialog ────────────────────────────────────────────────────────────

const RejectDialog = ({
  open, onClose, onConfirm, prNumber, loading,
}: {
  open: boolean; onClose: () => void;
  onConfirm: () => void; prNumber: string; loading: boolean;
}) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
    PaperProps={{ sx: { borderRadius: 2 } }}>
    <DialogTitle sx={{ fontWeight: 600, fontSize: 15 }}>Reject Purchase Requisition</DialogTitle>
    <DialogContent>
      <Typography fontSize={13} color="text.secondary">
        Are you sure you want to reject <strong>{prNumber}</strong>? This will move the item back to Low Stock for re-processing.
      </Typography>
    </DialogContent>
    <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
      <Button onClick={onClose} variant="outlined" size="small" sx={{ borderRadius: 1.5, textTransform: "none" }}>Cancel</Button>
      <Button onClick={onConfirm} variant="contained" color="error" size="small"
        disabled={loading}
        startIcon={loading ? <CircularProgress size={14} color="inherit" /> : null}
        sx={{ borderRadius: 1.5, textTransform: "none" }}>
        {loading ? "Rejecting..." : "Reject"}
      </Button>
    </DialogActions>
  </Dialog>
);

// ─── Table Skeleton ───────────────────────────────────────────────────────────

const TableSkeleton = () => (
  <>
    {[1, 2, 3, 4, 5].map((i) => (
      <TableRow key={i}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((j) => (
          <TableCell key={j}><Skeleton variant="text" width="80%" /></TableCell>
        ))}
      </TableRow>
    ))}
  </>
);

// ─── Main PR Generated Page ───────────────────────────────────────────────────

const PRGeneratedPage = () => {
  const router = useRouter();
  const [createdPoMap,  setCreatedPoMap]  = useState<Record<string, string>>({});

  const [items,         setItems]         = useState<PRItem[]>([]);
  const [summary,       setSummary]       = useState<PRSummary | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [searchQuery,   setSearchQuery]   = useState("");
const [filteredItems, setFilteredItems] = useState<PRItem[]>([]);
  const [selectedIds,   setSelectedIds]   = useState<Set<string>>(new Set());
  const [page,          setPage]          = useState(0);
  const [rowsPerPage,   setRowsPerPage]   = useState(5);
  const [viewItem,      setViewItem]      = useState<PRItem | null>(null);
  const [rejectItem,    setRejectItem]    = useState<PRItem | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [snackbar,      setSnackbar]      = useState({ open: false, message: "", severity: "success" as "success" | "error" });
const [aiAnchor, setAiAnchor] = useState<HTMLElement | null>(null);

const [selectedAI, setSelectedAI] =
    useState<AiRecommendation | null>(null);
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        purchaseApi.get(`/inventory-agent/low-stock-list?pr_status=GENERATED`),
        purchaseApi.get(`/inventory-agent/low-stock-list/summary`),
      ]);
      setItems(listRes.data?.items || []);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to load PR data", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    setFilteredItems(items);
}, [items]);
  // When returning from PO create page, read the created PO info
  useEffect(() => {
    const prDataRaw = sessionStorage.getItem("prToPO_created");
    if (prDataRaw) {
      try {
        const prData = JSON.parse(prDataRaw);
        if (prData.prRandomId && prData.poRandomId) {
          setCreatedPoMap((prev) => ({
            ...prev,
            [prData.prRandomId]: prData.poRandomId,
          }));
          setSnackbar({
            open: true,
            message: `PO ${prData.poRandomId} created! Open the PR to convert.`,
            severity: "success",
          });
        }
        sessionStorage.removeItem("prToPO_created");
      } catch (e) {
        console.error("Failed to parse prToPO_created", e);
      }
    }
  }, []);




  const paginatedItems = useMemo(
    () => filteredItems.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [filteredItems, page, rowsPerPage]
  );

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(filteredItems.map((i) => i.randomId)) : new Set());
  };

  const handleSelectOne = (randomId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(randomId) ? next.delete(randomId) : next.add(randomId);
      return next;
    });
  };
const handleOpenAI = (
    event: React.MouseEvent<HTMLElement>,
    rec: AiRecommendation
) => {

    setAiAnchor(event.currentTarget);
    setSelectedAI(rec);

};

const handleCloseAI = () => {

    setAiAnchor(null);
    setSelectedAI(null);

};
  // Navigate to existing PO creation page with pre-filled data
  const handleConvertToPO = (item: PRItem) => {
    const rec = item.aiRecommendation;
    sessionStorage.setItem("prToPO", JSON.stringify({
      fromPR:       true,
      prRandomId:   item.randomId,
      itemName:     item.itemName,
      itemCode:     item.itemCode || item.randomId,
      suggestedQty: item.suggestedPurchaseQty,
      uom:          item.uom,
      vendorId:     rec?.vendorId || "",
      vendorName:   rec?.vendorName || "",
      unitPrice:    rec?.averagePrice || 0,
      warehouseId:  item.warehouseId || "",
    }));
    // Navigate to the existing PO create page (pending tab → create button leads here)
    router.push("/yen-purchase/PurchaseOrder/Createpurchase");
  };

  const handleReject = async () => {
    if (!rejectItem) return;
    setRejectLoading(true);
    try {
      await purchaseApi.patch(`/inventory-agent/pr-status/${rejectItem.randomId}?pr_status=NOT_GENERATED`);
      setSnackbar({ open: true, message: `PR rejected — item moved back to Low Stock`, severity: "success" });
      setRejectItem(null);
      fetchData();
    } catch {
      setSnackbar({ open: true, message: "Failed to reject PR", severity: "error" });
    } finally {
      setRejectLoading(false);
    }
  };
// Called when user clicks "Convert to PO" in View Dialog AFTER PO is already created
  const handleMarkConvertedToPO = async (item: PRItem) => {
    try {
      await purchaseApi.patch(
        `/inventory-agent/pr-status/${item.randomId}?pr_status=CONVERTED_TO_PO`
      );
      setSnackbar({ open: true, message: "PR marked as Converted to PO", severity: "success" });
      // Navigate to Approved PO page
      router.push("/yen-purchase/PurchaseOrder/Approvedpo");
    } catch {
      setSnackbar({ open: true, message: "Failed to update PR status", severity: "error" });
    }
  };
  // Dashboard cards data
  const totalQty    = items.reduce((s, i) => s + (i.suggestedPurchaseQty || 0), 0);
  const totalAmount = items.reduce((s, i) => s + calcAmount(i), 0);
  const todayCount  = items.filter((i) => {
    const d = new Date(i.updatedAt);
    const t = new Date();
    return d.getDate() === t.getDate() && d.getMonth() === t.getMonth() && d.getFullYear() === t.getFullYear();
  }).length;

  const dashCards = [
    { label: "PR Generated",     value: items.length,       unit: "Items",    icon: <AssignmentIcon  sx={{ fontSize: 22, color: "#fff" }} />, iconBg: "#7c3aed" },
    { label: "Total Quantity",   value: totalQty,           unit: "Units",    icon: <InventoryIcon   sx={{ fontSize: 22, color: "#fff" }} />, iconBg: "#2563eb" },
    { label: "Total Amount",     value: `₹ ${totalAmount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`, unit: "",  icon: <CurrencyRupeeIcon sx={{ fontSize: 22, color: "#fff" }} />, iconBg: "#16a34a", isRaw: true },
    { label: "Pending Approval", value: items.length,       unit: "Items",    icon: <PendingIcon     sx={{ fontSize: 22, color: "#fff" }} />, iconBg: "#d97706" },
    { label: "Today's PR",       value: todayCount,         unit: "Items",    icon: <CalendarTodayIcon sx={{ fontSize: 22, color: "#fff" }} />, iconBg: "#0891b2" },
  ];

  return (
    <Box sx={{ pl: 0, py: 1 }}>
      <YenPurchasePage />
     
      {/* Tab bar */}
     {/* Tab bar — same style as Low Stock page */}
      <Box sx={{ display: "flex", gap: 1, px: 2, mb: 2, mt: 1, flexWrap: "wrap" }}>
        {[
          { label: "LOW STOCK",       path: "/yen-purchase/PurchaseRequisition",          active: false },
          { label: "PR GENERATED",    path: "/yen-purchase/PurchaseRequisition/PRGenerated", active: true  },
          { label: "PR APPROVED",     path: "#",                                           active: false },
          { label: "CONVERTED TO PO", path: "#",                                           active: false },
          { label: "CLOSED",          path: "#",                                           active: false },
        ].map((tab) => (
          <Button
            key={tab.label}
            variant={tab.active ? "contained" : "outlined"}
            size="small"
            onClick={() => { if (tab.path !== "#") router.push(tab.path); }}
            sx={{ fontWeight: tab.active ? "bold" : "normal", textTransform: "none" }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {/* Dashboard Cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1.5, px: 2, mb: 2 }}>
        {dashCards.map((card) => (
          <Paper key={card.label} elevation={0} sx={{
            p: 2, borderRadius: 2, border: "1px solid #e5e7eb",
            display: "flex", alignItems: "center", gap: 1.5,
          }}>
            <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: card.iconBg,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {card.icon}
            </Box>
            <Box>
              <Typography fontSize={11} color="text.secondary" lineHeight={1.2}>{card.label}</Typography>
              {card.isRaw ? (
                <Typography fontSize={16} fontWeight={700} lineHeight={1.2}>{card.value}</Typography>
              ) : (
                <Typography fontSize={22} fontWeight={700} lineHeight={1.2}>
                  {typeof card.value === "number" ? card.value.toLocaleString() : card.value}
                </Typography>
              )}
              {card.unit && <Typography fontSize={11} color="text.secondary">{card.unit}</Typography>}
            </Box>
          </Paper>
        ))}
      </Box>

      {/* Toolbar */}
      <Box sx={{ display: "flex", gap: 1, px: 2, mb: 1.5, alignItems: "center", flexWrap: "wrap" }}>
<TextField
    size="small"
    placeholder="Search by Item name, code, vendor..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}

    sx={{
        width: "320px",
        minWidth: "320px",
        maxWidth: "320px",
        flex: "0 0 320px"     // ⭐ Important
    }}

    InputProps={{
        startAdornment: (
            <InputAdornment position="start">
                <SearchIcon sx={{ fontSize: 16 }} />
            </InputAdornment>
        )
    }}
/>


        <Button
variant="contained"
size="small"
startIcon={<FilterListIcon fontSize="small" />}
onClick={() => {

    const q = searchQuery.trim().toLowerCase();

    if (!q) {
        setFilteredItems(items);
        return;
    }

    setFilteredItems(
        items.filter((item) =>
            item.itemName?.toLowerCase().includes(q) ||
            item.itemCode?.toLowerCase().includes(q) ||
            item.randomId?.toLowerCase().includes(q) ||
            item.aiRecommendation?.vendorName?.toLowerCase().includes(q)
        )
    );

    setPage(0);

}}
sx={{
borderRadius:1.5,
textTransform:"none",
bgcolor:"#2563eb",
"&:hover":{
bgcolor:"#1d4ed8"
}
}}
>
Filter
</Button>

<Button
variant="outlined"
size="small"
color="error"
startIcon={<CloseIcon />}
onClick={() => {

    setSearchQuery("");

    setFilteredItems(items);

    setPage(0);

}}
sx={{
borderRadius:1.5,
textTransform:"none"
}}
>
Clear
</Button>

    
      </Box>

      {/* Table */}
      <Paper elevation={0} sx={{ mx: 2, borderRadius: 2, border: "1px solid #e5e7eb", overflow: "hidden" }}>
       <TableContainer sx={{ overflow: "auto" }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow sx={{ "& th": { bgcolor: "#f8fafc", fontSize: 12, fontWeight: 600, color: "#374151", py: 1.2 } }}>
                <TableCell padding="checkbox">
                  <Checkbox size="small"
                    indeterminate={selectedIds.size > 0 && selectedIds.size < filteredItems.length}
                    checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </TableCell>
                <TableCell>PR No.</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Item Code</TableCell>
                <TableCell>Warehouse</TableCell>
                <TableCell align="right">Requested Qty</TableCell>
                <TableCell align="center">
  Recommended Vendor
</TableCell>
                <TableCell align="right">Amount (₹)</TableCell>
                <TableCell>PR Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? <TableSkeleton /> :
               paginatedItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 6, color: "text.secondary", fontSize: 13 }}>
                    No PR Generated items found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedItems.map((item, idx) => {
                  const prNum  = getPRNumber(item, page * rowsPerPage + idx);
                  const amount = calcAmount(item);
                  return (
                    <TableRow key={item.randomId} selected={selectedIds.has(item.randomId)}
                      sx={{ "&:hover td": { bgcolor: "#f8fafc" }, "&:last-child td": { borderBottom: 0 } }}>
                      <TableCell padding="checkbox">
                        <Checkbox size="small" checked={selectedIds.has(item.randomId)}
                          onChange={() => handleSelectOne(item.randomId)} />
                      </TableCell>
                      <TableCell>
                        <Typography
                          fontSize={12} fontWeight={600} color="#2563eb"
                          sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
                          onClick={() => setViewItem(item)}
                        >
                          {prNum}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, fontWeight: 500 }}>{item.itemName}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{item.itemCode || item.randomId}</TableCell>
                      <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{item.warehouseId || "Main Warehouse"}</TableCell>
                      <TableCell align="right" sx={{ fontSize: 13, fontWeight: 600 }}>
                        {item.suggestedPurchaseQty} {item.uom}
                      </TableCell>
                    <TableCell>
  {item.aiRecommendation ? (
    <Box
  sx={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: 0.5,
  }}
>
      <Box>
        <Typography fontSize={12} fontWeight={600} color="#2563eb">
          {item.aiRecommendation.vendorName}
        </Typography>

        <Typography fontSize={11} color="text.secondary">
          Score: {item.aiRecommendation.vendorScore} | {item.aiRecommendation.risk}
        </Typography>
      </Box>

      <IconButton
        size="small"
        onClick={(e) => handleOpenAI(e, item.aiRecommendation!)}
      >
        <AutoAwesomeIcon
          sx={{ fontSize: 16, color: "#7c3aed" }}
        />
      </IconButton>
    </Box>
  ) : (
    <Typography
      fontSize={11}
      color="text.secondary"
      fontStyle="italic"
    >
      AI computing...
    </Typography>
  )}
</TableCell>
                      <TableCell align="right" sx={{ fontSize: 13 }}>
                        {amount > 0 ? amount.toLocaleString("en-IN", { maximumFractionDigits: 2 }) : "—"}
                      </TableCell>
                      <TableCell sx={{ fontSize: 12, color: "text.secondary" }}>{fmt(item.updatedAt)}</TableCell>
                      <TableCell>
                        <Box component="span" sx={{
                          px: "10px", py: "3px", borderRadius: "4px",
                          fontSize: "11px", fontWeight: 600,
                          display: "inline-block",
                          ...(item.prStatus === "PO_CREATED"
                            ? { bgcolor: "#dcfce7", color: "#166534" }
                            : { bgcolor: "#dbeafe", color: "#1e40af" }),
                        }}>
                          {item.prStatus === "PO_CREATED" ? "PO CREATED" : "GENERATED"}
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center" }}>
                          <Tooltip title="View Details">
                            <IconButton size="small" onClick={() => setViewItem(item)}
                              sx={{ border: "1px solid #e5e7eb", borderRadius: 1, p: "4px", color: "#374151" }}>
                              <VisibilityIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        
                          <Tooltip title="Convert to Purchase Order">
                            <IconButton size="small" onClick={() => handleConvertToPO(item)}
                              sx={{ border: "1px solid #e5e7eb", borderRadius: 1, p: "4px", color: "#16a34a" }}>
                              <ShoppingCartIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject PR">
                            <IconButton size="small" onClick={() => setRejectItem(item)}
                              sx={{ border: "1px solid #fee2e2", borderRadius: 1, p: "4px", color: "#dc2626" }}>
                              <DeleteIcon sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Footer */}
<Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, px: 2, py: 1, borderTop: "1px solid #e5e7eb", bgcolor: "#f8fafc" }}>
  <IconButton
    size="small"
    disabled={page === 0}
    onClick={() => setPage((p) => p - 1)}
    sx={{ border: "1px solid #e0e0e0", borderRadius: 1, p: 0.5 }}
  >
    <Typography sx={{ px: 0.5, fontSize: 14 }}>‹</Typography>
  </IconButton>

  <Typography sx={{ fontSize: 13, color: "text.secondary", px: 1 }}>
    Page {page + 1} of {Math.max(1, Math.ceil(filteredItems.length / rowsPerPage))}
  </Typography>

  <IconButton
    size="small"
    disabled={page >= Math.ceil(filteredItems.length / rowsPerPage) - 1}
    onClick={() => setPage((p) => p + 1)}
    sx={{ border: "1px solid #e0e0e0", borderRadius: 1, p: 0.5 }}
  >
    <Typography sx={{ px: 0.5, fontSize: 14 }}>›</Typography>
  </IconButton>
</Box>
      </Paper>

      {/* Dialogs */}
      <ViewPRDialog
        open={Boolean(viewItem)} onClose={() => setViewItem(null)}
        item={viewItem}
        prNumber={viewItem ? getPRNumber(viewItem, items.indexOf(viewItem)) : ""}
        onConvertToPO={handleConvertToPO}
        onMarkConverted={handleMarkConvertedToPO}
        createdPoId={viewItem ? createdPoMap[viewItem.randomId] : undefined}
      />

      <RejectDialog
        open={Boolean(rejectItem)} onClose={() => setRejectItem(null)}
        onConfirm={handleReject} loading={rejectLoading}
        prNumber={rejectItem ? getPRNumber(rejectItem, items.indexOf(rejectItem)) : ""}
      />
<Popover
  open={Boolean(aiAnchor)}
  anchorEl={aiAnchor}
  onClose={handleCloseAI}
  anchorOrigin={{
    vertical: "bottom",
    horizontal: "left",
  }}
  transformOrigin={{
    vertical: "top",
    horizontal: "left",
  }}
  PaperProps={{
    sx: {
      width: 360,
      p: 2,
      borderRadius: 3,
      boxShadow: 6,
    },
  }}
>
  {selectedAI && (
    <Box>

      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
        <AutoAwesomeIcon sx={{ color: "#7c3aed" }} />
        <Typography fontWeight={700}>
          AI Vendor Explanation
        </Typography>
      </Box>

      <Typography
        fontWeight={700}
        color="primary"
      >
        {selectedAI.vendorName}
      </Typography>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 0.5 }}
      >
        Score {selectedAI.vendorScore} | Risk {selectedAI.risk}
      </Typography>

      <Box
        sx={{
          mt: 2,
          p: 1.5,
          bgcolor: "#faf5ff",
          borderRadius: 2,
          border: "1px solid #e9d5ff",
        }}
      >
        <Typography
          fontSize={13}
          sx={{ lineHeight: 1.7 }}
        >
          {selectedAI.aiExplanation ||
            "AI explanation is being generated..."}
        </Typography>
      </Box>

    </Box>
  )}
</Popover>
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PRGeneratedPage;