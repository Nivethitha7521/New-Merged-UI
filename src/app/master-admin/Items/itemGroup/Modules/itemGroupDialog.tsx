

"use Client";
import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  // FormHelperText,
  CircularProgress,
} from '@mui/material';
import { ItemGroup } from '../Models/itemGroupModels';

interface ItemGroupDialogProbs {
  open: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  itemGroupData: ItemGroup;
  mode: 'add' | 'edit';
  isSubmitting: boolean;

  validationErrors: {
    itemGroupName: string;
  };
};



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
    .replace(/[^a-zA-Z\s\-.,]/g, '')
    .slice(0, 30);
  const syntheticEvent = {
    ...e,
    target: { ...e.target, value: filtered, name: e.target.name },
  } as React.ChangeEvent<HTMLInputElement>;
  handleChange(syntheticEvent);
};


const ItemGroupDialog: React.FC<ItemGroupDialogProbs> = ({
  open,
  handleClose,
  handleSubmit,
  handleChange,
  itemGroupData,
  mode,
  isSubmitting,
  validationErrors
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
          if (itemGroupData.id) {
            inputRef.current.select();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, itemGroupData.id]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "dialog-paper-small",
      }}
      TransitionProps={{
        // ← ADD THIS: Fallback focus on transition end
        onEntered: () => {
          if (inputRef.current) {
            inputRef.current.focus();
            if (itemGroupData.id) {
              inputRef.current.select();
            }
          }
        }
      }}
    >
      <DialogTitle className="dialog-title">{mode === 'edit' ? 'Edit' : 'Add'} ItemGroupName </DialogTitle>
      <DialogContent className="dialog-content">

        <div className="form-section">
          <div className="form-field">
            <TextField
              autoComplete='off'
              margin="dense"
              label="itemGroup Name"
              name="itemGroupName"
              value={itemGroupData.itemGroupName}
              onChange={handleTextChange}
              inputProps={{ maxLength: 30 }}
              fullWidth
              required
              inputRef={inputRef}
              error={!!validationErrors.itemGroupName || hasLetterError(itemGroupData.itemGroupName)}
              helperText={ getHelperText(itemGroupData.itemGroupName,validationErrors.itemGroupName)}
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
          ) : itemGroupData.id ? 'Update' : 'Create'}
        </button>
      </DialogActions>
    </Dialog>

  );
};

export default ItemGroupDialog;