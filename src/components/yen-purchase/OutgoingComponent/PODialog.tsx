// components/yen-purchase/OutgoingComponent/PODialog.tsx
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  IconButton,
  Box,
  Paper,
} from "@mui/material";
import { PoResponse } from "@/Models/purchaseModel";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";

interface PODialogProps {
  open: boolean;
  onClose: () => void;
  po?: PoResponse | null;      // old single PO support
  pos?: PoResponse[];          // new multi PO support
}

const PODialog: React.FC<PODialogProps> = ({ open, onClose, po, pos = [] }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  const poList = pos.length > 0 ? pos : po ? [po] : [];

  const handleClose = () => onClose();
  const toggleFullScreen = () => setIsFullScreen((prev) => !prev);

  const renderPoTable = (currentPo: PoResponse) => (
    <Paper key={currentPo.purchaseOrderId || currentPo.randomId} variant="outlined" sx={{ mb: 3, p: 2 }}>
      <Typography sx={{ fontWeight: "bold", mb: 1 }}>
        PO ID : {currentPo.randomId}
      </Typography>

      <Typography><strong>Random ID:</strong> {currentPo.randomId}</Typography>
      <Typography><strong>Vendor Name:</strong> {currentPo.vendorName || "N/A"}</Typography>
      <Typography>
        <strong>Order Date:</strong>{" "}
        {currentPo.orderDate
          ? new Date(currentPo.orderDate).toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })
          : "N/A"}
      </Typography>

      <Table sx={{ mt: 1 }}>
        <TableHead>
          <TableRow>
            <TableCell>Item Name</TableCell>
            <TableCell>PO Quantity</TableCell>
            <TableCell>Received Quantity</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Total Price</TableCell>
            <TableCell>Tax (%)</TableCell>
            <TableCell>Tax Amount</TableCell>
            <TableCell>Discount</TableCell>
            <TableCell>Final Price</TableCell>
          </TableRow>
        </TableHead>

        <TableBody>
          {currentPo.itemDetails.map((item, index) => (
            <TableRow key={`${currentPo.randomId}-${index}`}>
              <TableCell>{item.itemName}</TableCell>
              <TableCell>{item.poQuantity}</TableCell>
              <TableCell>{item.receivedQuantity}</TableCell>
              <TableCell>{item.newPrice?.toFixed(2)}</TableCell>
              <TableCell>{item.totalPrice?.toFixed(2)}</TableCell>
              <TableCell>{item.taxPercentage?.toFixed(2)}</TableCell>
              <TableCell>{item.taxAmount?.toFixed(2)}</TableCell>
              <TableCell>{item.discountAmount?.toFixed(2)}</TableCell>
              <TableCell>{item.finalPrice?.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={false}
      fullWidth
      fullScreen={isFullScreen}
      container={document.body}
      disablePortal={false}
      PaperProps={{
        style: {
          height: isFullScreen ? "100vh" : "auto",
          width: isFullScreen ? "100vw" : "90vw",
          maxWidth: "none",
          margin: isFullScreen ? 0 : "auto",
          borderRadius: isFullScreen ? 0 : undefined,
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: "bold",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: isFullScreen ? "16px 24px" : "16px",
        }}
      >
        Purchase Order Details
        <IconButton onClick={toggleFullScreen} color="primary" edge="end">
          {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={{
          padding: isFullScreen ? "0 24px" : "20px",
          height: isFullScreen ? "calc(100vh - 120px)" : "auto",
          overflow: "auto",
        }}
      >
        {poList.length > 0 ? (
          <Box>{poList.map(renderPoTable)}</Box>
        ) : (
          <Typography>No purchase order data available.</Typography>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PODialog;