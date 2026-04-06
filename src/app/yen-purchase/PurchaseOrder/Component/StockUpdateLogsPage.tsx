"use client";
import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Box, Typography, Table, TableContainer, TableHead,
  TableRow, TableCell, TableBody, Paper, Chip, IconButton,
  Grid, Alert, Button, CircularProgress, Divider, Accordion,
  AccordionSummary, AccordionDetails, Tab, Tabs
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import InventoryIcon from '@mui/icons-material/Inventory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ReceiptIcon from '@mui/icons-material/Receipt';
import PendingIcon from '@mui/icons-material/Pending';
import VerifiedIcon from '@mui/icons-material/Verified';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BlockIcon from '@mui/icons-material/Block';
import DescriptionIcon from '@mui/icons-material/Description';
import StorageIcon from '@mui/icons-material/Storage';

interface StockUpdateLogsDialogProps {
  open: boolean;
  onClose: () => void;
  purchaseOrderId: string;
  poRandomId?: string;
  poStatus?: string;
}

const StockUpdateLogsDialog: React.FC<StockUpdateLogsDialogProps> = ({
  open,
  onClose,
  purchaseOrderId,
  poRandomId,
  poStatus
}) => {
  const [loading, setLoading] = useState(false);
  const [logsData, setLogsData] = useState<any>(null);
  const [fileLogsData, setFileLogsData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0); // 0 = DB Logs, 1 = File Logs

  const fetchLogsFromDB = useCallback(async () => {
    try {
      const response = await fetch(`https://yenerp.com/purchaseapi/purchaseorders/stock-update-logs/${purchaseOrderId}`);
      const data = await response.json();
      if (data.success) {
        setLogsData(data);
      }
    } catch (err) {
      console.error('Error fetching DB logs:', err);
    }
  }, [purchaseOrderId]);

  const fetchLogsFromFile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://yenerp.com/purchaseapi/purchaseorders/stock-logs-from-file/${purchaseOrderId}`);
      const data = await response.json();
      if (data.success) {
        setFileLogsData(data);
      } else {
        setError(data.message || 'Failed to load file logs');
      }
    } catch (err) {
      console.error('Error fetching file logs:', err);
      setError('Error fetching file logs');
    } finally {
      setLoading(false);
    }
  }, [purchaseOrderId]);

  useEffect(() => {
    if (open && purchaseOrderId) {
      fetchLogsFromDB();
      fetchLogsFromFile();
    }
  }, [open, purchaseOrderId, fetchLogsFromDB, fetchLogsFromFile]);

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'Pending': return <PendingIcon sx={{ color: '#ff9800', fontSize: 20 }} />;
      case 'Approved': return <VerifiedIcon sx={{ color: '#4caf50', fontSize: 20 }} />;
      case 'GRNConverted': return <AssignmentIcon sx={{ color: '#2196f3', fontSize: 20 }} />;
      case 'Rejected': return <BlockIcon sx={{ color: '#f44336', fontSize: 20 }} />;
      default: return <PendingIcon sx={{ fontSize: 20 }} />;
    }
  };

  const getStatusColor = (status: string): 'warning' | 'success' | 'info' | 'error' | 'default' => {
    switch(status) {
      case 'Pending': return 'warning';
      case 'Approved': return 'success';
      case 'GRNConverted': return 'info';
      case 'Rejected': return 'error';
      default: return 'default';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
      <DialogTitle sx={{
        fontWeight: 'bold',
        bgcolor: '#1976d2',
        color: 'white',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        py: 1.5
      }}>
        <Box display="flex" alignItems="center" gap={1}>
          <InventoryIcon />
          <Typography variant="h6">Stock & Price Update History</Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 2 }}>
        {/* Tabs for DB Logs and File Logs */}
        <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)} sx={{ mb: 2 }}>
          <Tab label="📦 Database Logs" />
          <Tab label="📄 File System Logs" />
        </Tabs>

        {/* Tab 0: Database Logs */}
        {activeTab === 0 && (
          <>
            {!logsData ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={5}>
                <CircularProgress />
              </Box>
            ) : !logsData.hasStockUpdates ? (
              <Alert severity="info" sx={{ m: 2 }}>
                <strong>No Stock Updates Yet</strong><br />
                This Purchase Order has not been converted to GRN. Stock and price updates will appear after GRN creation.
              </Alert>
            ) : (
              <Box>
                {/* Summary Cards */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                      <Typography variant="caption" color="textSecondary">Total GRNs</Typography>
                      <Typography variant="h5" fontWeight="bold">{logsData.totalGrns || 0}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fff3e0' }}>
                      <Typography variant="caption" color="textSecondary">Price Updates</Typography>
                      <Typography variant="h5" fontWeight="bold" color="warning.main">
                        {logsData.summary?.totalPriceUpdates || 0}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                      <Typography variant="caption" color="textSecondary">Stock Updates</Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        {logsData.summary?.totalStockUpdates || 0}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#f3e5f5' }}>
                      <Typography variant="caption" color="textSecondary">Items</Typography>
                      <Typography variant="h5" fontWeight="bold">
                        {logsData.summary?.totalItemsProcessed || 0}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* GRN-wise Logs */}
                {logsData.logs?.filter((log: any) => log.source === 'GRN').map((log: any, index: number) => (
                  <Accordion key={index} defaultExpanded={index === 0} sx={{ mb: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" justifyContent="space-between" width="100%" flexWrap="wrap">
                        <Box>
                          <Typography variant="subtitle2" fontWeight="bold">
                            GRN #{log.grnRandomId?.substring(0, 8) || log.grnId?.substring(0, 8)}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {log.grnDate ? new Date(log.grnDate).toLocaleString() : 'Date unknown'}
                          </Typography>
                        </Box>
                        <Box display="flex" gap={0.5}>
                          <Chip size="small" label={log.isPartialReceipt ? "Partial" : "Full"} 
                            color={log.isPartialReceipt ? "warning" : "success"} variant="outlined" />
                          <Chip size="small" icon={<LocationOnIcon sx={{ fontSize: 14 }} />} 
                            label={log.receivingLocationName || log.receivingLocation} />
                          <Chip size="small" label={`${log.priceUpdates} updates`} color="warning" variant="outlined" />
                        </Box>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails sx={{ p: 0 }}>
                      <TableContainer sx={{ maxHeight: 300 }}>
                        <Table stickyHeader size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>#</TableCell>
                              <TableCell>Item</TableCell>
                              <TableCell align="center">Status</TableCell>
                              <TableCell align="center">Price</TableCell>
                              <TableCell align="right">Stock Δ</TableCell>
                              <TableCell align="right">Old Price</TableCell>
                              <TableCell align="right">New Price</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {log.items?.map((item: any, idx: number) => (
                              <TableRow key={idx} sx={{ bgcolor: item.status === 'failed' ? '#ffebee' : 'inherit' }}>
                                <TableCell>{idx + 1}</TableCell>
                                <TableCell><Typography variant="body2" fontWeight={500}>{item.itemName}</Typography></TableCell>
                                <TableCell align="center">
                                  <Chip label={item.status} size="small" color={item.status === 'success' ? 'success' : 'error'} />
                                </TableCell>
                                <TableCell align="center">
                                  {item.priceUpdated ? <CheckCircleIcon color="success" fontSize="small" /> : <ErrorIcon color="error" fontSize="small" />}
                                </TableCell>
                                <TableCell align="right">
                                  <Typography color={item.locationStockChange > 0 ? 'success.main' : 'error.main'} fontWeight="bold">
                                    {item.locationStockChange > 0 ? `+${item.locationStockChange}` : item.locationStockChange}
                                  </Typography>
                                </TableCell>
                                <TableCell align="right">{item.oldMasterPrice ? `₹${item.oldMasterPrice.toFixed(2)}` : '-'}</TableCell>
                                <TableCell align="right">
                                  {item.newMasterPrice ? <Typography fontWeight="bold" color="primary.main">₹{item.newMasterPrice.toFixed(2)}</Typography> : '-'}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </>
        )}

        {/* Tab 1: File System Logs */}
        {activeTab === 1 && (
          <Box>
            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" py={5}>
                <CircularProgress />
              </Box>
            ) : fileLogsData?.parsed_updates?.length > 0 ? (
              <>
                {/* File Log Summary */}
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6} sm={4}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#e3f2fd' }}>
                      <Typography variant="caption" color="textSecondary">Total Log Entries</Typography>
                      <Typography variant="h5" fontWeight="bold">{fileLogsData.total_logs_found || 0}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#fff3e0' }}>
                      <Typography variant="caption" color="textSecondary">Price Updates</Typography>
                      <Typography variant="h5" fontWeight="bold" color="warning.main">
                        {fileLogsData.parsed_updates?.filter((u: any) => u.type === 'price_update').length || 0}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <Paper sx={{ p: 1.5, textAlign: 'center', bgcolor: '#e8f5e9' }}>
                      <Typography variant="caption" color="textSecondary">Inventory Updates</Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.main">
                        {fileLogsData.parsed_updates?.filter((u: any) => u.type === 'inventory_update').length || 0}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>

                {/* Parsed Updates Table */}
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>📊 Parsed Updates</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400, mb: 2 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Details</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {fileLogsData.parsed_updates?.map((update: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell sx={{ whiteSpace: 'nowrap' }}>{update.timestamp}</TableCell>
                          <TableCell>
                            <Chip 
                              label={update.type} 
                              size="small" 
                              color={update.type === 'price_update' ? 'warning' : update.type === 'inventory_update' ? 'success' : 'info'}
                            />
                          </TableCell>
                          <TableCell>
                            {update.type === 'price_update' && (
                              <Typography variant="body2">
                                Item: {update.random_id?.substring(0, 8)}... | 
                                Price: ₹{update.old_price} → ₹{update.new_price}
                              </Typography>
                            )}
                            {update.type === 'inventory_update' && (
                              <Typography variant="body2">
                                Item: {update.random_id?.substring(0, 8)}... | 
                                Stock: {update.old_stock} → {update.new_stock} ({update.operation})
                              </Typography>
                            )}
                            {update.type === 'summary' && (
                              <Typography variant="body2">
                                Summary: {update.price_updates} price updates, {update.stock_updates} stock updates
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Raw Logs */}
                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>📝 Raw Log Entries</Typography>
                <Paper sx={{ p: 2, maxHeight: 300, overflow: 'auto', bgcolor: '#1e1e1e' }}>
                  {fileLogsData.logs?.map((log: string, idx: number) => (
                    <Typography key={idx} variant="caption" sx={{ display: 'block', fontFamily: 'monospace', color: '#d4d4d4', mb: 0.5 }}>
                      {log}
                    </Typography>
                  ))}
                </Paper>
              </>
            ) : (
              <Alert severity="info">
                No log entries found for this Purchase Order in the log file.
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  Log file path: {fileLogsData?.file_path || 'logs/inventory_operations.log'}
                </Typography>
              </Alert>
            )}
          </Box>
        )}

        {/* Price Logic Info */}
        <Alert severity="info" sx={{ mt: 2 }} icon={<PriceChangeIcon />}>
          <Typography variant="caption">
            <strong>Price Update Priority:</strong> grnPrice → newPrice → existing price<br/>
            Old price moves to <strong>&apos;oldPrice&apos;</strong> field in Item Master
          </Typography>
        </Alert>
      </DialogContent>

      <DialogActions sx={{ p: 1.5 }}>
        <Button onClick={onClose} variant="contained" size="small">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StockUpdateLogsDialog;