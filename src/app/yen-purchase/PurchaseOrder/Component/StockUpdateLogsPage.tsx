"use client";
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Table, TableContainer, TableHead,
  TableRow, TableCell, TableBody, Paper, Chip, IconButton,
  Grid, Alert, Button, CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import InventoryIcon from '@mui/icons-material/Inventory';
import { fetchStockUpdateLogs, setShowStockLogsDialog, selectStockLogs, selectShowStockLogsDialog } from '../../../../features/yen-purchase/PurchaseOrder/purchaseListSlice'; // Adjust import path
import { AppDispatch } from '@/redux/store';

const StockUpdateLogsDialog: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { open, purchaseOrderId } = useSelector(selectShowStockLogsDialog);
  const { data: fileLogsData, loading, error } = useSelector(selectStockLogs);

  useEffect(() => {
    if (open && purchaseOrderId) {
      dispatch(fetchStockUpdateLogs(purchaseOrderId));
    }
  }, [open, purchaseOrderId, dispatch]);

  const handleClose = () => {
    dispatch(setShowStockLogsDialog({ show: false }));
  };

  const getUpdateTypeColor = (type: string): 'warning' | 'success' | 'info' => {
    if (type === 'price_update') return 'warning';
    if (type === 'inventory_update') return 'success';
    return 'info';
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '60vh',
          maxHeight: '90vh',
          borderRadius: 2
        }
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 'bold',
          bgcolor: '#1976d2',
          color: 'white',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          py: 1.5
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <InventoryIcon />
          <Typography variant="h6">Stock & Price Update History</Typography>
        </Box>
        <IconButton onClick={handleClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={6}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        ) : !fileLogsData ? null : fileLogsData.parsed_updates?.length === 0 ? (
          <Alert severity="info" sx={{ m: 2 }}>
            <strong>No log entries found</strong>
            <br />
            No stock or price update logs found for this Purchase Order.
            <Typography variant="caption" display="block" sx={{ mt: 1 }}>
              Log file: {fileLogsData?.file_path || 'logs/inventory_operations.log'}
            </Typography>
          </Alert>
        ) : (
          <Box>
            {/* Summary Cards */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6} sm={4}>
                <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                  <Typography variant="caption" color="textSecondary">
                    Total Log Entries
                  </Typography>
                  <Typography variant="h5" fontWeight="bold">
                    {fileLogsData.total_logs_found || 0}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fff3e0' }}>
                  <Typography variant="caption" color="textSecondary">
                    Price Updates
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="warning.main">
                    {fileLogsData.parsed_updates?.filter(
                      (u: any) => u.type === 'price_update'
                    ).length || 0}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                  <Typography variant="caption" color="textSecondary">
                    Inventory Updates
                  </Typography>
                  <Typography variant="h5" fontWeight="bold" color="success.main">
                    {fileLogsData.parsed_updates?.filter(
                      (u: any) => u.type === 'inventory_update'
                    ).length || 0}
                  </Typography>
                </Paper>
              </Grid>
            </Grid>

            {/* Parsed Updates Table */}
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Parsed Updates
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 350, mb: 2 }}>
              <Table stickyHeader size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>Time</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fileLogsData.parsed_updates?.map((update: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 12 }}>
                        {update.timestamp}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={update.type.replace('_', ' ')}
                          size="small"
                          color={getUpdateTypeColor(update.type)}
                        />
                      </TableCell>
                      <TableCell>
                        {update.type === 'price_update' && (
                          <Typography variant="body2">
                            Item: {update.random_id?.substring(0, 8)}… | Price: ₹
                            {update.old_price} → ₹{update.new_price}
                          </Typography>
                        )}
                        {update.type === 'inventory_update' && (
                          <Typography variant="body2">
                            Item: {update.random_id?.substring(0, 8)}… | Stock:{' '}
                            {update.old_stock} → {update.new_stock} ({update.operation})
                          </Typography>
                        )}
                        {update.type === 'summary' && (
                          <Typography variant="body2">
                            {update.price_updates} price updates, {update.stock_updates} stock
                            updates
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Raw Logs */}
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              Raw Log Entries
            </Typography>
            <Paper sx={{ p: 2, maxHeight: 260, overflow: 'auto', bgcolor: '#1e1e1e' }}>
              {fileLogsData.logs?.map((log: string, idx: number) => (
                <Typography
                  key={idx}
                  variant="caption"
                  sx={{
                    display: 'block',
                    fontFamily: 'monospace',
                    color: '#d4d4d4',
                    mb: 0.5,
                    lineHeight: 1.6
                  }}
                >
                  {log}
                </Typography>
              ))}
            </Paper>
          </Box>
        )}

        {/* Price Logic Info */}
        <Alert severity="info" sx={{ mt: 2 }} icon={<PriceChangeIcon />}>
          <Typography variant="caption">
            <strong>Price Update Priority:</strong> grnPrice → newPrice → existing price
            <br />
            Old price moves to <strong>&apos;oldPrice&apos;</strong> field in Item Master
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 1.5 }}>
        <Button onClick={handleClose} variant="contained" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockUpdateLogsDialog;