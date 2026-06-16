"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, IconButton, Tooltip, Typography,
  CircularProgress, Chip,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import ShoppingCartCheckoutIcon from "@mui/icons-material/ShoppingCartCheckout";
import { useRouter } from "next/navigation";
import YenPurchasePage from "../../page";
import purchaseApi from "@/utils/api";

const TABS = [
  { label: "LOW STOCK"      },
  { label: "PR GENERATED"   },
  { label: "PR APPROVED"    },
  { label: "CONVERTED TO PO"},
  { label: "CLOSED"         },
];

interface PRPendingPO {
  randomId:           string;
  prSource:           string | null;
  orderDate:          string | null;
  vendorName:         string | null;
  totalItems:         number;
  pendingOrderAmount: number;
}

const PRApprovedPage = () => {
  const router = useRouter();
  const [rows,       setRows]       = useState<PRPendingPO[]>([]);
  const [loading,    setLoading]    = useState(false);
  const [converting, setConverting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await purchaseApi.get("/purchaseorders/pr-pending");
      setRows(res.data?.data ?? []);
    } catch (err) {
      console.error("Failed to fetch PR Pending orders:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleConvert = async (randomId: string) => {
  setConverting(randomId);
  try {
    await purchaseApi.patch(
      `/purchaseorders/pr-pending-convert`,
      {},
      { params: { random_id: randomId } }   // ← query param-ஆ அனுப்பு
    );
    setRows((prev) => prev.filter((r) => r.randomId !== randomId));
  } catch (err) {
    console.error("Failed to convert:", err);
  } finally {
    setConverting(null);
  }
};

  const handleView = (randomId: string) => {
    // உன் existing PO view — route or dialog எப்படி use பண்றே அப்படியே
    router.push(`/yen-purchase/PurchaseOrder?randomId=${randomId}`);
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      });
    } catch { return "—"; }
  };

  const formatAmount = (amt: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR", maximumFractionDigits: 2,
    }).format(amt ?? 0);

  return (
    <Box sx={{ pl: 0, py: 1 }}>
      <YenPurchasePage />

      {/* Tab bar — same as PRGenerated page style */}
      <Box sx={{ display: "flex", gap: 1, px: 2, mb: 2, mt: 1, flexWrap: "wrap" }}>
        {TABS.map((tab, idx) => (
          <Button
            key={tab.label}
            variant={idx === 2 ? "contained" : "outlined"}
            size="small"
            onClick={() => {
              if (idx === 0) router.push("/yen-purchase/PurchaseRequisition");
              if (idx === 1) router.push("/yen-purchase/PurchaseRequisition/PRGenerated");
              if (idx === 2) return; // already here
              if (idx === 3) {
  router.push("/yen-purchase/PurchaseRequisition/ConvertedToPO");
  return;
}
              // idx 3,4 → implement later
            }}
            sx={{ fontWeight: idx === 2 ? "bold" : "normal", textTransform: "none" }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <CircularProgress />
        </Box>
      ) : rows.length === 0 ? (
        <Box display="flex" justifyContent="center" mt={6}>
          <Typography color="text.secondary">
            No Purchase Orders pending approval from PR flow.
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ mx: 2, mt: 1 }}>
          <Table size="small">
           <TableHead>
  <TableRow
    sx={{
      backgroundColor: "#000",
      "& th": {
        backgroundColor: "#000",
        color: "#0d0c0c",
        fontWeight: "bold",
        whiteSpace: "nowrap",
        borderBottom: "none",
      },
    }}
  >
    {[
      "S.No",
      "PR ID",
      "Order ID",
      "Order Date",
      "Vendor Name",
      "Total PO Items",
      "Total Price",
      "Actions",
    ].map((h) => (
      <TableCell key={h}>
        {h}
      </TableCell>
    ))}
  </TableRow>
</TableHead>
            <TableBody>
              {rows.map((row, idx) => (
                <TableRow key={row.randomId} hover
                  sx={{ "&:nth-of-type(even)": { backgroundColor: "#f5f5f5" } }}>
                  <TableCell>{idx + 1}</TableCell>
                  <TableCell>
                    <Chip label={row.prSource ?? "—"} size="small" color="primary" variant="outlined" />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{row.randomId}</TableCell>
                  <TableCell>{formatDate(row.orderDate)}</TableCell>
                  <TableCell>{row.vendorName ?? "—"}</TableCell>
                  <TableCell align="center">{row.totalItems}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 500 }}>
                    {formatAmount(row.pendingOrderAmount)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="View Purchase Order">
                      <IconButton size="small" color="primary" onClick={() => handleView(row.randomId)}>
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Convert to Pending for Approve">
                      <span>
                        <IconButton
                          size="small" color="warning"
                          onClick={() => handleConvert(row.randomId)}
                          disabled={converting === row.randomId}
                        >
                          {converting === row.randomId
                            ? <CircularProgress size={16} color="inherit" />
                            : <ShoppingCartCheckoutIcon fontSize="small" />}
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default PRApprovedPage;