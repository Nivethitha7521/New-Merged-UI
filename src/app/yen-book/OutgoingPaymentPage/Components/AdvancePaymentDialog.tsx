// components/AdvancePaymentDialog.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Grid,
  Autocomplete,
  CircularProgress,
  InputAdornment,
  Typography,
} from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/redux/store";
import PaymentIcon from "@mui/icons-material/Payment";
import { createAdvancePayment } from "@/features/yen-purchase/Outgoing/advancePaymentSlice";
import { fetchBank } from "@/features/yen-purchase/Outgoing/outgoingPaymentSlice";
import { fetchVendorNames } from "@/features/yen-purchase/PurchaseMaster/vendorSlice";

// Define a unified vendor type
interface UnifiedVendor {
  vendorId: string;
  vendorName: string;
  randomId?: string;
}

interface AdvancePaymentDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedVendor?: UnifiedVendor | null;
}

const AdvancePaymentDialog: React.FC<AdvancePaymentDialogProps> = ({
  open,
  onClose,
  onSuccess,
  preselectedVendor = null,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { vendorName, loading: vendorLoading } = useSelector((state: RootState) => state.vendor);
  const { banks } = useSelector((state: RootState) => state.outgoingPayment);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<UnifiedVendor | null>(preselectedVendor);
  const [formData, setFormData] = useState({
    amount: "",
    paymentDate: "",
    paymentMode: "",
    paymentMethod: "",
    bankName: "",
    neftNo: "",
    rtgsNo: "",
    impsNo: "",
    upi: "",
    remarks: "",
  });
  
  const [errors, setErrors] = useState({
    vendor: "",
    amount: "",
    paymentDate: "",
    paymentMode: "",
    paymentMethod: "",
    bankName: "",
    neftNo: "",
    rtgsNo: "",
    impsNo: "",
    upi: "",
  });

  const today = new Date().toISOString().split('T')[0];
  
  // Memoize unique vendors to prevent unnecessary recalculations
  const uniqueVendors: UnifiedVendor[] = useMemo(() => {
    if (!vendorName || vendorName.length === 0) return [];
    
    const vendorMap = new Map<string, UnifiedVendor>();
    
    vendorName.forEach((item: any) => {
      const vendorId = item.vendorId;
      if (!vendorMap.has(vendorId)) {
        vendorMap.set(vendorId, {
          vendorId: vendorId,
          vendorName: item.vendorName,
          randomId: item.randomId,
        });
      }
    });
    
    return Array.from(vendorMap.values());
  }, [vendorName]);
  
  // Memoize unique banks
  const uniqueBanks = useMemo(() => {
    if (!banks || banks.length === 0) return [];
    const bankMap = new Map();
    banks.forEach((bank: any) => {
      if (!bankMap.has(bank.bankMasterId)) {
        bankMap.set(bank.bankMasterId, bank);
      }
    });
    return Array.from(bankMap.values());
  }, [banks]);

  // Load initial data when dialog opens
  useEffect(() => {
    if (open) {
      dispatch(fetchVendorNames());
      dispatch(fetchBank());
      setFormData(prev => ({ ...prev, paymentDate: today }));
      if (preselectedVendor) {
        setSelectedVendor(preselectedVendor);
      }
    }
  }, [open, dispatch, preselectedVendor, today]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setFormData({
      amount: "",
      paymentDate: today,
      paymentMode: "",
      paymentMethod: "",
      bankName: "",
      neftNo: "",
      rtgsNo: "",
      impsNo: "",
      upi: "",
      remarks: "",
    });
    setErrors({
      vendor: "",
      amount: "",
      paymentDate: "",
      paymentMode: "",
      paymentMethod: "",
      bankName: "",
      neftNo: "",
      rtgsNo: "",
      impsNo: "",
      upi: "",
    });
    setSelectedVendor(preselectedVendor);
    setIsSubmitting(false);
  };

  const validatePaymentDate = (date: string): string => {
    if (!date) return "Payment date is required";
    const selectedDate = new Date(date);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate > currentDate) {
      return "Payment date cannot be in the future";
    }
    return "";
  };

  const validateAmount = (amount: string): string => {
    if (!amount) return "Amount is required";
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return "Invalid amount format";
    if (numAmount <= 0) return "Amount must be greater than 0";
    return "";
  };

  const validateBankDetails = (): boolean => {
    let isValid = true;
    const newErrors = { ...errors };
    
    if (formData.paymentMode === "Bank") {
      if (!formData.bankName) {
        newErrors.bankName = "Bank name is required";
        isValid = false;
      } else {
        newErrors.bankName = "";
      }
      
      if (!formData.paymentMethod) {
        newErrors.paymentMethod = "Payment method is required";
        isValid = false;
      } else {
        newErrors.paymentMethod = "";
      }
      
      switch (formData.paymentMethod) {
        case "neft":
          if (!formData.neftNo) {
            newErrors.neftNo = "NEFT number is required";
            isValid = false;
          } else {
            newErrors.neftNo = "";
          }
          break;
        case "rtgs":
          if (!formData.rtgsNo) {
            newErrors.rtgsNo = "RTGS number is required";
            isValid = false;
          } else {
            newErrors.rtgsNo = "";
          }
          break;
        case "imps":
          if (!formData.impsNo) {
            newErrors.impsNo = "IMPS number is required";
            isValid = false;
          } else {
            newErrors.impsNo = "";
          }
          break;
        case "upi":
          if (!formData.upi) {
            newErrors.upi = "UPI ID is required";
            isValid = false;
          } else {
            newErrors.upi = "";
          }
          break;
        default:
          break;
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleVendorChange = (event: any, newValue: UnifiedVendor | null) => {
    setSelectedVendor(newValue);
    setErrors(prev => ({ ...prev, vendor: "" }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (name === "amount") {
      setErrors(prev => ({ ...prev, amount: validateAmount(value) }));
    }
    if (name === "paymentDate") {
      setErrors(prev => ({ ...prev, paymentDate: validatePaymentDate(value) }));
    }
    if (name === "bankName") {
      setErrors(prev => ({ ...prev, bankName: "" }));
    }
    if (name === "paymentMethod") {
      setErrors(prev => ({ ...prev, paymentMethod: "" }));
    }
    if (["neftNo", "rtgsNo", "impsNo", "upi"].includes(name)) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const handlePaymentModeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mode = e.target.value;
    setFormData(prev => ({
      ...prev,
      paymentMode: mode,
      paymentMethod: "",
      bankName: "",
      neftNo: "",
      rtgsNo: "",
      impsNo: "",
      upi: "",
    }));
    setErrors(prev => ({
      ...prev,
      paymentMode: "",
      paymentMethod: "",
      bankName: "",
      neftNo: "",
      rtgsNo: "",
      impsNo: "",
      upi: "",
    }));
  };

  const handleSubmit = async () => {
    let hasError = false;
    const newErrors = { ...errors };
    
    if (!selectedVendor) {
      newErrors.vendor = "Please select a vendor";
      hasError = true;
    }
    
    const amountError = validateAmount(formData.amount);
    if (amountError) {
      newErrors.amount = amountError;
      hasError = true;
    }
    
    const dateError = validatePaymentDate(formData.paymentDate);
    if (dateError) {
      newErrors.paymentDate = dateError;
      hasError = true;
    }
    
    if (!formData.paymentMode) {
      newErrors.paymentMode = "Payment mode is required";
      hasError = true;
    }
    
    setErrors(newErrors);
    
    if (hasError) return;
    
    if (formData.paymentMode === "Bank" && !validateBankDetails()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const paymentData = {
        vendorId: selectedVendor!.vendorId,
        vendorCode: selectedVendor!.randomId || "",
        vendorName: selectedVendor!.vendorName,
        amount: parseFloat(formData.amount),
        paymentDate: new Date(formData.paymentDate),
        paymentType: "advance",
        paymentMode: formData.paymentMode,
        paymentMethod: formData.paymentMode === "Bank" ? formData.paymentMethod : undefined,
        bankName: formData.paymentMode === "Bank" ? formData.bankName : undefined,
        neftNo: formData.paymentMethod === "neft" ? formData.neftNo : undefined,
        rtgsNo: formData.paymentMethod === "rtgs" ? formData.rtgsNo : undefined,
        impsNo: formData.paymentMethod === "imps" ? formData.impsNo : undefined,
        upi: formData.paymentMethod === "upi" ? formData.upi : undefined,
        remarks: formData.remarks || "Advance payment",
      };
      
      await dispatch(createAdvancePayment(paymentData)).unwrap();
      resetForm();
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error creating advance payment:", error);
      setErrors(prev => ({ 
        ...prev, 
        vendor: error.response?.data?.detail || "Failed to create advance payment" 
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = (): boolean => {
    if (!selectedVendor) return false;
    if (!formData.amount) return false;
    if (validateAmount(formData.amount)) return false;
    if (!formData.paymentDate) return false;
    if (validatePaymentDate(formData.paymentDate)) return false;
    if (!formData.paymentMode) return false;
    
    if (formData.paymentMode === "Bank") {
      if (!formData.bankName) return false;
      if (!formData.paymentMethod) return false;
      
      switch (formData.paymentMethod) {
        case "neft":
          if (!formData.neftNo) return false;
          break;
        case "rtgs":
          if (!formData.rtgsNo) return false;
          break;
        case "imps":
          if (!formData.impsNo) return false;
          break;
        case "upi":
          if (!formData.upi) return false;
          break;
        default:
          return false;
      }
    }
    
    return true;
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid #e0e0e0', pb: 2 }}>
        <Typography variant="h6" component="span" fontWeight="bold">
          Create Advance Payment
        </Typography>
        {selectedVendor && (
          <Typography variant="caption" color="textSecondary" display="block">
            Vendor: {selectedVendor.vendorName}
            {selectedVendor.randomId && ` (Code: ${selectedVendor.randomId})`}
          </Typography>
        )}
      </DialogTitle>
      
      <DialogContent sx={{ pt: 3 }}>
        <Grid container spacing={2.5}>
          {/* Vendor Selection */}
          <Grid item xs={12}>
            <Autocomplete
              key="vendor-autocomplete"
              options={uniqueVendors}
              getOptionLabel={(option: UnifiedVendor) => option.vendorName}
              isOptionEqualToValue={(option: UnifiedVendor, value: UnifiedVendor | null) =>
                option.vendorId === value?.vendorId
              }
              value={selectedVendor}
              onChange={handleVendorChange}
              disabled={!!preselectedVendor}
              loading={vendorLoading}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Vendor"
                  variant="outlined"
                  size="small"
                  error={!!errors.vendor}
                  helperText={errors.vendor}
                  required
                />
              )}
            />
          </Grid>

          {/* Payment Date - Cannot be future */}
          <Grid item xs={12}>
            <TextField
              label="Payment Date"
              type="date"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleInputChange}
              fullWidth
              size="small"
              required
              error={!!errors.paymentDate}
              helperText={errors.paymentDate}
              InputLabelProps={{ shrink: true }}
              inputProps={{
                max: today,
              }}
            />
          </Grid>

          {/* Amount */}
          <Grid item xs={12}>
            <TextField
              label="Advance Amount"
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              fullWidth
              size="small"
              required
              error={!!errors.amount}
              helperText={errors.amount}
              InputProps={{
                startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                inputProps: { step: "0.01", min: 0 }
              }}
            />
          </Grid>

          {/* Payment Mode */}
          <Grid item xs={12}>
            <TextField
              label="Payment Mode"
              select
              name="paymentMode"
              value={formData.paymentMode}
              onChange={handlePaymentModeChange}
              fullWidth
              size="small"
              required
              error={!!errors.paymentMode}
              helperText={errors.paymentMode}
            >
              <MenuItem value="Cash">Cash</MenuItem>
              <MenuItem value="Bank">Bank</MenuItem>
            </TextField>
          </Grid>

          {/* Bank Details */}
          {formData.paymentMode === "Bank" && (
            <>
              <Grid item xs={12}>
                <TextField
                  label="Payment Method"
                  select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  required
                  error={!!errors.paymentMethod}
                  helperText={errors.paymentMethod}
                >
                  <MenuItem value="neft">NEFT</MenuItem>
                  <MenuItem value="rtgs">RTGS</MenuItem>
                  <MenuItem value="imps">IMPS</MenuItem>
                  <MenuItem value="upi">UPI</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  select
                  name="bankName"
                  label="Bank Name"
                  value={formData.bankName}
                  onChange={handleInputChange}
                  fullWidth
                  size="small"
                  required
                  error={!!errors.bankName}
                  helperText={errors.bankName}
                >
                  <MenuItem value="">Select Bank</MenuItem>
                  {uniqueBanks.map((bank: any) => (
                    <MenuItem key={bank.bankMasterId} value={bank.bankName}>
                      {bank.bankName}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {formData.paymentMethod === "neft" && (
                <Grid item xs={12}>
                  <TextField
                    label="NEFT Number"
                    name="neftNo"
                    value={formData.neftNo}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    required
                    error={!!errors.neftNo}
                    helperText={errors.neftNo}
                  />
                </Grid>
              )}

              {formData.paymentMethod === "rtgs" && (
                <Grid item xs={12}>
                  <TextField
                    label="RTGS Number"
                    name="rtgsNo"
                    value={formData.rtgsNo}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    required
                    error={!!errors.rtgsNo}
                    helperText={errors.rtgsNo}
                  />
                </Grid>
              )}

              {formData.paymentMethod === "imps" && (
                <Grid item xs={12}>
                  <TextField
                    label="IMPS Number"
                    name="impsNo"
                    value={formData.impsNo}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    required
                    error={!!errors.impsNo}
                    helperText={errors.impsNo}
                  />
                </Grid>
              )}

              {formData.paymentMethod === "upi" && (
                <Grid item xs={12}>
                  <TextField
                    label="UPI ID"
                    name="upi"
                    value={formData.upi}
                    onChange={handleInputChange}
                    fullWidth
                    size="small"
                    required
                    error={!!errors.upi}
                    helperText={errors.upi}
                    placeholder="example@upi"
                  />
                </Grid>
              )}
            </>
          )}

          {/* Remarks */}
          <Grid item xs={12}>
            <TextField
              label="Remarks (Optional)"
              name="remarks"
              value={formData.remarks}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              size="small"
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2.5, borderTop: '1px solid #e0e0e0', gap: 1 }}>
        <Button 
          onClick={handleClose} 
          disabled={isSubmitting}
          variant="outlined"
          size="medium"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting || !isFormValid()}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <PaymentIcon />}
          size="medium"
        >
          {isSubmitting ? "Processing..." : "Create Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AdvancePaymentDialog;