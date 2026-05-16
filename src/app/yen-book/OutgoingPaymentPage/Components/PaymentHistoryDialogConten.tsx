// PaymentHistoryDialogContent.tsx
'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import {
  Grid,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Box,
  CircularProgress,
  Pagination,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent as MuiDialogContent,
  DialogTitle as MuiDialogTitle,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ClearIcon from '@mui/icons-material/Clear';
import moment from 'moment';

import { AppDispatch } from '@/redux/store';
import {
  fetchGroupedPayments,
  fetchPaymentById,
  exportGroupedPaymentsCSV,
  exportGroupedPaymentsPDF,
  exportIndividualPaymentPDF,
  selectGroupedPayments,
  resetExport,
} from '@/features/yen-purchase/Outgoing/paymentHistory'; 
import { usePermissions } from '@/hooks/usePermissions';
import PaymentHistoryFilters from './PaymentHistory';

interface PaymentHistoryDialogContentProps {
  onRequestClose?: () => void;
}

const PaymentHistoryDialogContent = ({ onRequestClose }: PaymentHistoryDialogContentProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const { hasPermission } = usePermissions();
  const canRead = hasPermission('yenerp', 'paymenthistory', 'read');

  const searchParams = useSearchParams();
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();

  // Get initial values from URL
  const initialPaymentId = searchParams?.get('payment_id') || '';
  const initialPage = parseInt(searchParams?.get('page') || '1', 10);
  const initialDateFrom = searchParams?.get('date_from') || '';
  const initialDateTo = searchParams?.get('date_to') || '';
  const initialVendorName = searchParams?.get('vendor_name') || '';

  // State initialized from URL directly
  const [localFilter, setLocalFilter] = useState(initialPaymentId);
  const [dateFrom, setDateFrom] = useState<string>(initialDateFrom);
  const [dateTo, setDateTo] = useState<string>(initialDateTo);
  const [vendorName, setVendorName] = useState<string>(initialVendorName);
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  const [selectedPayment, setSelectedPayment] = useState<any>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  
  const limit = 10;
  const isInitialMount = useRef(true);
  const isUpdatingFromFilter = useRef(false);

  const {
    groupedData,
    loading,
    error,
    exportLoading,
    exportError,
    individualExportId,
  } = useSelector(selectGroupedPayments);

  // Fetch data function
  const fetchData = (page: number, filters: {
    paymentId?: string;
    dateFrom?: string;
    dateTo?: string;
    vendorName?: string;
  }) => {
    if (!canRead) return;
    
    dispatch(fetchGroupedPayments({
      paymentId: filters.paymentId || undefined,
      page,
      limit,
      dateFrom: filters.dateFrom || undefined,
      dateTo: filters.dateTo || undefined,
      vendorName: filters.vendorName || undefined,
    }));
  };

  // Initial load - only once
  useEffect(() => {
    if (isInitialMount.current && canRead) {
      isInitialMount.current = false;
      
      // Initial fetch with URL params
      fetchData(initialPage, {
        paymentId: initialPaymentId,
        dateFrom: initialDateFrom,
        dateTo: initialDateTo,
        vendorName: initialVendorName,
      });
    }
  }, [canRead]); // Empty dependency array - only runs once on mount

  // Handle filter application
  const handleFilterApply = () => {
    // Update URL
    const newParams = new URLSearchParams();
    if (localFilter) newParams.set('payment_id', localFilter);
    if (dateFrom) newParams.set('date_from', dateFrom);
    if (dateTo) newParams.set('date_to', dateTo);
    if (vendorName) newParams.set('vendor_name', vendorName);
    newParams.set('page', '1');
    
    // Reset page to 1 when applying filters
    setCurrentPage(1);
    router.push(`?${newParams.toString()}`);
    
    // Fetch with new filters
    fetchData(1, {
      paymentId: localFilter,
      dateFrom: dateFrom,
      dateTo: dateTo,
      vendorName: vendorName,
    });
  };

  // Handle clear filters
  const handleClearFilter = () => {
    setLocalFilter('');
    setDateFrom('');
    setDateTo('');
    setVendorName('');
    setCurrentPage(1);
    
    const newParams = new URLSearchParams();
    newParams.set('page', '1');
    router.push(`?${newParams.toString()}`);
    
    // Fetch all data
    fetchData(1, {});
  };

  // Handle page change
  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
    
    const newParams = new URLSearchParams(searchParams?.toString() || '');
    newParams.set('page', value.toString());
    router.push(`?${newParams.toString()}`);
    
    // Fetch data for new page with current filters
    fetchData(value, {
      paymentId: localFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      vendorName: vendorName || undefined,
    });
  };

  // Sync URL changes to state (when user clicks browser back/forward)
  useEffect(() => {
    const urlPaymentId = searchParams?.get('payment_id') || '';
    const urlDateFrom = searchParams?.get('date_from') || '';
    const urlDateTo = searchParams?.get('date_to') || '';
    const urlVendorName = searchParams?.get('vendor_name') || '';
    const urlPage = parseInt(searchParams?.get('page') || '1', 10);

    // Check if URL has changed from current state
    const hasChanged = 
      urlPaymentId !== localFilter ||
      urlDateFrom !== dateFrom ||
      urlDateTo !== dateTo ||
      urlVendorName !== vendorName ||
      urlPage !== currentPage;

    if (hasChanged && !isInitialMount.current) {
      // Update state from URL
      setLocalFilter(urlPaymentId);
      setDateFrom(urlDateFrom);
      setDateTo(urlDateTo);
      setVendorName(urlVendorName);
      setCurrentPage(urlPage);
      
      // Fetch data with new URL params
      fetchData(urlPage, {
        paymentId: urlPaymentId || undefined,
        dateFrom: urlDateFrom || undefined,
        dateTo: urlDateTo || undefined,
        vendorName: urlVendorName || undefined,
      });
    }
  }, [searchParams]); // Only runs when URL changes (browser navigation)

  const handleCloseDialog = () => {
    setOpenDialog(false);
    dispatch(resetExport());
  };

  const handleViewDetails = async (paymentId: string) => {
    try {
      const result = await dispatch(fetchPaymentById(paymentId)).unwrap();
      setSelectedPayment(result);
      setDetailsOpen(true);
    } catch (err) {
      console.error('Failed to fetch payment details:', err);
    }
  };

const handleIndividualPDFDownload = async (paymentId: string) => {
  try {
    await dispatch(exportIndividualPaymentPDF(paymentId)).unwrap();
    // Download is already triggered inside the thunk
  } catch (err) {
    console.error('Failed to download PDF:', err);
  }
};
const handleCSVExport = async () => {
  try {
    await dispatch(exportGroupedPaymentsCSV({
      paymentId: localFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      vendorName: vendorName || undefined,
    })).unwrap();
    handleCloseDialog();
  } catch (err) {
    console.error('CSV export failed:', err);
  }
};

const handlePDFExport = async () => {
  try {
    await dispatch(exportGroupedPaymentsPDF({
      paymentId: localFilter || undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      vendorName: vendorName || undefined,
    })).unwrap();
    handleCloseDialog();
  } catch (err) {
    console.error('PDF export failed:', err);
  }
};
  const formatDate = (dateString: string): string => {
    return moment(dateString).format('DD-MM-YYYY');
  };

  const formatAmount = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatCurrency = (amount: number): string => {
    return `₹ ${formatAmount(amount)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'fully paid':
        return 'success';
      case 'partially paid':
        return 'warning';
      case 'pending':
        return 'error';
      default:
        return 'default';
    }
  };

  if (!canRead) {
    return (
      <Box p={isMobile ? 2 : 4}>
        <Alert severity="error">You do not have permission to view Payment History</Alert>
      </Box>
    );
  }

  if (loading && !groupedData) {
    return (
      <Box display="flex" justifyContent="center" sx={{ mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={isMobile ? 2 : 4}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const title = localFilter
    ? `Payment Details - ${localFilter}`
    : 'All Payment History';

  const getAccordionSummaryGrid = () => {
    if (isMobile) return { xs: 12 };
    if (isTablet) return { xs: 12, sm: 6, md: 4 };
    return { xs: 12, md: 3, lg: 2.4 };
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Box sx={{ mb: isMobile ? 1.5 : 2 }}>
        <Typography variant={isMobile ? 'h6' : 'h5'} gutterBottom>
          {title}
        </Typography>

        {groupedData && (
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Total Amount: {formatCurrency(groupedData.totalAmount)} | Total Payments:{' '}
            {groupedData.totalGroups}
          </Typography>
        )}

        <PaymentHistoryFilters
          localFilter={localFilter}
          setLocalFilter={setLocalFilter}
          dateFrom={dateFrom}
          setDateFrom={setDateFrom}
          dateTo={dateTo}
          setDateTo={setDateTo}
          vendorName={vendorName}
          setVendorName={setVendorName}
          handleFilterApply={handleFilterApply}
          handleClearFilter={handleClearFilter}
          openExportDialog={() => setOpenDialog(true)}
          exportLoading={exportLoading}
          disableClear={!localFilter && !dateFrom && !dateTo && !vendorName}
          disableExport={!groupedData || groupedData.groups.length === 0 || exportLoading}
        />

        {exportError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {exportError}
          </Alert>
        )}
      </Box>

      <Box
        sx={{
          maxHeight: isMobile ? 'calc(70vh - 180px)' : 'calc(70vh - 200px)',
          overflow: 'auto',
          '&::-webkit-scrollbar': { width: '6px', height: '6px' },
          '&::-webkit-scrollbar-track': { backgroundColor: '#f1f1f1', borderRadius: '4px' },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#888',
            borderRadius: '4px',
            '&:hover': { backgroundColor: '#555' },
          },
        }}
      >
        {groupedData && groupedData.groups.length === 0 ? (
          <Alert severity="info">No payment records found for the selected filters.</Alert>
        ) : (
          groupedData?.groups.map((group: any) => (
            <Accordion key={group.paymentId} defaultExpanded={!!localFilter}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Grid container alignItems="center" spacing={isMobile ? 1 : 2}>
                  <Grid item {...getAccordionSummaryGrid()}>
                    <Typography variant={isMobile ? 'body2' : 'subtitle1'} fontWeight="bold">
                      {group.paymentId}
                    </Typography>
                  </Grid>

                  <Grid item {...getAccordionSummaryGrid()}>
                    <Typography variant="body2" color="textSecondary">
                      Vendor: {group.vendorName}
                    </Typography>
                  </Grid>

                  <Grid item {...getAccordionSummaryGrid()}>
                    <Typography variant="body2">
                      Payable: {formatCurrency(group.totalPayableAmount)}
                    </Typography>
                  </Grid>

                  <Grid item {...getAccordionSummaryGrid()}>
                    <Typography variant="body2" color="primary">
                      Paid: {formatCurrency(group.totalPaidAmount)}
                    </Typography>
                  </Grid>

                  <Grid item {...getAccordionSummaryGrid()}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center',
                      justifyContent: isMobile ? 'flex-start' : 'flex-end' }}>
                      <Chip
                        label={group.status}
                        color={getStatusColor(group.status)}
                        size="small"
                      />

                      <Tooltip title={`Download PDF for ${group.paymentId}`}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIndividualPDFDownload(group.paymentId);
                          }}
                          disabled={individualExportId === group.paymentId || exportLoading}
                        >
                          {individualExportId === group.paymentId ? (
                            <CircularProgress size={16} />
                          ) : (
                            <PictureAsPdfIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Grid>
                </Grid>
              </AccordionSummary>

              <AccordionDetails>
                <Card variant="outlined">
                  <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
                    <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: isMobile ? 1 : 2 }}>
                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="caption" color="textSecondary">Outgoing ID</Typography>
                        <Typography variant="body2">{group.outgoingRandomId}</Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Typography variant="caption" color="textSecondary">Payment Date</Typography>
                        <Typography variant="body2">
                          {group.paymentDate ? formatDate(group.paymentDate) : 'N/A'}
                        </Typography>
                      </Grid>

                      <Grid item xs={12} sm={6} md={4}>
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => handleViewDetails(group.paymentId)}
                          fullWidth={isMobile}
                        >
                          View Full Details
                        </Button>
                      </Grid>
                    </Grid>

                    <Typography variant="subtitle2" gutterBottom>
                      Payment Transactions
                    </Typography>

                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 300 }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                            <TableCell>Date</TableCell>
                            <TableCell align="right">Amount (₹)</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Method</TableCell>
                            <TableCell>Reference</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {group.paymentHistory.map((payment: any, idx: number) => (
                            <TableRow key={`${group.paymentId}-${idx}`}>
                              <TableCell>{formatDate(payment.date)}</TableCell>
                              <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                              <TableCell>{payment.paymentType}</TableCell>
                              <TableCell>{payment.paymentMethod}</TableCell>
                              <TableCell>
                                {payment.neftNo || payment.rtgsNo || payment.impsNo ||
                                  payment.upi || payment.bankName || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </AccordionDetails>
            </Accordion>
          ))
        )}

        {groupedData && groupedData.totalPages > 1 && (
          <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
            <Pagination
              count={groupedData.totalPages}
              page={currentPage}
              onChange={handlePageChange}
              color="primary"
              size={isMobile ? 'medium' : 'large'}
            />
          </Box>
        )}
      </Box>

      {/* Export Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <MuiDialogTitle>Download Payment Report</MuiDialogTitle>
        <MuiDialogContent>
          <Typography>
            Choose format for {localFilter ? `filtered (${localFilter})` : 'all'} payments
          </Typography>
          {(dateFrom || dateTo) && (
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
              Date range: {dateFrom || 'Start'} to {dateTo || 'End'}
            </Typography>
          )}
          {vendorName && (
            <Typography variant="body2" color="textSecondary">
              Vendor: {vendorName}
            </Typography>
          )}
        </MuiDialogContent>
        <DialogActions>
          <Button onClick={handlePDFExport} startIcon={<PictureAsPdfIcon />} disabled={exportLoading}>
            PDF
          </Button>
          <Button onClick={handleCSVExport} startIcon={<DescriptionIcon />} disabled={exportLoading}>
            CSV
          </Button>
          <Button onClick={handleCloseDialog} disabled={exportLoading}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            margin: isMobile ? 1 : 'auto',
            width: isMobile ? 'calc(100% - 16px)' : 'auto',
          },
        }}
      >
        <MuiDialogTitle>
          Payment Details - {selectedPayment?.paymentId}
          <IconButton
            aria-label="close"
            onClick={() => setDetailsOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <ClearIcon />
          </IconButton>
        </MuiDialogTitle>
        <MuiDialogContent dividers>
          {selectedPayment && (
            <Box>
              <Grid container spacing={isMobile ? 1 : 2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Vendor Name</Typography>
                  <Typography variant="body2">{selectedPayment.vendorName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Outgoing ID</Typography>
                  <Typography variant="body2">{selectedPayment.outgoingRandomId}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Total Payable</Typography>
                  <Typography variant="body2">{formatCurrency(selectedPayment.totalPayableAmount)}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="textSecondary">Total Paid</Typography>
                  <Typography variant="body2" color="primary">
                    {formatCurrency(selectedPayment.totalPaidAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="textSecondary" sx={{ mt: 1 }}>
                    Payment History
                  </Typography>
                  <TableContainer component={Paper} variant="outlined" sx={{ mt: 1, maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell>Reference</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedPayment.paymentHistory.map((payment: any, idx: number) => (
                          <TableRow key={`detail-${idx}`}>
                            <TableCell>{formatDate(payment.date)}</TableCell>
                            <TableCell align="right">{formatCurrency(payment.amount)}</TableCell>
                            <TableCell>{payment.paymentType}</TableCell>
                            <TableCell>{payment.paymentMethod}</TableCell>
                            <TableCell>
                              {payment.neftNo || payment.rtgsNo || payment.impsNo ||
                                payment.upi || payment.bankName || '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            </Box>
          )}
        </MuiDialogContent>
      </Dialog>
    </Box>
  );
};

export default PaymentHistoryDialogContent;