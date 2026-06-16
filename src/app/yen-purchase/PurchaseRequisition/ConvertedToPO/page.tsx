"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Box, Button, Paper, Typography, TextField, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Tooltip, CircularProgress, TablePagination, MenuItem,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import InventoryIcon from "@mui/icons-material/Inventory";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import TodayIcon from "@mui/icons-material/Today";
import { useRouter } from "next/navigation";
import YenPurchasePage from "../../page";
import purchaseApi from "@/utils/api";

const TABS = [
  { label: "LOW STOCK", path: "/yen-purchase/PurchaseRequisition" },
  { label: "PR GENERATED", path: "/yen-purchase/PurchaseRequisition/PRGenerated" },
  { label: "PR APPROVED", path: "/yen-purchase/PurchaseRequisition/PRApproved" },
  { label: "CONVERTED TO PO", path: "/yen-purchase/PurchaseRequisition/ConvertedToPO" },
  { label: "CLOSED", path: "/yen-purchase/PurchaseRequisition/Closed" },
];

interface ConvertedPO {
  prId: string;
  poId: string;
  orderDate: string | null;
  vendorName: string | null;
  warehouse: string | null;
  itemName: string | null;
  itemCode: string | null;
  requestedQty: number;
  totalItems: number;
  totalQty: number;
  totalAmount: number;
  status: string | null;
  convertedBy: string | null;
  convertedDate: string | null;
}

interface Summary {
  convertedToPO: number;
  totalPOAmount: number;
  totalQuantity: number;
  thisMonth: number;
  today: number;
}

const fmtDate = (d?: string | null) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtMoney = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(n || 0);

const statusColor = (status?: string | null) => {
  if (!status) return "default";
  if (status === "Approved" || status === "Completed") return "success";
  if (status === "Rejected") return "error";
  if (status === "PR Pending") return "warning";
  if (status === "Pending for Approve") return "info";
  return "default";
};

export default function ConvertedToPOPage() {
  const router = useRouter();

  const [rows, setRows] = useState<ConvertedPO[]>([]);
  const [summary, setSummary] = useState<Summary>({
    convertedToPO: 0,
    totalPOAmount: 0,
    totalQuantity: 0,
    thisMonth: 0,
    today: 0,
  });

  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [status, setStatus] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseApi.get("/purchaseorders/pr-converted", {
        params: {
          page: page + 1,
          limit: rowsPerPage,
          search: search || undefined,
          vendorName: vendorName || undefined,
          warehouse: warehouse || undefined,
          status: status || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        },
      });

      setRows(res.data?.data || []);
      setTotal(res.data?.total || 0);
      setSummary(res.data?.summary || {
        convertedToPO: 0,
        totalPOAmount: 0,
        totalQuantity: 0,
        thisMonth: 0,
        today: 0,
      });
    } catch (err) {
      console.error("Failed to fetch converted PO list", err);
      setRows([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage, search, vendorName, warehouse, status, fromDate, toDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const clearFilters = () => {
    setSearch("");
    setVendorName("");
    setWarehouse("");
    setStatus("");
    setFromDate("");
    setToDate("");
    setPage(0);
  };

  const exportCsv = () => {
    const header = [
      "S.No", "PR No", "Item Name", "Item Code", "Warehouse", "Vendor",
      "Requested Qty", "PO No", "PO Date", "PO Amount",
      "Current PO Status", "Converted By", "Converted Date",
    ];

    const body = rows.map((r, i) => [
      page * rowsPerPage + i + 1,
      r.prId,
      r.itemName || "",
      r.itemCode || "",
      r.warehouse || "",
      r.vendorName || "",
      r.requestedQty,
      r.poId,
      fmtDate(r.orderDate),
      r.totalAmount,
      r.status || "",
      r.convertedBy || "",
      fmtDate(r.convertedDate),
    ]);

    const csv = [header, ...body]
      .map((line) => line.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "converted-to-po.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const dashboardCards = useMemo(() => [
    {
      label: "Converted To PO",
      value: summary.convertedToPO,
      unit: "POs",
      icon: <AssignmentTurnedInIcon sx={{ color: "#2563eb", fontSize: 34 }} />,
    },
    {
      label: "Total PO Amount",
      value: fmtMoney(summary.totalPOAmount),
      unit: "Amount",
      icon: <CurrencyRupeeIcon sx={{ color: "#16a34a", fontSize: 34 }} />,
    },
    {
      label: "Total Quantity",
      value: summary.totalQuantity,
      unit: "Units",
      icon: <InventoryIcon sx={{ color: "#7c3aed", fontSize: 34 }} />,
    },
    {
      label: "This Month",
      value: summary.thisMonth,
      unit: "POs",
      icon: <CalendarMonthIcon sx={{ color: "#d97706", fontSize: 34 }} />,
    },
    {
      label: "Today",
      value: summary.today,
      unit: "POs",
      icon: <TodayIcon sx={{ color: "#dc2626", fontSize: 34 }} />,
    },
  ], [summary]);

  return (
    <Box sx={{ pl: 0, py: 1 }}>
      <YenPurchasePage />

      <Box sx={{ display: "flex", gap: 1, px: 2, mb: 2, mt: 1, flexWrap: "wrap" }}>
        {TABS.map((tab, idx) => (
          <Button
            key={tab.label}
            variant={idx === 3 ? "contained" : "outlined"}
            size="small"
            onClick={() => router.push(tab.path)}
            sx={{ fontWeight: idx === 3 ? "bold" : "normal", textTransform: "none" }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      <Box sx={{
        display: "grid",
        gridTemplateColumns: "repeat(5, minmax(150px, 1fr))",
        gap: 2,
        px: 2,
        mb: 2,
      }}>
        {dashboardCards.map((card) => (
          <Paper key={card.label} elevation={1} sx={{ p: 2, borderRadius: 2, display: "flex", gap: 1.5, alignItems: "center" }}>
            {card.icon}
            <Box>
              <Typography variant="body2" color="text.secondary">{card.label}</Typography>
              <Typography fontWeight="bold" fontSize={18}>{card.value}</Typography>
              <Typography variant="caption" color="text.secondary">{card.unit}</Typography>
            </Box>
          </Paper>
        ))}
      </Box>

      <Box sx={{ display: "flex", gap: 1, px: 2, mb: 2, flexWrap: "wrap", alignItems: "center" }}>
        <TextField
          size="small"
          placeholder="Search PR, PO, vendor, item..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          sx={{ width: 280 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
          }}
        />

        <TextField
          size="small"
          label="Warehouse"
          value={warehouse}
          onChange={(e) => { setWarehouse(e.target.value); setPage(0); }}
          sx={{ width: 170 }}
        />

        <TextField
          size="small"
          label="Vendor"
          value={vendorName}
          onChange={(e) => { setVendorName(e.target.value); setPage(0); }}
          sx={{ width: 170 }}
        />

        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(0); }}
          sx={{ width: 190 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="PR Pending">PR Pending</MenuItem>
          <MenuItem value="Pending for Approve">Pending for Approve</MenuItem>
          <MenuItem value="Approved">Approved</MenuItem>
          <MenuItem value="Rejected">Rejected</MenuItem>
          <MenuItem value="PartiallyReceived">PartiallyReceived</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
        </TextField>

        <TextField
          size="small"
          type="date"
          label="From"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
          InputLabelProps={{ shrink: true }}
        />

        <TextField
          size="small"
          type="date"
          label="To"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(0); }}
          InputLabelProps={{ shrink: true }}
        />

        <Button variant="contained" startIcon={<FilterListIcon />} onClick={fetchData}>
          Filter
        </Button>

        <Button variant="outlined" color="error" startIcon={<ClearIcon />} onClick={clearFilters}>
          Clear
        </Button>

        <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={exportCsv}>
          Export
        </Button>
      </Box>

      <TableContainer component={Paper} sx={{ mx: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f5f5f5", "& th": { fontWeight: "bold", whiteSpace: "nowrap" } }}>
              <TableCell>S.No</TableCell>
              <TableCell>PR No</TableCell>
              <TableCell>Item Name</TableCell>
              <TableCell>Item Code</TableCell>
              <TableCell>Warehouse</TableCell>
              <TableCell>Vendor</TableCell>
              <TableCell align="right">Requested Qty</TableCell>
              <TableCell>PO No</TableCell>
              <TableCell>PO Date</TableCell>
              <TableCell align="right">PO Amount</TableCell>
              <TableCell>Current PO Status</TableCell>
              <TableCell>Converted By</TableCell>
              <TableCell>Converted Date</TableCell>
              <TableCell align="center">Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 5 }}>
                  <CircularProgress size={28} />
                </TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={14} align="center" sx={{ py: 4 }}>
                  No PR converted purchase orders found
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => (
                <TableRow key={`${row.prId}-${row.poId}`} hover>
                  <TableCell>{page * rowsPerPage + idx + 1}</TableCell>
                  <TableCell><Chip size="small" label={row.prId || "—"} color="primary" variant="outlined" /></TableCell>
                  <TableCell>{row.itemName || "—"}</TableCell>
                  <TableCell>{row.itemCode || "—"}</TableCell>
                  <TableCell>{row.warehouse || "—"}</TableCell>
                  <TableCell>{row.vendorName || "—"}</TableCell>
                  <TableCell align="right">{row.requestedQty}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{row.poId}</TableCell>
                  <TableCell>{fmtDate(row.orderDate)}</TableCell>
                  <TableCell align="right">{fmtMoney(row.totalAmount)}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={row.status || "—"}
                      color={statusColor(row.status) as any}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{row.convertedBy || "—"}</TableCell>
                  <TableCell>{fmtDate(row.convertedDate)}</TableCell>
                  <TableCell align="center">
                    <Tooltip title="View Purchase Order">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => router.push(`/yen-purchase/PurchaseOrder?randomId=${encodeURIComponent(row.poId)}`)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <TablePagination
          component="div"
          count={total}
          page={page}
          rowsPerPage={rowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50, 100]}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
        />
      </TableContainer>
    </Box>
  );
}