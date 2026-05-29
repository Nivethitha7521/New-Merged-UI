// src/components/debitCreditNote/DebitCreditNoteDialog.tsx
import React, { useEffect, useRef, useState } from 'react';
import purchaseApi from "@/utils/api";
import { useDispatch, useSelector } from 'react-redux';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Table,
  IconButton,
  Typography,
  Box,
  Tooltip,
  CircularProgress,
  Paper,
  Chip,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Tabs,
  Tab,
  Alert,
  Badge,
  Stack,
  LinearProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DescriptionIcon from '@mui/icons-material/Description';
import DownloadIcon from '@mui/icons-material/Download';
import SummarizeIcon from '@mui/icons-material/Summarize';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import ReceiptIcon from '@mui/icons-material/Receipt';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { AppDispatch } from '@/redux/store';
import {
  selectDebitCreditNote,
  selectItemWiseDebitNotes,
  selectAmountOnlyDebitNotes,
  selectActiveDebitNotes,
  selectClearedDebitNotes,
  selectDebitNoteStats,
  selectDebitNoteSummary,
  clearDebitCreditNotes,
  setDebitCreditDialogOpen,
  fetchAllDebitNotesForDocument,
} from '@/features/yen-purchase/DebitNoteSlice';
import { ComprehensiveDebitNoteView } from '@/features/yen-purchase/DebitNoteSlice';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`debit-note-tabpanel-${index}`}
      aria-labelledby={`debit-note-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

// Format document types
const formatDocumentType = (docType: string | undefined) => {
  if (!docType) return 'N/A';
  const withSpaces = docType.replace(/_/g, ' ');
  return withSpaces
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Format currency
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// Get status icon
const getStatusIcon = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active': return <PendingIcon color="error" fontSize="small" />;
    case 'cleared': return <CheckCircleIcon color="success" fontSize="small" />;
    case 'partially cleared': return <CheckCircleIcon color="warning" fontSize="small" />;
    default: return undefined;
  }
};

// Get status color
const getStatusColor = (status: string) => {
  switch (status?.toLowerCase()) {
    case 'active': return 'error';
    case 'cleared': return 'success';
    case 'partially cleared': return 'warning';
    default: return 'default';
  }
};

// Get note type color
const getNoteTypeColor = (noteType: string) => {
  return noteType === 'item_wise' ? 'primary' : 'secondary';
};

// Get note type icon
const getNoteTypeIcon = (noteType: string) => {
  return noteType === 'item_wise' ? 
    <ListAltIcon fontSize="small" /> : 
    <AttachMoneyIcon fontSize="small" />;
};

// Format date
const formatDate = (dateString: string | Date | undefined | null) => {
  if (!dateString) return 'N/A';
  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (e) {
    return String(dateString);
  }
};

// Helper function to get legacy note properties
const getLegacyNoteData = (note: ComprehensiveDebitNoteView) => {
  return {
    ...note,
    randomId: note.noteNumber || note.noteId,
    itemDetails: note.items,
  };
};

const DebitCreditNoteDialog: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    allDebitNotes,
    documentId,
    documentType,
    dialogOpen,
    loading,
    error,
    snackbarOpen,
    snackbarMessage,
  } = useSelector(selectDebitCreditNote);

  // Use selectors for specific note types
  const itemWiseNotes = useSelector(selectItemWiseDebitNotes);
  const amountOnlyNotes = useSelector(selectAmountOnlyDebitNotes);
  const activeNotes = useSelector(selectActiveDebitNotes);
  const clearedNotes = useSelector(selectClearedDebitNotes);
  const stats = useSelector(selectDebitNoteStats);
  const summary = useSelector(selectDebitNoteSummary);

  const hasFetched = useRef(false);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ComprehensiveDebitNoteView | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');

  // Helper to download PDF - Inside component so it can access documentId
  const downloadPdf = async (noteId: string, filename: string) => {
    try {
      const encodedNoteId = encodeURIComponent(noteId);
      const url = `/debitnote/returnprocess/DebitCreditNote/pdf?note_id=${encodedNoteId}`;
      
      const response = await purchaseApi.get(url, {
        responseType: "blob"
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
     
      alert("Failed to download PDF. Please try again.");
    }
  };

  // Handle single PDF download
  const handleDownloadSinglePdf = async (noteId: string) => {
    if (!noteId) {
     
      return;
    }
    
    try {
      const safeFilename = `DebitNote_${noteId.replace(/\//g, '_')}.pdf`;
      await downloadPdf(noteId, safeFilename);
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  // Handle download all PDFs
  const handleDownloadAllPdf = async () => {
    if (!documentId) return;

    try {
      
      const encodedDocumentId = encodeURIComponent(documentId);
      const response = await purchaseApi.get(
        `/debitnote/returnprocess/DebitCreditNote/pdf-all/${encodedDocumentId}`,
        {
          params: { document_type: documentType },
          responseType: "blob",
        }
      );

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      const safeDocId = documentId.replace(/\//g, '_');
      link.download = `All_Debit_Notes_${safeDocId}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
    
      alert("Failed to download all PDFs. Please try again.");
    }
  };

  // Fetch ALL debit notes when dialog opens
  useEffect(() => {
    if (dialogOpen && documentId && documentType && !hasFetched.current) {
    
      
      hasFetched.current = true;
      setIsLoadingView(true);

      dispatch(fetchAllDebitNotesForDocument({
        documentId,
        documentType,
        includeCleared: true,
        includeActive: true,
      }))
        .unwrap()
       
      
        .finally(() => {
          setIsLoadingView(false);
        });
    }

    return () => {
      if (!dialogOpen) {
        hasFetched.current = false;
        setTabValue(0);
        setExpandedNote(null);
        setSelectedNote(null);
        setViewMode('list');
      }
    };
  }, [dialogOpen, documentId, documentType, dispatch]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setViewMode('list');
    setSelectedNote(null);
  };

  const handleClose = () => {
  
    dispatch(setDebitCreditDialogOpen(false));
    dispatch(clearDebitCreditNotes());
    setExpandedNote(null);
    setTabValue(0);
    setSelectedNote(null);
    setViewMode('list');
  };

  const handleExpandNote = (noteId: string) => {
    setExpandedNote(expandedNote === noteId ? null : noteId);
  };

  const handleViewNoteDetail = (note: ComprehensiveDebitNoteView) => {
    setSelectedNote(note);
    setViewMode('detail');
  };

  const handleBackToList = () => {
    setSelectedNote(null);
    setViewMode('list');
  };

  // Render note type badge
  const renderNoteTypeBadge = (note: ComprehensiveDebitNoteView) => {
    const isItemWise = note.noteType === 'item_wise' || (note.items && note.items.length > 0);
    const icon = getNoteTypeIcon(note.noteType);
    const label = isItemWise ? 'Item-wise' : 'Amount-only';
    const color = getNoteTypeColor(note.noteType);

    return (
      <Tooltip title={label}>
        <Badge
          badgeContent={isItemWise ? note.items?.length || 0 : undefined}
          color={color}
          sx={{ mr: 1 }}
        >
          <Chip
            icon={icon}
            label={label}
            size="small"
            color={color}
            variant="outlined"
          />
        </Badge>
      </Tooltip>
    );
  };

  // Render note card for summary view
  const renderNoteCard = (note: ComprehensiveDebitNoteView) => {
    const statusColor = getStatusColor(note.status);
    const statusIcon = getStatusIcon(note.status);
    const finalAmount = note.finalAmount || note.totalAmount || 0;
    const pendingAmount = note.pendingAmount || (note.status === 'Active' ? finalAmount : 0);
    const totalAmount = note.totalAmount || 0;

    return (
      <Card 
        sx={{ 
          mb: 2,
          borderLeft: `4px solid ${
            statusColor === 'error' ? '#f44336' : 
            statusColor === 'success' ? '#4caf50' : 
            '#ff9800'
          }`,
          '&:hover': { 
            boxShadow: 3,
            cursor: 'pointer',
            backgroundColor: 'action.hover'
          }
        }}
        onClick={() => handleViewNoteDetail(note)}
      >
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={1} alignItems="center">
            <Grid item xs={8}>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                {renderNoteTypeBadge(note)}
                <Typography variant="subtitle1" fontWeight="bold">
                  {note.noteNumber || note.noteId || 'N/A'}
                </Typography>
                <Chip
                  label={note.status || 'Active'}
                  size="small"
                  color={statusColor}
                  icon={statusIcon}
                />
              </Stack>
              
              <Typography variant="body2" color="textSecondary">
                Created: {formatDate(note.createdDate)} • {note.createdBy || 'system'}
              </Typography>
              
              {note.reason && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  <strong>Reason:</strong> {note.reason}
                </Typography>
              )}
              
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Typography variant="body2">
                  <strong>Total:</strong> {formatCurrency(totalAmount)}
                </Typography>
                <Typography variant="body2" color="error">
                  <strong>Pending:</strong> {formatCurrency(pendingAmount)}
                </Typography>
              </Stack>
            </Grid>
            
            <Grid item xs={4} sx={{ textAlign: 'right' }}>
              <Typography variant="h6" color="primary">
                {formatCurrency(finalAmount)}
              </Typography>
              
              <Stack direction="row" spacing={0.5} justifyContent="flex-end" sx={{ mt: 1 }}>
                <Tooltip title="View Details">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewNoteDetail(note);
                    }}
                  >
                    <VisibilityIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Download PDF">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadSinglePdf(note.noteId);
                    }}
                  >
                    <PictureAsPdfIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Expand">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExpandNote(note.noteId);
                    }}
                  >
                    <ExpandMoreIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };

  // Render detailed note view (keep as is - too long to repeat)
  const renderNoteDetail = (note: ComprehensiveDebitNoteView) => {
    if (!note) return null;

    const isItemWise = note.noteType === 'item_wise' || (note.items && note.items.length > 0);
    const statusColor = getStatusColor(note.status);
    const statusIcon = getStatusIcon(note.status);
    const finalAmount = note.finalAmount || note.totalAmount || 0;
    const pendingAmount = note.pendingAmount || (note.status === 'Active' ? finalAmount : 0);
    const totalAmount = note.totalAmount || 0;

    return (
      <Box>
        <Stack 
          direction="row" 
          spacing={2} 
          alignItems="center" 
          sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}
        >
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBackToList}
            variant="outlined"
            size="small"
          >
            Back to List
          </Button>
          
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" fontWeight="bold">
              Debit Note: {note.noteNumber}
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Document Type: {formatDocumentType(note.documentType)}
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={1} alignItems="center">
            {renderNoteTypeBadge(note)}
            <Chip
              label={note.status || 'Active'}
              color={statusColor}
              icon={statusIcon}
            />
            <Tooltip title="Download PDF">
              <IconButton
                onClick={() => handleDownloadSinglePdf(note.noteId)}
                color="primary"
              >
                <PictureAsPdfIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Basic Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Note ID:</Typography>
                    <Typography variant="body2">{note.noteNumber || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Document Type:</Typography>
                    <Typography variant="body2">{formatDocumentType(note.documentType)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Vendor:</Typography>
                    <Typography variant="body2">{note.vendorName || 'N/A'}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Aging Days:</Typography>
                    <Typography variant="body2">{note.agingDays || 0} days</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="textSecondary">Created:</Typography>
                    <Typography variant="body2">{formatDate(note.createdDate)} by {note.createdBy || 'system'}</Typography>
                  </Grid>
                  {note.reason && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">Reason:</Typography>
                      <Typography variant="body2">{note.reason}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Financial Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Total Amount:</Typography>
                    <Typography variant="body2" fontWeight="bold">{formatCurrency(totalAmount)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Final Amount:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">{formatCurrency(finalAmount)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="textSecondary">Pending Amount:</Typography>
                    <Typography variant="body2" fontWeight="bold" color="error">{formatCurrency(pendingAmount)}</Typography>
                  </Grid>
                  {note.remainingPayableAmount != null && (
                    <Grid item xs={6}>
                      <Typography variant="body2" color="textSecondary">Remaining Payable:</Typography>
                      <Typography variant="body2" fontWeight="bold">{formatCurrency(note.remainingPayableAmount)}</Typography>
                    </Grid>
                  )}
                  {note.clearedDate && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary">Cleared:</Typography>
                      <Typography variant="body2">{formatDate(note.clearedDate)} by {note.clearedBy || 'system'}</Typography>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {isItemWise && note.items && note.items.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Item Details ({note.items.length} items)
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>Item Name</TableCell>
                      <TableCell align="center">Type</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell align="right">Final</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {note.items.map((item, idx: number) => (
                      <TableRow key={idx} hover>
                        <TableCell>
                          <Typography variant="body2">{item.itemName || 'N/A'}</Typography>
                          <Typography variant="caption" color="textSecondary">ID: {item.itemId}</Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip label={item.noteType || 'debit'} size="small" color={item.noteType === 'credit' ? 'error' : 'primary'} />
                        </TableCell>
                        <TableCell align="right">{item.quantity || 0}</TableCell>
                        <TableCell align="right">{formatCurrency(item.unitPrice || 0)}</TableCell>
                        <TableCell align="right">{formatCurrency(item.totalPrice || 0)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight="bold">{formatCurrency(item.finalPrice || item.totalPrice || 0)}</Typography>
                        </TableCell>
                        <TableCell>{item.reason || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}

        {note.paymentHistory && note.paymentHistory.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Payment History</Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'grey.50' }}>
                      <TableCell>Date</TableCell>
                      <TableCell>Outgoing Payment</TableCell>
                      <TableCell>Cleared By</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {note.paymentHistory.map((payment, idx: number) => (
                      <TableRow key={idx} hover>
                        <TableCell>{formatDate(payment.date)}</TableCell>
                        <TableCell>{payment.outgoingPaymentId || '-'}</TableCell>
                        <TableCell>{payment.clearedBy || '-'}</TableCell>
                        <TableCell align="right">{formatCurrency(payment.amount || 0)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  // Render summary view
  const renderSummaryView = () => {
    if (isLoadingView) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading debit notes summary...</Typography>
        </Box>
      );
    }

    if (allDebitNotes.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <DescriptionIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">No Debit/Credit Notes Found</Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>Document: {documentId}</Typography>
          {documentType && <Typography variant="body2" color="textSecondary">Type: {formatDocumentType(documentType)}</Typography>}
        </Box>
      );
    }

    if (viewMode === 'detail' && selectedNote) {
      return renderNoteDetail(selectedNote);
    }

    return (
      <Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} sm={3}>
            <Card><CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="primary">{stats.totalCount}</Typography>
              <Typography variant="caption" color="textSecondary">Total Notes</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card><CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="center">
                <ListAltIcon color="primary" sx={{ mr: 0.5, fontSize: '1rem' }} />
                <Typography variant="h4" color="primary">{stats.itemWiseCount}</Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">Item-wise</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card><CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Box display="flex" alignItems="center" justifyContent="center">
                <AttachMoneyIcon color="secondary" sx={{ mr: 0.5, fontSize: '1rem' }} />
                <Typography variant="h4" color="secondary">{stats.amountOnlyCount}</Typography>
              </Box>
              <Typography variant="caption" color="textSecondary">Amount-only</Typography>
            </CardContent></Card>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Card><CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="h4" color="primary">{formatCurrency(stats.totalAmount)}</Typography>
              <Typography variant="caption" color="textSecondary">Total Amount</Typography>
            </CardContent></Card>
          </Grid>
        </Grid>

        {/* Active Notes Section */}
        {activeNotes.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">Active Notes ({activeNotes.length})</Typography>
              <Chip label={`${formatCurrency(activeNotes.reduce((sum, note) => sum + (note.pendingAmount || (note.status === 'Active' ? (note.finalAmount || note.totalAmount || 0) : 0)), 0))} pending`} color="error" variant="outlined" size="small" sx={{ ml: 2 }} />
            </Box>
            {activeNotes.map(note => renderNoteCard(note))}
          </Box>
        )}

        {/* Cleared Notes Section */}
        {clearedNotes.length > 0 && (
          <Box>
            <Box display="flex" alignItems="center" sx={{ mb: 2 }}>
              <Badge badgeContent={clearedNotes.length} color="success">
                <Typography variant="h6">Cleared Notes ({clearedNotes.length})</Typography>
              </Badge>
              <Chip label={`${formatCurrency(clearedNotes.reduce((sum, note) => sum + (note.finalAmount || note.totalAmount || 0), 0))} cleared`} color="success" variant="outlined" size="small" sx={{ ml: 2 }} />
            </Box>
            {clearedNotes.map(note => renderNoteCard(note))}
          </Box>
        )}

        {/* Download All Button */}
        {allDebitNotes.length > 0 && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button variant="contained" startIcon={<DownloadIcon />} onClick={handleDownloadAllPdf} disabled={!documentId}>
              Download All Notes as PDF
            </Button>
          </Box>
        )}

        {summary?.availableForNewDebit !== undefined && (
          <Alert severity="info" sx={{ mt: 3 }}>
            Available for new debit note: <strong>{formatCurrency(summary.availableForNewDebit)}</strong>
          </Alert>
        )}
      </Box>
    );
  };

  // Render detailed list view
  const renderDetailedView = () => {
    if (isLoadingView) {
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4 }}>
          <CircularProgress />
          <Typography sx={{ mt: 2 }}>Loading detailed view...</Typography>
        </Box>
      );
    }

    if (allDebitNotes.length === 0) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <DescriptionIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} />
          <Typography variant="h6" color="textSecondary">No Debit/Credit Notes Found</Typography>
        </Box>
      );
    }

    if (viewMode === 'detail' && selectedNote) {
      return renderNoteDetail(selectedNote);
    }

    return (
      <Box>
        <Typography variant="h6" gutterBottom>All Debit Notes ({allDebitNotes.length})</Typography>
        {allDebitNotes.map((note) => (
          <Accordion key={note.noteId} expanded={expandedNote === note.noteId} onChange={() => handleExpandNote(note.noteId)} sx={{ mb: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, gap: 1 }}>
                  {getNoteTypeIcon(note.noteType)}
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{note.noteNumber}</Typography>
                    <Typography variant="body2" color="textSecondary">Created: {formatDate(note.createdDate)}</Typography>
                  </Box>
                </Box>
                <Typography variant="h6" color="primary">{formatCurrency(note.finalAmount || note.totalAmount || 0)}</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Vendor:</strong> {note.vendorName || 'N/A'}</Typography>
                  {note.reason && <Typography variant="body2"><strong>Reason:</strong> {note.reason}</Typography>}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2"><strong>Total:</strong> {formatCurrency(note.totalAmount || 0)}</Typography>
                  <Typography variant="body2" color="error"><strong>Pending:</strong> {formatCurrency(note.pendingAmount || 0)}</Typography>
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                <Button variant="outlined" size="small" startIcon={<VisibilityIcon />} onClick={() => handleViewNoteDetail(note)}>View Details</Button>
                <Button variant="outlined" size="small" startIcon={<PictureAsPdfIcon />} onClick={() => handleDownloadSinglePdf(note.noteId)}>Download PDF</Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  // Render tabs for different views
  const renderDocumentTypeTabs = () => {
    return (
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<SummarizeIcon />} label="Summary" iconPosition="start" />
          <Tab icon={<DescriptionIcon />} label="Detailed" iconPosition="start" />
          {itemWiseNotes.length > 0 && <Tab icon={<ListAltIcon />} label={<Badge badgeContent={itemWiseNotes.length} color="primary">Item-wise</Badge>} iconPosition="start" />}
          {amountOnlyNotes.length > 0 && <Tab icon={<AttachMoneyIcon />} label={<Badge badgeContent={amountOnlyNotes.length} color="secondary">Amount-only</Badge>} iconPosition="start" />}
        </Tabs>
      </Box>
    );
  };

  const getVendorName = () => {
    if (allDebitNotes.length > 0 && allDebitNotes[0].vendorName) {
      return allDebitNotes[0].vendorName;
    }
    return '';
  };

  return (
    <Dialog open={dialogOpen} onClose={handleClose} maxWidth="xl" fullWidth PaperProps={{ sx: { maxHeight: '90vh', minHeight: '70vh' } }}>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              <ReceiptIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Debit/Credit Notes
            </Typography>
            <Typography variant="body2" color="textSecondary">
              Document: {documentId} • Type: {formatDocumentType(documentType)}
              {getVendorName() && ` • Vendor: ${getVendorName()}`}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center">
            {documentId && allDebitNotes.length > 0 && (
              <Tooltip title="Download all notes as PDF">
                <IconButton onClick={handleDownloadAllPdf} color="primary" size="small" sx={{ mr: 1 }}>
                  <SummarizeIcon />
                </IconButton>
              </Tooltip>
            )}
            <IconButton onClick={handleClose} size="small"><CloseIcon /></IconButton>
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {renderDocumentTypeTabs()}
        <TabPanel value={tabValue} index={0}>{renderSummaryView()}</TabPanel>
        <TabPanel value={tabValue} index={1}>{renderDetailedView()}</TabPanel>
        <TabPanel value={tabValue} index={2}>
          {itemWiseNotes.length > 0 ? (
            <Box>{viewMode === 'detail' && selectedNote ? renderNoteDetail(selectedNote) : itemWiseNotes.map((note, idx) => <div key={`item-wise-${idx}`}>{renderNoteCard(note)}</div>)}</Box>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}><ListAltIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} /><Typography color="textSecondary">No item-wise notes found</Typography></Box>
          )}
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          {amountOnlyNotes.length > 0 ? (
            <Box>{viewMode === 'detail' && selectedNote ? renderNoteDetail(selectedNote) : amountOnlyNotes.map((note, idx) => <div key={`amount-only-${idx}`}>{renderNoteCard(note)}</div>)}</Box>
          ) : (
            <Box sx={{ p: 3, textAlign: 'center' }}><AttachMoneyIcon sx={{ fontSize: 60, color: 'gray', mb: 2 }} /><Typography color="textSecondary">No amount-only notes found</Typography></Box>
          )}
        </TabPanel>
        {snackbarOpen && <Alert severity="info" sx={{ mt: 2 }}>{snackbarMessage}</Alert>}
      </DialogContent>
    </Dialog>
  );
};

export default DebitCreditNoteDialog;