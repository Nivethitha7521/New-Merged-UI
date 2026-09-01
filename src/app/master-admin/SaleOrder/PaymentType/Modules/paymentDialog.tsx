

'use client';
import React, { useRef, useEffect } from "react"; // ← Add useEffect
import { PaymentType } from '../Models/paymenttypeModels';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress
} from "@mui/material";

export interface PaymentDialogProps {
  open: boolean;
  handleClose: () => void;
  paymentData: PaymentType;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: () => void;
  validationErrors: { paymentType: string };
  mode: "Edit" | "Add";
  loading: boolean;
}



// ─── Validation helpers ───────────────────────────────────────────────────────

// At least one letter required
const hasLetter = /[a-zA-Z]/;

// Shows "Must contain at least one letter" if value has no letter,
// otherwise returns the parent validation error
const getHelperText = (value: string, parentError: string): string => {
  if (value && !hasLetter.test(value)) return 'Must contain at least one letter';
  return parentError;
};

// Returns true if field has a value but no letter — used for error highlight + submit block
const hasLetterError = (value: string): boolean =>
  !!value && !hasLetter.test(value);

// Strips all special chars (keeps letters, digits, spaces, - . ,) and caps at 30,
// then forwards a synthetic event to the parent handler
const createTextHandler = (
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
) => (e: React.ChangeEvent<HTMLInputElement>) => {
  const filtered = e.target.value
    .replace(/[^a-zA-Z0-9\s\-.,]/g, '')
    .slice(0, 30);
  const syntheticEvent = {
    ...e,
    target: { ...e.target, value: filtered, name: e.target.name },
  } as React.ChangeEvent<HTMLInputElement>;
  handleChange(syntheticEvent);
};


const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  handleClose,
  paymentData,
  handleChange,
  handleSubmit,
  validationErrors,
  mode,
  loading
}) => {

  const inputRef = useRef<HTMLInputElement>(null);

  const handleTextChange = createTextHandler(handleChange);

  // ← ADD THIS: Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Select text if editing existing record
          if (paymentData.paymentTypeId) {
            inputRef.current.select();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, paymentData.paymentTypeId]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
       className="ma-scope sale-order-master-form-dialog"
      PaperProps={{
       className: "dialog-paper-small sale-order-master-dialog-paper",
      }}
      TransitionProps={{
        // ← ADD THIS: Fallback focus on transition end
        onEntered: () => {
          if (inputRef.current) {
            inputRef.current.focus();
            if (paymentData.paymentTypeId) {
              inputRef.current.select();
            }
          }
        }
      }}
    >
      <DialogTitle className="dialog-title">
        {paymentData.paymentTypeId ? "Edit" : "Add"} Payment Type
      </DialogTitle>
      <DialogContent className="dialog-content">
        <div className="form-section">
        <TextField
          label="Payment Type"
          name="paymentType"
          value={paymentData.paymentType}
          onChange={handleTextChange}
          inputProps={{ maxLength: 30 }}
          margin="normal"
          fullWidth
          autoComplete="off"
          error={!!validationErrors.paymentType}
          helperText={validationErrors.paymentType}
          inputRef={inputRef}
          required
          className="custom-textfield"
          InputLabelProps={{ className: "custom-label" }}
          InputProps={{ className: "custom-input" }}
        />
        <TextField
          label="Description"
          name="description"
          value={paymentData.description || ""}
          onChange={handleTextChange}
          inputProps={{ maxLength: 30 }}
          margin="normal"
          fullWidth
          rows={4}
          autoComplete="off"
          className="custom-textfield"
          InputLabelProps={{ className: "custom-label" }}
          InputProps={{ className: "custom-input" }}
        />
        </div>
      </DialogContent>
      <DialogActions className="dialog-actions">
        <button onClick={handleClose} className="btn-secondary">Cancel</button>
        <button
          onClick={handleSubmit}
          className="btn-primary"
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : mode === 'Edit' ? (
            'Update'
          ) : (
            'Create'
          )}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;