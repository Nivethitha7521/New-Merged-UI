"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Paper,
  Snackbar,
  Box,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import { returnGrn, fetchGrns, setSelectedGrnId, fetchReturnReasons, addReturnReason, setSnackbarMessageGRN, setSnackbarOpenGRN, fetchGrnById } from '../../../features/yen-purchase/GRN/grnSlice';
import { ReturnGRNRequest, ItemDetail, ReturnReason } from '@/Models/grnModel';
import { AppDispatch, RootState } from '@/redux/store';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

interface EditedItem {
  returnedQuantity: number;
  nos: number;
  eachQuantity: number;
  returnReason: string;
  customReason: string;
}

interface GrnReturnDialogProps {
  dialogItems: ItemDetail[];
  selectedGrnId: string | null;
  currentPage: number;
  pageSize: number;
  status?: string;
  fromDate?: string | undefined;
  toDate?: string | undefined;
  onReturnComplete: () => void;
  onCancel: () => void;
}

const GrnReturnDialog: React.FC<GrnReturnDialogProps> = ({
  dialogItems,
  selectedGrnId,
  currentPage,
  pageSize,
  status,
  fromDate,
  toDate,
  onReturnComplete,
  onCancel,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { returnReasons, snackbarMessageGRN, snackbarOpenGRN, loading } = useSelector((state: RootState) => state.grn);
  const { username } = useSelector((state: RootState) => state.auth);
  const [dialogOpen, setDialogOpen] = useState(true);
  const [dialogReturnOpen, setDialogReturnOpen] = useState(false);
  const [returnScenario, setReturnScenario] = useState<'full' | 'partial' | null>(null);
  const [returnReason, setReturnReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [selectedItemsForReturn, setSelectedItemsForReturn] = useState<Set<string>>(new Set());
  const [editedItems, setEditedItems] = useState<{ [itemId: string]: EditedItem }>({});
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 🔥 New state for amount limit validation
  const [grnOriginalAmount, setGrnOriginalAmount] = useState<number>(0);
  const [totalExistingReturns, setTotalExistingReturns] = useState<number>(0);
  const [availableReturnAmount, setAvailableReturnAmount] = useState<number>(0);
  const [amountLimitError, setAmountLimitError] = useState<string | null>(null);
  const [backendErrorDetail, setBackendErrorDetail] = useState<any>(null);

  // Filter out "Other" option - only use dropdown reasons
  const dropdownReasons = returnReasons.filter(r => r.reason !== 'Other');

  const customRound = (value: number): number => {
    return Math.round(value * 100) / 100;
  };

  const getMaxReturnable = (item: ItemDetail): number => {
    return customRound((item.receivedQuantity || 0) - (item.returnedQuantity || 0));
  };

  const calculateItemTotal = (item: ItemDetail, returnedQuantity: number): number => {
    return customRound(returnedQuantity * (item.unitPrice || 0));
  };

  // 🔥 Calculate total return amount for selected items
  const calculateTotalReturnAmount = (): number => {
    if (returnScenario === 'full') {
      return dialogItems.reduce((total, item) => {
        const maxReturnable = getMaxReturnable(item);
        return total + calculateItemTotal(item, maxReturnable);
      }, 0);
    } else if (returnScenario === 'partial') {
      return Array.from(selectedItemsForReturn).reduce((total, itemId) => {
        const item = dialogItems.find(i => i.itemId === itemId);
        const edited = editedItems[itemId];
        if (item && edited && edited.returnedQuantity > 0) {
          return total + calculateItemTotal(item, edited.returnedQuantity);
        }
        return total;
      }, 0);
    }
    return 0;
  };

  // 🔥 Fetch GRN details to get original amount and existing returns
  useEffect(() => {
    const fetchGrnDetails = async () => {
      if (selectedGrnId) {
        try {
          const grnData = await dispatch(fetchGrnById(selectedGrnId)).unwrap();
          
          // Get original GRN amount
          const originalAmount = grnData.grandTotal || grnData.totalReceivedAmount || 0;
          setGrnOriginalAmount(originalAmount);
          
          // Calculate total existing returns from GRN
          const existingReturns = grnData.itemDetails?.reduce((total: number, item: any) => {
            return total + (item.returnedFinalPrice || 0);
          }, 0) || 0;
          setTotalExistingReturns(existingReturns);
          
          const available = originalAmount - existingReturns;
          setAvailableReturnAmount(available > 0 ? available : 0);
          
          console.log('GRN Return Limits:', {
            originalAmount,
            existingReturns,
            availableReturnAmount: available > 0 ? available : 0
          });
        } catch (error) {
          console.error('Failed to fetch GRN details:', error);
        }
      }
    };
    
    fetchGrnDetails();
  }, [selectedGrnId, dispatch]);

  // 🔥 Check if current return would exceed available amount
  const checkAmountLimit = (): { isExceeded: boolean; message: string } => {
    const totalReturnAmount = calculateTotalReturnAmount();
    
    if (totalReturnAmount > availableReturnAmount && availableReturnAmount > 0) {
      return {
        isExceeded: true,
        message: `Return amount ₹${totalReturnAmount.toFixed(2)} exceeds available limit ₹${availableReturnAmount.toFixed(2)}. Total returns cannot exceed GRN value ₹${grnOriginalAmount.toFixed(2)}.`
      };
    }
    
    if (totalReturnAmount > grnOriginalAmount) {
      return {
        isExceeded: true,
        message: `Return amount ₹${totalReturnAmount.toFixed(2)} exceeds GRN original value ₹${grnOriginalAmount.toFixed(2)}.`
      };
    }
    
    return { isExceeded: false, message: '' };
  };

  const calculateNosAndEachQuantity = (item: ItemDetail, returnedQuantity: number): { nos: number; eachQuantity: number } => {
    const maxReturnable = getMaxReturnable(item);
    const originalEachQuantity = item.eachQuantity || 1;
    const originalNos = item.nos || 0;

    if (returnedQuantity <= 0) {
      return { nos: 0, eachQuantity: originalEachQuantity };
    }

    if (returnedQuantity >= maxReturnable) {
      return { nos: originalNos, eachQuantity: originalEachQuantity };
    }

    let nos = Math.floor(returnedQuantity / originalEachQuantity);
    let eachQuantity = originalEachQuantity;
    let remaining = returnedQuantity % originalEachQuantity;

    if (remaining > 0) {
      eachQuantity = customRound(returnedQuantity / (nos + 1));
      nos = Math.ceil(returnedQuantity / eachQuantity);
    }

    return { nos: customRound(nos), eachQuantity: customRound(eachQuantity) };
  };

  useEffect(() => {
    if (returnReasons.length === 0) {
      dispatch(fetchReturnReasons());
    }
  }, [dispatch, returnReasons.length]);
  // ✅ Add this function - Toggle Full Screen
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  const handleEditReturn = (itemId: string, field: string, value: number | string) => {
    const dialogItem = dialogItems.find((i) => i.itemId === itemId);
    if (!dialogItem) return;

    const maxReturnable = getMaxReturnable(dialogItem);

    if (field === 'returnedQuantity') {
      const enteredQuantity = Number(value);
      if (enteredQuantity > maxReturnable) {
        setTimeout(() => {
          dispatch(setSnackbarMessageGRN(`Cannot return more than ${maxReturnable} units for ${dialogItem.itemName ?? 'this item'}.`));
          dispatch(setSnackbarOpenGRN(true));
        }, 0);
        return;
      }
    }

    setEditedItems((prev) => {
      const existingItem = prev[itemId] || {
        returnedQuantity: 0,
        nos: 0,
        eachQuantity: dialogItem.eachQuantity || 1,
        returnReason: '',
        customReason: '',
      };

      let updatedItem = { ...existingItem };

      if (field === 'returnedQuantity') {
        const enteredQuantity = Number(value);
        const { nos, eachQuantity } = calculateNosAndEachQuantity(dialogItem, enteredQuantity);
        updatedItem = { ...updatedItem, returnedQuantity: customRound(enteredQuantity), nos, eachQuantity };
      } else if (field === 'returnReason') {
        updatedItem = { ...updatedItem, returnReason: String(value) };
      }

      return { ...prev, [itemId]: updatedItem };
    });

    if (returnScenario === 'partial' && field === 'returnedQuantity') {
      setSelectedItemsForReturn((prev) => new Set(prev).add(itemId));
    }
    
    // 🔥 Clear amount limit error when user changes quantities
    setAmountLimitError(null);
    setBackendErrorDetail(null);
  };

  const handleCheckboxChange = (itemId: string) => {
    setSelectedItemsForReturn((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
        setEditedItems((prev) => {
          const { [itemId]: _, ...rest } = prev;
          return rest;
        });
      } else {
        newSet.add(itemId);
        const dialogItem = dialogItems.find((i) => i.itemId === itemId);
        if (dialogItem && !editedItems[itemId]) {
          setEditedItems((prev) => ({
            ...prev,
            [itemId]: {
              returnedQuantity: 0,
              nos: 0,
              eachQuantity: dialogItem.eachQuantity || 1,
              returnReason: '',
              customReason: '',
            },
          }));
        }
      }
      return newSet;
    });
    
    setAmountLimitError(null);
    setBackendErrorDetail(null);
  };

  const handleReturnClick = (scenario: 'full' | 'partial') => {
    setReturnReason('');
    setCustomReason('');
    setSelectedItemsForReturn(new Set());
    setEditedItems({});
    setAmountLimitError(null);
    setBackendErrorDetail(null);
    setReturnScenario(scenario);
  };

  const handleClearSelections = () => {
    setReturnReason('');
    setCustomReason('');
    setSelectedItemsForReturn(new Set());
    setEditedItems({});
    setReturnScenario(null);
    setAmountLimitError(null);
    setBackendErrorDetail(null);
  };

  const handleSubmit = async () => {
    if (!selectedGrnId) {
      dispatch(setSnackbarMessageGRN('No GRN selected to return.'));
      dispatch(setSnackbarOpenGRN(true));
      return;
    }

    if (!returnScenario) {
      dispatch(setSnackbarMessageGRN('Please select a return scenario.'));
      dispatch(setSnackbarOpenGRN(true));
      return;
    }

    // 🔥 Check amount limit before submission
    const amountCheck = checkAmountLimit();
    if (amountCheck.isExceeded) {
      setAmountLimitError(amountCheck.message);
      dispatch(setSnackbarMessageGRN(amountCheck.message));
      dispatch(setSnackbarOpenGRN(true));
      return;
    }

    if (returnScenario === 'full' && !returnReason.trim()) {
      dispatch(setSnackbarMessageGRN("Please provide a return reason for 'Return All'."));
      dispatch(setSnackbarOpenGRN(true));
      return;
    }

    if (returnScenario === 'partial') {
      if (selectedItemsForReturn.size === 0) {
        dispatch(setSnackbarMessageGRN('Please select at least one item to return.'));
        dispatch(setSnackbarOpenGRN(true));
        return;
      }

      const missingReasons = Array.from(selectedItemsForReturn).filter(
        (itemId) => !editedItems[itemId]?.returnReason?.trim()
      );
      if (missingReasons.length > 0) {
        dispatch(setSnackbarMessageGRN('Please provide a return reason for all selected items.'));
        dispatch(setSnackbarOpenGRN(true));
        return;
      }

      const invalidQuantities = Array.from(selectedItemsForReturn).filter(
        (itemId) => editedItems[itemId]?.returnedQuantity <= 0
      );
      if (invalidQuantities.length > 0) {
        dispatch(setSnackbarMessageGRN('Invalid quantities detected. Ensure return quantity is greater than 0.'));
        dispatch(setSnackbarOpenGRN(true));
        return;
      }
    }

    setDialogReturnOpen(true);
  };

  const handleDialogClose = () => {
    if (!isSubmitting) {
      setDialogOpen(false);
      onCancel();
    }
  };

  const handleReturnCancel = () => {
    if (!isSubmitting) {
      setDialogReturnOpen(false);
    }
  };

  const handleReturn = async () => {
    if (!selectedGrnId || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    const returnedBy = username || 'unknown_user';
    const returnData: ReturnGRNRequest = {
      scenario: returnScenario!,
      returnedDate: new Date().toISOString(),
      returnedBy: returnedBy,
      comments: returnReason,
      items: returnScenario === 'partial'
        ? Array.from(selectedItemsForReturn).map((itemId) => {
            const edited = editedItems[itemId];
            return {
              itemId,
              nos: edited.nos,
              eachQuantity: edited.eachQuantity,
              returnedQuantity: edited.returnedQuantity,
              returnReason: edited.returnReason,
            };
          })
        : dialogItems.map((item) => {
            const maxReturnable = getMaxReturnable(item);
            const { nos, eachQuantity } = calculateNosAndEachQuantity(item, maxReturnable);
            return {
              itemId: item.itemId,
              nos,
              eachQuantity,
              returnedQuantity: maxReturnable,
              returnReason: returnReason,
            };
          }),
    };

    try {
      const resultAction = await dispatch(returnGrn({ grnId: selectedGrnId, returnData })).unwrap();
      dispatch(setSnackbarMessageGRN('Items returned successfully.'));
      dispatch(setSnackbarOpenGRN(true));
      const fromDateObj = fromDate ? new Date(fromDate) : undefined;
      const toDateObj = toDate ? new Date(toDate) : undefined;
      await dispatch(
        fetchGrns({ page: currentPage, size: pageSize, status, fromDate: fromDateObj, toDate: toDateObj })
      );
      setDialogOpen(false);
      setDialogReturnOpen(false);
      setSelectedItemsForReturn(new Set());
      setReturnReason('');
      setCustomReason('');
      setEditedItems({});
      setReturnScenario(null);
      setAmountLimitError(null);
      setBackendErrorDetail(null);
      dispatch(setSelectedGrnId(null));
      onReturnComplete();
    } catch (error: any) {
      let errorMessage = 'Failed to return items. Please try again.';
      
      // 🔥 Parse backend error response
      if (error?.detail) {
        if (typeof error.detail === 'string') {
          errorMessage = error.detail;
        } else if (error.detail.message) {
          errorMessage = error.detail.message;
          setBackendErrorDetail(error.detail);
        } else if (typeof error.detail === 'object') {
          errorMessage = JSON.stringify(error.detail);
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      dispatch(setSnackbarMessageGRN(errorMessage));
      dispatch(setSnackbarOpenGRN(true));
      console.error('Error returning items:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isLoading = loading || isSubmitting;
  const totalReturnAmount = calculateTotalReturnAmount();

  return (
    <>
      <Dialog
        open={dialogOpen}
        onClose={handleDialogClose}
        disableEscapeKeyDown
        maxWidth={false}
        fullWidth={true}
        fullScreen={isFullScreen}
        container={document.body}
        disablePortal={false}
        sx={isFullScreen ? {
          '& .MuiDialog-container': {
            position: 'fixed !important',
            top: '0 !important',
            left: '0 !important',
            right: '0 !important',
            bottom: '0 !important',
            width: '100vw !important',
            height: '100vh !important',
            maxWidth: 'none !important',
            maxHeight: 'none !important',
            margin: '0 !important',
            zIndex: 9999,
          },
          '& .MuiDialog-paper': {
            width: '100vw !important',
            height: '100vh !important',
            maxWidth: 'none !important',
            maxHeight: 'none !important',
            margin: '0 !important',
            borderRadius: '0 !important',
          }
        } : {}}
        PaperProps={{
          style: {
            height: isFullScreen ? '100vh' : 'auto',
            width: isFullScreen ? '100vw' : '90vw',
            maxWidth: isFullScreen ? 'none' : 'none',
            margin: isFullScreen ? 0 : 'auto',
            borderRadius: isFullScreen ? 0 : undefined,
          },
        }}
      >
        <DialogTitle sx={{
          fontWeight: 'bold',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: isFullScreen ? '16px 24px' : '16px'
        }}>
          GRN Return Details
          <IconButton onClick={toggleFullScreen} color="primary" edge="end" disabled={isLoading}>
            {isFullScreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{
          padding: isFullScreen ? '0 24px' : '20px',
          height: isFullScreen ? 'calc(100vh - 120px)' : 'auto',
          overflow: 'auto'
        }}>
          {/* 🔥 Amount Limit Warning */}
          {availableReturnAmount > 0 && (
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Return Limits:</strong> GRN Value: ₹{grnOriginalAmount.toFixed(2)} | 
                Already Returned: ₹{totalExistingReturns.toFixed(2)} | 
                Available: ₹{availableReturnAmount.toFixed(2)}
              </Typography>
            </Alert>
          )}

          {/* 🔥 Amount Limit Error */}
          {amountLimitError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="body2">
                {amountLimitError}
              </Typography>
              <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                Total return amount: ₹{totalReturnAmount.toFixed(2)}
              </Typography>
            </Alert>
          )}

          {/* 🔥 Backend Error Detail */}
          {backendErrorDetail && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold">
                {backendErrorDetail.message || 'Return amount limit exceeded'}
              </Typography>
              {backendErrorDetail.original_payable_amount !== undefined && (
                <Typography variant="body2">GRN Value: ₹{backendErrorDetail.original_payable_amount.toFixed(2)}</Typography>
              )}
              {backendErrorDetail.total_existing_debit !== undefined && (
                <Typography variant="body2">Already Returned: ₹{backendErrorDetail.total_existing_debit.toFixed(2)}</Typography>
              )}
              {backendErrorDetail.available_amount !== undefined && (
                <Typography variant="body2">Available: ₹{backendErrorDetail.available_amount.toFixed(2)}</Typography>
              )}
            </Alert>
          )}

          {/* Show current return amount while selecting */}
          {returnScenario && totalReturnAmount > 0 && !amountLimitError && (
            <Alert severity={totalReturnAmount <= availableReturnAmount ? "success" : "warning"} sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>Return Amount:</strong> ₹{totalReturnAmount.toFixed(2)}
                {totalReturnAmount <= availableReturnAmount && availableReturnAmount > 0 && (
                  <span> ✓ Within limit (₹{availableReturnAmount.toFixed(2)} available)</span>
                )}
                {totalReturnAmount > availableReturnAmount && availableReturnAmount > 0 && (
                  <span style={{ color: 'red' }}> ✗ Exceeds available limit by ₹{(totalReturnAmount - availableReturnAmount).toFixed(2)}</span>
                )}
              </Typography>
            </Alert>
          )}

          <Typography variant="h6" gutterBottom>
            Select a return option below.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 1, mb: 2, flexWrap: 'wrap', maxWidth: '100%' }}>
            <FormControl sx={{ flex: 2, minWidth: 150 }}>
              <InputLabel>Return Reason (for Return All)</InputLabel>
              <Select
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                disabled={returnScenario !== 'full' || isLoading}
              >
                {dropdownReasons.map((reasonObj) => (
                  <MenuItem key={reasonObj.reason} value={reasonObj.reason}>
                    {reasonObj.reason}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleReturnClick('full')}
              disabled={Boolean(returnScenario && returnScenario !== 'full') || isLoading}
              sx={{ flex: 1, minWidth: 120 }}
            >
              Return GRN
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={() => handleReturnClick('partial')}
              disabled={Boolean(returnScenario && returnScenario !== 'partial') || isLoading}
              sx={{ flex: 1, minWidth: 120 }}
            >
              Return Specific Items
            </Button>
          </Box>
          <TableContainer component={Paper}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Item</TableCell>
                  <TableCell>Received Quantity</TableCell>
                  <TableCell>Returned Quantity</TableCell>
                  <TableCell>Returnable Quantity</TableCell>
                  <TableCell>Return Quantity</TableCell>
                  <TableCell>Nos</TableCell>
                  <TableCell>Each Quantity</TableCell>
                  <TableCell>Return Reason</TableCell>
                  <TableCell>Unit Price</TableCell>
                  <TableCell>Total Price</TableCell>
                  <TableCell>Select</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dialogItems.map((item) => {
                  const maxReturnable = getMaxReturnable(item);
                  const edited = editedItems[item.itemId] || {
                    returnedQuantity: 0,
                    nos: 0,
                    eachQuantity: item.eachQuantity || 1,
                    returnReason: '',
                    customReason: '',
                  };
                  const totalPrice = calculateItemTotal(item, edited.returnedQuantity);
                  const isDisabled = returnScenario === 'full' || !selectedItemsForReturn.has(item.itemId) || isLoading;
                  return (
                    <TableRow key={item.itemId}>
                      <TableCell>{item.itemName ?? 'Unknown Item'}</TableCell>
                      <TableCell>{customRound(item.receivedQuantity || 0)}</TableCell>
                      <TableCell>{customRound(item.returnedQuantity || 0)}</TableCell>
                      <TableCell>{customRound(maxReturnable)}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          value={edited.returnedQuantity}
                          onChange={(e) => handleEditReturn(item.itemId, 'returnedQuantity', Number(e.target.value))}
                          variant="outlined"
                          fullWidth
                          inputProps={{ min: 0, step: 0.01 }}
                          disabled={isDisabled}
                          placeholder="Enter return quantity"
                          autoComplete="off"
                        />
                      </TableCell>
                      <TableCell>{customRound(edited.nos)}</TableCell>
                      <TableCell>{customRound(edited.eachQuantity)}</TableCell>
                      <TableCell>
                        <FormControl fullWidth>
                          <InputLabel>Return Reason</InputLabel>
                          <Select
                            value={edited.returnReason}
                            onChange={(e) => handleEditReturn(item.itemId, 'returnReason', e.target.value)}
                            disabled={isDisabled}
                          >
                            {dropdownReasons.map((reasonObj) => (
                              <MenuItem key={reasonObj.reason} value={reasonObj.reason}>
                                {reasonObj.reason}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>{customRound(item.unitPrice || 0)}</TableCell>
                      <TableCell>{customRound(totalPrice)}</TableCell>
                      <TableCell>
                        <Checkbox
                          checked={selectedItemsForReturn.has(item.itemId)}
                          onChange={() => handleCheckboxChange(item.itemId)}
                          disabled={returnScenario !== 'partial' || maxReturnable <= 0 || isLoading}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="secondary" variant='outlined' disabled={isLoading}>
            Cancel
          </Button>
          {returnScenario && (
            <Button onClick={handleClearSelections} color="warning" variant="outlined" disabled={isLoading}>
              Clear
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            color="primary"
            variant="outlined"
            disabled={!returnScenario || !selectedGrnId || isLoading || (amountLimitError !== null)}
          >
            {isLoading ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog 
        open={dialogReturnOpen} 
        onClose={!isSubmitting ? handleReturnCancel : undefined}
        disableEscapeKeyDown={isSubmitting}
      >
        <DialogTitle>Confirm GRN Return</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {returnScenario === 'full'
              ? `Are you sure you want to return all items for this GRN? Reason: ${returnReason || 'Not provided'}`
              : `Are you sure you want to return the selected items with specified quantities?`}
          </DialogContentText>
          {returnScenario === 'partial' && (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Return Quantity</TableCell>
                    <TableCell>Nos</TableCell>
                    <TableCell>Each Quantity</TableCell>
                    <TableCell>Return Reason</TableCell>
                    <TableCell>Total Price</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Array.from(selectedItemsForReturn).map((itemId) => {
                    const item = dialogItems.find((i) => i.itemId === itemId);
                    const edited = editedItems[itemId];
                    const maxReturnable = getMaxReturnable(item!);
                    const status = edited.returnedQuantity >= maxReturnable ? 'Fully Returned' : 'Partially Returned';
                    return (
                      <TableRow key={itemId}>
                        <TableCell>{item?.itemName ?? 'Unknown Item'}</TableCell>
                        <TableCell>{customRound(edited.returnedQuantity)}</TableCell>
                        <TableCell>{customRound(edited.nos)}</TableCell>
                        <TableCell>{customRound(edited.eachQuantity)}</TableCell>
                        <TableCell>{edited.returnReason}</TableCell>
                        <TableCell>{customRound(calculateItemTotal(item!, edited.returnedQuantity))}</TableCell>
                        <TableCell>{status}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleReturnCancel} 
            color="secondary" 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleReturn} 
            color="primary" 
            variant="contained"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
          >
            {isSubmitting ? 'Processing...' : 'Confirm Return'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpenGRN}
        message={snackbarMessageGRN}
        autoHideDuration={3000}
        onClose={() => dispatch(setSnackbarOpenGRN(false))}
      />
    </>
  );
};

export default GrnReturnDialog;