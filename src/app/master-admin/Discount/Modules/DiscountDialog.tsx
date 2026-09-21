
'use client';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { Discount } from '../Models/discountModels';

interface DiscountDialogProps {
  open: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
  discountData: Discount;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mode: 'add' | 'edit';
  loading: boolean;
  validationErrors: {
    discountName: string;
    discountPercentage: string;
    saleTypeDiscount: string;
  };
}

// ─── Validation helpers (outside component — created once, never recreated) ───

const hasLetter = /[a-zA-Z]/;

const getHelperText = (value: string, parentError: string): string => {
  if (value && !hasLetter.test(value)) return 'Must contain at least one letter';
  return parentError;
};

const hasLetterError = (value: string): boolean =>
  !!value && !hasLetter.test(value);

const sanitizeText = (value: string): string =>
  value.replace(/[^a-zA-Z0-9\s\-.,]/g, '').slice(0, 30);

// ─────────────────────────────────────────────────────────────────────────────

const DiscountDialog: React.FC<DiscountDialogProps> = ({
  open,
  handleClose,
  handleSubmit,
  discountData,
  handleChange,
  validationErrors,
  mode,
  loading,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Stable sanitized text handler — no recreation on every render
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const filtered = sanitizeText(e.target.value);
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: filtered, name: e.target.name },
      } as React.ChangeEvent<HTMLInputElement>;
      handleChange(syntheticEvent);
    },
    [handleChange]
  );

  // Stable submit guard — only recalculates when field values or loading change
  const isSubmitDisabled = useMemo(
    () =>
      loading ||
      !discountData.discountName ||
      !discountData.discountPercentage ||
      !discountData.saleTypeDiscount ||
      hasLetterError(discountData.saleTypeDiscount),
    [loading, discountData.discountName, discountData.discountPercentage, discountData.saleTypeDiscount]
  );

  // Focus first field when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (discountData.id) {
            inputRef.current.select();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, discountData.id]);

  // Stable transition handler
  const handleTransitionEntered = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (discountData.id) {
        inputRef.current.select();
      }
    }
  }, [discountData.id]);

  return (
<Dialog
  open={open}
  onClose={handleClose}
  maxWidth="sm"
  fullWidth
  className="ma-scope discount-form-dialog"
  PaperProps={{
    className: "dialog-paper-small",
  }}
  TransitionProps={{
    onEntered: handleTransitionEntered,
  }}
>
    <DialogTitle className="dialog-title">
  {mode === "edit" ? "Edit Discount" : "Add Discount"}
</DialogTitle>

      <DialogContent className='dialog-content'>

        <div className="form-section">

          <div className="form-field">
            <TextField
              autoComplete="off"
              margin="normal"
              label="Sales Type Discount Name"
              name="saleTypeDiscount"
              value={discountData.saleTypeDiscount}
              onChange={handleTextChange}
              inputProps={{ maxLength: 30 }}
              fullWidth
              required
              inputRef={inputRef}
              error={!!validationErrors.saleTypeDiscount || hasLetterError(discountData.saleTypeDiscount)}
              helperText={getHelperText(discountData.saleTypeDiscount, validationErrors.saleTypeDiscount)}
              disabled={loading}
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              InputProps={{ className: "custom-input" }}
            />
          </div>

          <div className="form-field">
            <TextField
              autoComplete="off"
              margin="normal"
              label="Discount Name"
              name="discountName"
              value={discountData.discountName}
              onChange={handleTextChange}
              inputProps={{ maxLength: 30 }}
              fullWidth
              required
              error={!!validationErrors.discountName || hasLetterError(discountData.discountName)}
              helperText={getHelperText(discountData.discountName, validationErrors.discountName)}
              disabled={loading}
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              InputProps={{ className: "custom-input" }}
            />
          </div>

          <div className="form-field">
            <TextField
              autoComplete="off"
              margin="normal"
              label="Discount Percentage( % )"
              name="discountPercentage"
              value={discountData.discountPercentage}
              onChange={handleChange}
              fullWidth
              required
              error={!!validationErrors.discountPercentage}
              helperText={validationErrors.discountPercentage}
              disabled={loading}
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              InputProps={{ className: "custom-input" }}
              inputProps={{
                inputMode: "numeric",
                maxLength: 2
              }}
              sx={{
                '& .MuiFormHelperText-root': {
                  position: 'absolute',
                  bottom: -20,
                  fontSize: '0.7rem',
                },
              }}
            />
          </div>

        </div>
      </DialogContent>
      <DialogActions className='dialog-actions'>
        <button onClick={handleClose} color="primary" disabled={loading} className='btn-secondary'>
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitDisabled}
          className='btn-primary'
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : mode === 'edit' ? (
            'Update'
          ) : (
            'Create'
          )}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default DiscountDialog;