


"use Client";
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { Inventory } from '../Models/inventoryTypeModels';

interface InventoryDialogProps {
  open: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  inventoryTypeData: Inventory;
  mode: 'add' | 'edit';
  isSubmitting: boolean;
  validationErrors: {
    inventoryType: string;
  };
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
const SPECIAL_CHARS_REGEX = /[^a-zA-Z\s\-.,]/g;

const createTextHandler = (
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
) => (e: React.ChangeEvent<HTMLInputElement>) => {
  const filtered = e.target.value.replace(SPECIAL_CHARS_REGEX, '').slice(0, 30);
  const syntheticEvent = {
    ...e,
    target: { ...e.target, value: filtered, name: e.target.name },
  } as React.ChangeEvent<HTMLInputElement>;
  handleChange(syntheticEvent);
};

// Hoisted: identical object reference on every render.
const DIALOG_PAPER_PROPS = { className: 'dialog-paper-small' };

const InventoryDialog: React.FC<InventoryDialogProps> = ({
  open,
  handleClose,
  handleSubmit,
  handleChange,
  inventoryTypeData,
  mode,
  isSubmitting,
  validationErrors,
}) => {


  const inputRef = useRef<HTMLInputElement>(null);

  // Memoized so it's only rebuilt when the parent's handleChange changes,
  // instead of on every render.
  const handleTextChange = useMemo(
    () => createTextHandler(handleChange),
    [handleChange]
  );

  // Computed once per relevant value change instead of twice per render
  // (previously evaluated separately for `error` and the disabled check).
  const nameHasLetterError = useMemo(
    () => hasLetterError(inventoryTypeData.inventoryType),
    [inventoryTypeData.inventoryType]
  );

  const helperText = useMemo(
    () => getHelperText(inventoryTypeData.inventoryType, validationErrors.inventoryType),
    [inventoryTypeData.inventoryType, validationErrors.inventoryType]
  );

  const focusAndMaybeSelect = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      // Select text if editing existing record
      if (inventoryTypeData.id) {
        inputRef.current.select();
      }
    }
  }, [inventoryTypeData.id]);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(focusAndMaybeSelect, 100);
      return () => clearTimeout(timer);
    }
  }, [open, focusAndMaybeSelect]);

  const transitionProps = useMemo(
    () => ({ onEntered: focusAndMaybeSelect }), // Fallback focus on transition end
    [focusAndMaybeSelect]
  );

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={DIALOG_PAPER_PROPS}
      TransitionProps={transitionProps}
    >
      <DialogTitle className="dialog-title">{mode === 'edit' ? 'Edit' : 'Add'} Inventory Type</DialogTitle>
      <DialogContent className="dialog-content">

        <div className="form-section">
          <div className="form-field">
            <TextField
              autoComplete="off"
              margin="dense"
              label="Inventory Type Name"
              name="inventoryType"
              value={inventoryTypeData.inventoryType || ''}
              onChange={handleTextChange}
              inputProps={{ maxLength: 30 }}
              fullWidth
              required
              inputRef={inputRef}
              error={!!validationErrors.inventoryType || nameHasLetterError}
              helperText={helperText}
              disabled={isSubmitting}
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              InputProps={{ className: "custom-input" }}
            />
          </div>
        </div>
      </DialogContent>

      <DialogActions className='dialog-actions'>
        <button onClick={handleClose} disabled={isSubmitting} className='btn-secondary'>
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className='btn-primary'
        >
          {isSubmitting ? (
            <CircularProgress size={24} />
          ) : inventoryTypeData.id ? 'Update' : 'Create'}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default InventoryDialog;