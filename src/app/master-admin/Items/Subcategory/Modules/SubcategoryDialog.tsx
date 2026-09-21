
'use client';
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
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
import { SubCategory } from '../Models/subcategoryModels';

interface SubcategoryDialogProps {
  open: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
  subCategoryData: SubCategory;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  mode: 'add' | 'edit';
  loading: boolean;
  validationErrors: {
    subCategoryName: string;
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
const SPECIAL_CHARS_REGEX = /[^a-zA-Z\s\-.,&]/g;

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

// Hoisted: identical object on every render, so MUI doesn't see a "new" prop
// each time and skip unnecessary PaperProps diffing.
const DIALOG_PAPER_PROPS = { className: 'dialog-paper-small' };

// ─────────────────────────────────────────────────────────────────────────────

const SubcategoryDialog: React.FC<SubcategoryDialogProps> = ({
  open,
  handleClose,
  handleSubmit,
  subCategoryData,
  handleChange,
  validationErrors,
  mode,
  loading,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtered handler for subCategoryName — memoized so it isn't rebuilt
  // (and re-passed as a "new" prop) on every render, only when the parent
  // handler actually changes.
  const handleTextChange = useMemo(
    () => createTextHandler(handleChange),
    [handleChange]
  );

  // Computed once per relevant value change instead of being evaluated twice
  // per render (once for `error`, once for the submit `disabled` check).
  const nameHasLetterError = useMemo(
    () => hasLetterError(subCategoryData.subCategoryName),
    [subCategoryData.subCategoryName]
  );

  const helperText = useMemo(
    () => getHelperText(subCategoryData.subCategoryName, validationErrors.subCategoryName),
    [subCategoryData.subCategoryName, validationErrors.subCategoryName]
  );

  const focusAndMaybeSelect = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      if (subCategoryData.id) {
        inputRef.current.select();
      }
    }
  }, [subCategoryData.id]);

  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(focusAndMaybeSelect, 100);
      return () => clearTimeout(timer);
    }
  }, [open, focusAndMaybeSelect]);

  const transitionProps = useMemo(
    () => ({ onEntered: focusAndMaybeSelect }),
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
      <DialogTitle className="dialog-title">
        {mode === 'edit' ? 'Edit' : 'Add'} subCategoryName
      </DialogTitle>

      <DialogContent className="dialog-content">
        <div className="form-section">
          <div className="form-field">

            {/* SubCategory Name — no special chars, max 30, min 1 letter */}
            <TextField
              autoComplete='off'
              margin="dense"
              label="SubCategory Name"
              name="subCategoryName"
              value={subCategoryData.subCategoryName}
              onChange={handleTextChange}
              inputProps={{ maxLength: 30 }}
              fullWidth
              required
              inputRef={inputRef}
              error={!!validationErrors.subCategoryName || nameHasLetterError}
              helperText={helperText}
              disabled={loading}
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              InputProps={{ className: "custom-input" }}
            />

          </div>
        </div>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <button onClick={handleClose} disabled={loading} className='btn-secondary'>
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading || !subCategoryData.subCategoryName || nameHasLetterError}
          className='btn-primary'
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : subCategoryData.id ? 'Update' : 'Create'}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default SubcategoryDialog;