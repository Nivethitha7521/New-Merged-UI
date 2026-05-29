"use client";
import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Paper,
  Typography,
  Box,
  Alert,
  CircularProgress,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import {
  createAmountOnlyDebitNote,
  setSnackbarMessageGRN,
  setSnackbarOpenGRN,
} from '@/features/yen-purchase/GRN/grnSlice';
import { AppDispatch, RootState } from '@/redux/store';
import CloseIcon from '@mui/icons-material/Close';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ConfirmationDialog from '@/components/confirmationDialog';

interface AmountReturnDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  documentId: string;
  documentType: 'grn' | 'outgoing_payment';
  documentNumber: string;
  maxAmount: number;
  currentPage: number;
  pageSize: number;
}

const AmountReturnDialog: React.FC<AmountReturnDialogProps> = ({
  open,
  onClose,
  onSuccess,
  documentId,
  documentType,
  documentNumber,
  maxAmount,
  currentPage,
  pageSize,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.grn);
  
  const [debitAmount, setDebitAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [createdBy] = useState<string>('system-user');
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [backendError, setBackendError] = useState<{
    message: string;
    available_amount?: number;
    requested_amount?: number;
    original_amount?: number;
    total_existing_debit?: number;
  } | null>(null);

  const isValidForm = debitAmount > 0 && reason.trim().length > 0;

  const handleAmountChange = (value: number) => {
    const numValue = Number(value) || 0;
    setDebitAmount(numValue);
    setBackendError(null); // Clear backend error when user changes amount
    
    if (numValue > maxAmount) {
      setErrorMessage(`Amount cannot exceed maximum available: ₹${maxAmount.toFixed(2)}`);
    } else {
      setErrorMessage('');
    }
  };

  const handleConfirmClick = () => {
    if (!isValidForm) {
      if (debitAmount <= 0) {
        setErrorMessage('Amount must be greater than 0');
      } else if (debitAmount > maxAmount) {
        setErrorMessage(`Amount cannot exceed maximum available: ₹${maxAmount.toFixed(2)}`);
      } else if (!reason.trim()) {
        setErrorMessage('Reason is required');
      }
      return;
    }

    setErrorMessage('');
    setBackendError(null);
    setConfirmDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      setConfirmDialogOpen(false);
      setIsSubmitting(true);
      setBackendError(null);
      
      const payload = {
        documentId,
        documentType,
        totalAmount: debitAmount,
        reason,
        createdBy,
        comments: '',
      };

      const result = await dispatch(createAmountOnlyDebitNote(payload)).unwrap();
      
      dispatch(setSnackbarMessageGRN(result.message || 'Debit note created successfully'));
      dispatch(setSnackbarOpenGRN(true));
      
      onSuccess();
      resetForm();
      setIsSubmitting(false);
      onClose();
      
    } catch (error: any) {
      console.error('Failed to create amount-only debit note:', error);
      
      // 🔥 Parse the backend error response
      let errorMsg = 'Failed to create debit note';
      let availableAmount = 0;
      let requestedAmount = debitAmount;
      let originalAmount = 0;
      let totalExistingDebit = 0;
      
      // Check for error from the rejected thunk
      if (error.payload) {
        try {
          // If payload is a string, try to parse it
          if (typeof error.payload === 'string') {
            const parsedError = JSON.parse(error.payload);
            errorMsg = parsedError.message || parsedError.detail?.message || error.payload;
            availableAmount = parsedError.available_amount || 0;
            requestedAmount = parsedError.requested_amount || debitAmount;
            originalAmount = parsedError.original_payable_amount || 0;
            totalExistingDebit = parsedError.total_existing_debit || 0;
          } 
          // If payload is an object
          else if (typeof error.payload === 'object') {
            errorMsg = error.payload.message || error.payload.detail?.message || 'Amount exceeds available limit';
            availableAmount = error.payload.available_amount || 0;
            requestedAmount = error.payload.requested_amount || debitAmount;
            originalAmount = error.payload.original_payable_amount || 0;
            totalExistingDebit = error.payload.total_existing_debit || 0;
          }
        } catch {
          errorMsg = error.payload || 'Failed to create debit note';
        }
      }
      
      // Check for error from HTTP response
      if (error.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object') {
          errorMsg = errorData.message || errorData.detail?.message || 'Amount exceeds available limit';
          availableAmount = errorData.available_amount || 0;
          requestedAmount = errorData.requested_amount || debitAmount;
          originalAmount = errorData.original_payable_amount || 0;
          totalExistingDebit = errorData.total_existing_debit || 0;
        }
      }
      
      // Check for error detail in the rejection
      if (error.detail) {
        if (typeof error.detail === 'object') {
          errorMsg = error.detail.message || error.detail.detail?.message || 'Amount exceeds available limit';
          availableAmount = error.detail.available_amount || 0;
        } else if (typeof error.detail === 'string') {
          errorMsg = error.detail;
        }
      }
      
      // Set backend error to display in UI
      setBackendError({
        message: errorMsg,
        available_amount: availableAmount,
        requested_amount: requestedAmount,
        original_amount: originalAmount,
        total_existing_debit: totalExistingDebit,
      });
      
      setIsSubmitting(false);
    }
  };

  const handleConfirmationClose = () => {
    setConfirmDialogOpen(false);
  };

  const resetForm = () => {
    setDebitAmount(0);
    setReason('');
    setErrorMessage('');
    setBackendError(null);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      resetForm();
      onClose();
    }
  };

  const isLoading = loading || isSubmitting;

  // Calculate available amount display
  const availableAmount = backendError?.available_amount !== undefined 
    ? backendError.available_amount 
    : maxAmount;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 }
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          bgcolor: '#f5f5f5',
          borderBottom: 1,
          borderColor: 'divider'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <AttachMoneyIcon color="primary" />
            <Typography variant="h6">
              Amount-wise Return / Debit Note
            </Typography>
          </Box>
          <IconButton onClick={handleClose} size="small" disabled={isLoading}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>Note:</strong> This creates a financial debit note without modifying item quantities.
            </Typography>
          </Alert>

          {/* 🔥 Display Backend Error with Details */}
          {backendError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {backendError.message}
              </Typography>
              <Box sx={{ mt: 1, fontSize: '0.875rem' }}>
                {backendError.original_amount !== undefined && (
                  <div>📄 Original GRN Amount: ₹{backendError.original_amount.toFixed(2)}</div>
                )}
                {backendError.total_existing_debit !== undefined && (
                  <div>📋 Already Returned Amount: ₹{backendError.total_existing_debit.toFixed(2)}</div>
                )}
                {backendError.available_amount !== undefined && (
                  <div>✅ Available for Return: ₹{backendError.available_amount.toFixed(2)}</div>
                )}
                {backendError.requested_amount !== undefined && (
                  <div>❌ Requested Amount: ₹{backendError.requested_amount.toFixed(2)}</div>
                )}
              </Box>
            </Alert>
          )}

          {/* Frontend Validation Error */}
          {errorMessage && !backendError && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {errorMessage}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Document Info */}
            <Grid item xs={12}>
              <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fafafa' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Document Type:
                    </Typography>
                    <Typography fontWeight="medium">
                      {documentType === 'grn' ? 'GRN' : 'Purchase Return'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Document No:
                    </Typography>
                    <Typography fontWeight="medium">
                      {documentNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Available for Return:
                    </Typography>
                    <Typography fontWeight="bold" color="primary" fontSize="1.1rem">
                      ₹{availableAmount.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Amount Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Return Amount (₹)"
                type="number"
                value={debitAmount || ''}
                onChange={(e) => handleAmountChange(Number(e.target.value) || 0)}
                InputProps={{
                  inputProps: { 
                    min: 0.01, 
                    step: 0.01
                  },
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography>₹</Typography>
                    </InputAdornment>
                  ),
                }}
                helperText={`Maximum available: ₹${availableAmount.toFixed(2)}`}
                error={debitAmount > availableAmount || !!errorMessage}
                autoComplete="off"
                disabled={isLoading}
              />
            </Grid>

            {/* Reason Field */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Reason for Return"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Enter reason for return..."
                multiline
                rows={2}
                autoComplete="off"
                disabled={isLoading}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 0 }}>
          <Button onClick={handleClose} color="inherit" disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmClick}
            disabled={!isValidForm || debitAmount > availableAmount || isLoading}
            startIcon={
              isLoading ? 
                <CircularProgress size={20} color="inherit" /> : 
                <AttachMoneyIcon />
            }
          >
            {isLoading ? 'Creating...' : 'Create Debit Note'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={handleConfirmationClose}
        onConfirm={handleSubmit}
        title="Confirm Debit Note Creation"
        description={
          <Box>
            <Typography variant="body1" gutterBottom>
              Are you sure you want to create this debit note?
            </Typography>
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
              <Typography variant="body2"><strong>Document:</strong> {documentNumber}</Typography>
              <Typography variant="body2"><strong>Amount:</strong> ₹{debitAmount.toFixed(2)}</Typography>
              <Typography variant="body2"><strong>Reason:</strong> {reason}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Remaining available after this: ₹{(availableAmount - debitAmount).toFixed(2)}
              </Typography>
            </Box>
          </Box>
        }
        confirmText="OK"
        cancelText="Cancel"
      />
    </>
  );
};

export default AmountReturnDialog;