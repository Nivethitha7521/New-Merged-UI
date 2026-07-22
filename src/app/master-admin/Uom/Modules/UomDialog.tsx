


'use client';

import React, { useEffect, useRef, useCallback, memo } from 'react';
import {
  TextField, Dialog, DialogActions, DialogTitle,
  DialogContent, FormControl, InputLabel, Select, MenuItem,
  Box, CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { Measure } from '../Models/uomModels';
import {
  UomState,
  ValidationErrors,
  sanitizeTextField,
  lacksLetter,
} from '../Modules/Uomtypes';

// ─── Types ────────────────────────────────────────────────────────────────────

interface UomDialogProps {
  open: boolean;
  onClose: () => void;
  uomData: UomState;
  editid: string | null;
  measurementTypes: Measure[];
  isSubmitting: boolean;
  validationErrors: ValidationErrors;
  handleTextFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (e: SelectChangeEvent<string>) => void;
  handleAddOrUpdate: () => void;
}

// ─── Constants (stable references, defined outside component) ─────────────────

const MENU_ITEM_SX = {
  fontSize: '12px',
  minHeight: '16px',
  paddingY: '8px',
  fontFamily: "'Poppins', sans-serif",
} as const;

const UOM_INPUT_PROPS = { maxLength: 30 } as const;
const INPUT_LABEL_PROPS = { className: 'custom-label' } as const;
const INPUT_PROPS_CLASS = { className: 'custom-input' } as const;
const DIALOG_PAPER_PROPS = { className: 'dialog-paper-small' } as const;

// ─── Component ────────────────────────────────────────────────────────────────

const UomDialog: React.FC<UomDialogProps> = ({
  open,
  onClose,
  uomData,
  editid,
  measurementTypes,
  isSubmitting,
  validationErrors,
  handleTextFieldChange,
  handleSelectChange,
  handleAddOrUpdate,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Stable handler — sanitizes input then delegates to parent
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const filtered = sanitizeTextField(e.target.value);
      // Avoid creating a new synthetic event object; mutate target.value in-place
      // via a plain object spread only if value changed (prevents unnecessary dispatch)
      if (filtered === e.target.value) {
        handleTextFieldChange(e);
        return;
      }
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: filtered, name: e.target.name },
      } as React.ChangeEvent<HTMLInputElement>;
      handleTextFieldChange(syntheticEvent);
    },
    [handleTextFieldChange],
  );

  // Focus the UOM input when the dialog opens; select text when editing
  const focusInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    if (uomData.id) el.select();
  }, [uomData.id]);

  // onEntered is the authoritative focus trigger; useEffect is a fast-path fallback
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(focusInput, 80);
    return () => clearTimeout(id);
  }, [open, focusInput]);

  // Derived disable state computed once per render
  const isAddOrUpdateDisabled =
    isSubmitting ||
    !uomData.measurementType ||
    !uomData.uom ||
    lacksLetter(uomData.uom ?? '') ||
    uomData.precision === null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={DIALOG_PAPER_PROPS}
      TransitionProps={{ onEntered: focusInput }}
    >
      <DialogTitle className="dialog-title">
        {editid ? 'Edit UOM' : 'Add UOM'}
      </DialogTitle>

      <DialogContent className="dialog-content">
        <div className="form-section">

          {/* Measurement Type */}
          <div className="form-field">
            <FormControl
              fullWidth
              margin="dense"
              error={!!validationErrors.measurementType}
              className="custom-textfield"
            >
              <InputLabel className="custom-label">Measurement Type</InputLabel>
              <Select
                name="measurementType"
                value={uomData.measurementType ?? ''}
                onChange={handleSelectChange}
                label="Measurement Type"
                disabled={isSubmitting}
                className="custom-select"
              >
                {measurementTypes.map((mt) => (
                  <MenuItem key={mt.id} value={mt.measurementType} sx={MENU_ITEM_SX}>
                    {mt.measurementType}
                  </MenuItem>
                ))}
              </Select>

              {validationErrors.measurementType && (
                <Box sx={{ color: 'error.main', fontSize: '0.5rem', mt: 0.5 }}>
                  {validationErrors.measurementType}
                </Box>
              )}
            </FormControl>
          </div>

          {/* UOM */}
          <div className="form-field">
            <TextField
              autoComplete="off"
              margin="dense"
              label="UOM"
              name="uom"
              value={uomData.uom ?? ''}
              onChange={handleTextChange}
              inputProps={UOM_INPUT_PROPS}
              fullWidth
              required
              inputRef={inputRef}
              error={!!validationErrors.uom}
              helperText={validationErrors.uom}
              disabled={isSubmitting}
              className="custom-textfield"
              InputLabelProps={INPUT_LABEL_PROPS}
              InputProps={INPUT_PROPS_CLASS}
            />
          </div>

          {/* Precision */}
          <div className="form-field">
            <TextField
              autoComplete="off"
              margin="dense"
              label="Precision"
              name="precision"
              value={uomData.precision ?? ''}
              onChange={handleTextFieldChange}
              fullWidth
              required
              error={!!validationErrors.precision}
              helperText={validationErrors.precision}
              disabled={isSubmitting}
              className="custom-textfield"
              InputLabelProps={INPUT_LABEL_PROPS}
              InputProps={INPUT_PROPS_CLASS}
            />
          </div>

        </div>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <button onClick={onClose} disabled={isSubmitting} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={handleAddOrUpdate}
          disabled={isAddOrUpdateDisabled}
          className="btn-primary"
        >
          {isSubmitting ? (
            <CircularProgress size={24} />
          ) : editid ? (
            'Update'
          ) : (
            'Create'
          )}
        </button>
      </DialogActions>
    </Dialog>
  );
};

// memo prevents re-render when parent state unrelated to this dialog changes
export default memo(UomDialog);