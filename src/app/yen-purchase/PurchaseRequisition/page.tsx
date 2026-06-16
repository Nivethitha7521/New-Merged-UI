"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Chip, IconButton,
  TextField, InputAdornment, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, CircularProgress, Checkbox,
  Snackbar, Alert
} from "@mui/material";
import FilterAltIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import { useRouter } from "next/navigation";
import SearchIcon       from "@mui/icons-material/Search";
import VisibilityIcon   from "@mui/icons-material/Visibility";
import AutoAwesomeIcon  from "@mui/icons-material/AutoAwesome";

import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import CheckCircleIcon  from "@mui/icons-material/CheckCircle";
import InventoryIcon    from "@mui/icons-material/Inventory";
import YenPurchasePage  from "../page";
import purchaseApi      from "@/utils/api";

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

interface LowStockItem {
  randomId:             string;
  itemName:             string;
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
}

interface Summary {
  totalLowStockItems:        number;
  notGenerated:              number;
  prGenerated:               number;
  prApproved:                number;
  convertedToPO:             number;
  closed:                    number;
  totalSuggestedPurchaseQty: number;
}

// ─── Tab Config ───────────────────────────────────────────────────────────────

const TABS = [
  { label: "LOW STOCK",       prStatus: "NOT_GENERATED"   },
  { label: "PR GENERATED",    prStatus: "GENERATED"       },
  { label: "PR APPROVED",     prStatus: "APPROVED"        },
  { label: "CONVERTED TO PO", prStatus: "CONVERTED_TO_PO" },
  { label: "CLOSED",          prStatus: "CLOSED"          },
] as const;

// ─── Risk Badge ───────────────────────────────────────────────────────────────

const RiskBadge = ({ risk }: { risk: string }) => {
  const colorMap: Record<string, string> = {
    LOW:    "#16a34a",
    MEDIUM: "#d97706",
    HIGH:   "#dc2626",
  };
  return (
    <Chip
      label={risk}
      size="small"
      sx={{
        backgroundColor: colorMap[risk] || "#6b7280",
        color:      "#fff",
        fontWeight: "bold",
        fontSize:   "11px",
        height:     "22px",
      }}
    />
  );
};

// ─── AI Recommendation Dialog ─────────────────────────────────────────────────

const AiRecommendationDialog = ({
  open, onClose, item,
}: {
  open: boolean; onClose: () => void; item: LowStockItem | null;
}) => {
  const rec = item?.aiRecommendation;

  // Check if real AI explanation exists
  const hasRealAiExplanation =
    rec?.aiExplanation &&
    rec.aiExplanation.trim() !== "" &&
    rec.aiExplanation.toLowerCase() !== "no response" &&
    rec.aiExplanation.toLowerCase() !== "none";

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: "bold", display: "flex", alignItems: "center", gap: 1 }}>
        <AutoAwesomeIcon sx={{ color: "#7c3aed" }} />
        AI Vendor Recommendation
      </DialogTitle>
      <DialogContent dividers>
        {!rec ? (
          <Typography color="text.secondary">
            No recommendation available yet. It will appear once vendor analytics are computed.
          </Typography>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>

            {/* Item */}
            <Box sx={{ p: 1.5, bgcolor: "#f9fafb", borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">Item</Typography>
              <Typography fontWeight="bold">{item?.itemName}</Typography>
              <Typography variant="body2" color="text.secondary">
                Current Stock: {item?.currentStock} {item?.uom} | Suggested: {item?.suggestedPurchaseQty} {item?.uom}
              </Typography>
            </Box>

            {/* Vendor */}
            <Box sx={{ p: 1.5, bgcolor: "#eff6ff", borderRadius: 1, border: "1px solid #bfdbfe" }}>
              <Typography variant="caption" color="text.secondary">Recommended Vendor</Typography>
              <Typography fontWeight="bold" fontSize="1.1rem">{rec.vendorName}</Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                <Chip label={`Score: ${rec.vendorScore}`} size="small" color="primary" />
                <RiskBadge risk={rec.risk} />
                <Chip label={rec.reliability} size="small" variant="outlined" />
              </Box>
            </Box>

            {/* Pricing */}
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
              {[
                { label: "Average Price", value: `₹${rec.averagePrice}` },
                { label: "Latest Price",  value: `₹${rec.latestPrice}`  },
                { label: "Price Trend",   value: rec.priceTrend          },
                { label: "Total Orders",  value: rec.purchaseCount        },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ p: 1, bgcolor: "#f9fafb", borderRadius: 1 }}>
                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                  <Typography fontWeight="medium">{value}</Typography>
                </Box>
              ))}
            </Box>

            {/* Key Reasons */}
            {rec.reason?.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  KEY REASONS
                </Typography>
                <Box component="ul" sx={{ mt: 0.5, pl: 2, mb: 0 }}>
                  {rec.reason.map((r, i) => (
                    <li key={i}>
                      <Typography variant="body2">{r}</Typography>
                    </li>
                  ))}
                </Box>
              </Box>
            )}

            {/* AI Explanation — shows ONLY if real AI text exists */}
            {hasRealAiExplanation ? (
              <Box sx={{ p: 1.5, bgcolor: "#faf5ff", borderRadius: 1, border: "1px solid #e9d5ff" }}>
                <Typography variant="caption" color="#7c3aed" fontWeight="bold">
                  AI EXPLANATION
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {rec.aiExplanation}
                </Typography>
              </Box>
            ) : (
              <Box sx={{ p: 1.5, bgcolor: "#f9fafb", borderRadius: 1, border: "1px dashed #d1d5db" }}>
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  AI EXPLANATION
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontStyle: "italic" }}>
                  AI explanation is being generated. Please check back in a moment.
                </Typography>
              </Box>
            )}

          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="contained">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const PurchaseRequisitionPage = () => {
  const [activeTab,    setActiveTab]    = useState(0);
  const [items,        setItems]        = useState<LowStockItem[]>([]);
  const [summary,      setSummary]      = useState<Summary | null>(null);
  const [loading,      setLoading]      = useState(false);
  const [searchQuery,  setSearchQuery]  = useState("");
  const [filteredItems, setFilteredItems] = useState<LowStockItem[]>([]);
  const [selectedIds,  setSelectedIds]  = useState<Set<string>>(new Set());
  const [aiDialogItem, setAiDialogItem] = useState<LowStockItem | null>(null);
  const [page,         setPage]         = useState(0);
  const [rowsPerPage,  setRowsPerPage]  = useState(50);
  const [snackbar,     setSnackbar]     = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  const [generatingPR, setGeneratingPR] = useState(false);
  const router = useRouter();
const fetchData = useCallback(async (tabIndex: number) => {
    // Tabs 1+ navigate to separate pages — don't fetch here
    if (tabIndex !== 0) return;
    setLoading(true);
    setSelectedIds(new Set());
    try {
      const prStatus = TABS[tabIndex].prStatus;
      const [listRes, summaryRes] = await Promise.all([
        purchaseApi.get(`/inventory-agent/low-stock-list?pr_status=${prStatus}`),
        purchaseApi.get(`/inventory-agent/low-stock-list/summary`),
      ]);
      setItems(listRes.data?.items || []);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: "Failed to load data", severity: "error" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(activeTab); }, [activeTab, fetchData]);
useEffect(() => {
  setFilteredItems(items);
}, [items]);


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

const handleGenerateSinglePR = async (item: LowStockItem) => {
    setGeneratingPR(true);
    try {
      await purchaseApi.patch(
        `/inventory-agent/pr-status/${item.randomId}?pr_status=GENERATED`
      );
      setSnackbar({
        open: true,
        message: `PR generated for ${item.itemName}. Vendor AI computing in background...`,
        severity: "success",
      });
      fetchData(activeTab);
    } catch {
      setSnackbar({ open: true, message: "Failed to generate PR", severity: "error" });
    } finally {
      setGeneratingPR(false);
    }
  };

  const handleGeneratePR = async () => {
    if (selectedIds.size === 0) {
      setSnackbar({ open: true, message: "Select at least one item", severity: "error" });
      return;
    }
    setGeneratingPR(true);
    try {
      // Sequential — AI server-ஐ parallel-ல் hit பண்ணாதே
      for (const randomId of Array.from(selectedIds)) {
        await purchaseApi.patch(
          `/inventory-agent/pr-status/${randomId}?pr_status=GENERATED`
        );
      }
      setSnackbar({
        open: true,
        message: `PR generated for ${selectedIds.size} items. Vendor AI computing in background...`,
        severity: "success",
      });
      fetchData(activeTab);
    } catch {
      setSnackbar({ open: true, message: "Failed to generate PR", severity: "error" });
    } finally {
      setGeneratingPR(false);
    }
  };

  const prStatusBadge = (status: string) => {
    const map: Record<string, { label: string; color: string; bg: string }> = {
      NOT_GENERATED:   { label: "Not Generated", color: "#d97706", bg: "#fef3c7" },
      GENERATED:       { label: "PR Generated",  color: "#2563eb", bg: "#dbeafe" },
      APPROVED:        { label: "PR Approved",   color: "#16a34a", bg: "#dcfce7" },
      CONVERTED_TO_PO: { label: "Converted",     color: "#7c3aed", bg: "#ede9fe" },
      CLOSED:          { label: "Closed",        color: "#6b7280", bg: "#f3f4f6" },
    };
    const s = map[status] || map.NOT_GENERATED;
    return (
      <Chip label={s.label} size="small"
        sx={{ color: s.color, bgcolor: s.bg, fontWeight: "bold", fontSize: "11px" }} />
    );
  };

  const stockStatusBadge = (item: LowStockItem) => {
    const isAtReorder = item.currentStock === item.reorderLevel;
    return (
      <Chip
        label={isAtReorder ? "At Reorder" : "Low Stock"}
        size="small"
        sx={{
          color:      isAtReorder ? "#b45309" : "#dc2626",
          bgcolor:    isAtReorder ? "#fef3c7" : "#fee2e2",
          fontWeight: "bold",
          fontSize:   "11px",
        }}
      />
    );
  };

  const dashboardCards = [
    { label: "Low Stock Items",    value: summary?.totalLowStockItems ?? 0,        unit: "Items", icon: <ShoppingCartIcon sx={{ color: "#dc2626", fontSize: 36 }} /> },
    { label: "PR Recommended",     value: summary?.notGenerated ?? 0,              unit: "Items", icon: <InventoryIcon    sx={{ color: "#d97706", fontSize: 36 }} /> },
    { label: "PR Already Exists",  value: summary?.prGenerated ?? 0,               unit: "Items", icon: <CheckCircleIcon  sx={{ color: "#16a34a", fontSize: 36 }} /> },
    { label: "Total Suggested Qty",value: summary?.totalSuggestedPurchaseQty ?? 0, unit: "Units", icon: <InventoryIcon    sx={{ color: "#2563eb", fontSize: 36 }} /> },
  ];

  return (
    <Box sx={{ pl: 0, py: 1 }}>
      <YenPurchasePage />

      {/* Tab bar */}
     {/* Tab bar */}
<Box sx={{ display: "flex", gap: 1, px: 2, mb: 2, mt: 1, flexWrap: "wrap" }}>
  {TABS.map((tab, idx) => (
    <Button
      key={tab.label}
      variant={activeTab === idx ? "contained" : "outlined"}
      size="small"
      onClick={() => {
        if (idx === 1) {
          router.push("/yen-purchase/PurchaseRequisition/PRGenerated");
          return;
        }
        if (idx === 2) {
          console.log("Clicked PR Approved");
          router.push("/yen-purchase/PurchaseRequisition/PRApproved");
          return;
        }
        if (idx === 3) {
  router.push("/yen-purchase/PurchaseRequisition/ConvertedToPO");
  return;
}
        setActiveTab(idx);
        setPage(0);
      }}
      sx={{
        fontWeight: activeTab === idx ? "bold" : "normal",
        textTransform: "none",
      }}
    >
      {tab.label}
    </Button>
  ))}
</Box>

      {/* Dashboard cards */}
      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 2, px: 2, mb: 2 }}>
        {dashboardCards.map((card) => (
          <Paper key={card.label} elevation={1} sx={{ p: 2, borderRadius: 2, display: "flex", alignItems: "center", gap: 2 }}>
            {card.icon}
            <Box>
              <Typography variant="body2" color="text.secondary">{card.label}</Typography>
              <Typography variant="h5" fontWeight="bold">{card.value.toLocaleString()}</Typography>
              <Typography variant="caption" color="text.secondary">{card.unit}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

<Box sx={{ display: "flex", alignItems: "center", gap: 1, px: 2, mb: 1.5 }}>

  {/* Search + Filter + Clear — grouped together */}
  <Box sx={{ width: "240px", flexShrink: 0 }}>
    <TextField
      size="small"
      placeholder="Search item, code, vendor..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      sx={{ "& .MuiOutlinedInput-root": { borderRadius: 1.5, fontSize: 13 } }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <SearchIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
    />
  </Box>

  <Button
    variant="contained"
    size="small"
    startIcon={<FilterAltIcon fontSize="small" />}
    onClick={() => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) { setFilteredItems(items); setPage(0); return; }
      setFilteredItems(
        items.filter(
          (i) =>
            i.itemName?.toLowerCase().includes(q) ||
            i.randomId?.toLowerCase().includes(q) ||
            i.aiRecommendation?.vendorName?.toLowerCase().includes(q)
        )
      );
      setPage(0);
    }}
    sx={{ textTransform: "none", borderRadius: 1.5 }}
  >
    Filter
  </Button>

  <Button
    variant="outlined"
    color="error"
    size="small"
    startIcon={<ClearIcon fontSize="small" />}
    onClick={() => { setSearchQuery(""); setFilteredItems(items); setPage(0); }}
    sx={{ textTransform: "none", borderRadius: 1.5 }}
  >
    Clear
  </Button>

  {/* Generate PR — right side push */}
  <Box sx={{ flexGrow: 1 }} />

  {activeTab === 0 && (
    <Button
      variant="contained"
      color="primary"
      size="small"
      disabled={selectedIds.size === 0 || generatingPR}
      onClick={handleGeneratePR}
      startIcon={generatingPR ? <CircularProgress size={16} color="inherit" /> : <InventoryIcon />}
      sx={{ minWidth: "120px", height: "38px", textTransform: "none", fontSize: "12px", px: 1.5 }}
    >
      Generate PR
    </Button>
  )}
</Box>
      {/* Info banner */}
      <Box sx={{ mx: 2, mb: 1.5, p: 1.5, bgcolor: "#eff6ff", borderRadius: 1 }}>
    
        <Typography variant="body2" color="#1d4ed8">
          ℹ️ Items where current stock is below reorder level are shown.
        </Typography>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ mx: 2, maxHeight: "calc(100vh - 420px)", overflow: "auto" }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox size="small"
                  indeterminate={selectedIds.size > 0 && selectedIds.size < filteredItems.length}
                  checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </TableCell>
              <TableCell>S.N.</TableCell>
              <TableCell>Item Name</TableCell>
              <TableCell>Item Code</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell align="right">Current Stock</TableCell>
              <TableCell align="right">Reorder Level</TableCell>
              <TableCell align="right">Target Stock</TableCell>
              <TableCell align="right">Suggested Qty</TableCell>
              <TableCell>Status</TableCell>
              {/* <TableCell>AI Recommendation</TableCell> */}
              <TableCell>PR Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : paginatedItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={12} align="center" sx={{ py: 4, color: "text.secondary" }}>
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              paginatedItems.map((item, idx) => {
                const rec = item.aiRecommendation;
                return (
                  <TableRow key={item.randomId} selected={selectedIds.has(item.randomId)}
                    sx={{ "&:hover": { bgcolor: "#f9fafb" } }}>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" checked={selectedIds.has(item.randomId)}
                        onChange={() => handleSelectOne(item.randomId)} />
                    </TableCell>
                    <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{item.itemName}</TableCell>
                    <TableCell>{item.randomId}</TableCell>
                    <TableCell>{item.warehouseId || "Main Warehouse"}</TableCell>
                    <TableCell align="right" sx={{ color: "#dc2626", fontWeight: "bold" }}>
                      {item.currentStock} {item.uom}
                    </TableCell>
                    <TableCell align="right">{item.reorderLevel} {item.uom}</TableCell>
                   <TableCell align="right" sx={{ color: item.targetStockLevel > 0 ? "inherit" : "text.disabled" }}>
  {item.targetStockLevel > 0 ? `${item.targetStockLevel} ${item.uom}` : "—"}
</TableCell>
                    <TableCell align="right" sx={{ color: "#2563eb", fontWeight: "bold" }}>
                      {item.suggestedPurchaseQty} {item.uom}
                    </TableCell>
                    <TableCell>{stockStatusBadge(item)}</TableCell>

                    {/* AI Recommendation column */}
                    <TableCell>{prStatusBadge(item.prStatus)}</TableCell>
                  <TableCell>
                      <Tooltip title="Generate Purchase Requisition">
                        <span>
                          <IconButton
                            size="small"
                            color="primary"
                            disabled={generatingPR || item.prStatus === "GENERATED"}
                         onClick={() => handleGenerateSinglePR(item)}
                          >
                            {generatingPR ? (
                              <CircularProgress size={14} color="inherit" />
                            ) : (
                              <NoteAddIcon fontSize="small" />
                            )}
                          </IconButton>
                        </span>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

     
{/* Pagination only */}
<Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1, mx: 2, mt: 1 }}>
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

  

      {/* AI Dialog */}
      <AiRecommendationDialog
        open={Boolean(aiDialogItem)}
        onClose={() => setAiDialogItem(null)}
        item={aiDialogItem}
      />

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default PurchaseRequisitionPage;