
'use client';

import React, { useEffect, useRef, useCallback, memo } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Box,
} from '@mui/material';
import { Vehicle } from '../Models/vehicleModel';

// ─── Types ────────────────────────────────────────────────────────────────────

interface VehicleValidationErrors {
  vehicleName: string;
  vehicleModel: string;
  vehicleNo: string;
  branchName: string;
}

interface VehicleDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: () => void;
  vehicleData: Vehicle;
  onTextFieldChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectChange: (e: SelectChangeEvent<string | string[]>) => void;
  mode: 'add' | 'edit';
  loading: boolean;
  validationErrors: VehicleValidationErrors;
  branchOptions: Array<{ branchName: string; aliasName: string }>;
}

// ─── Constants (stable module-level references — never recreated on render) ───

const HAS_LETTER_RE = /[a-zA-Z]/;

const FUEL_TYPES = ['PETROL', 'DIESEL', 'CNG', 'ELECTRIC'] as const;

const MENU_ITEM_SX = {
  fontSize: '12px',
  minHeight: '16px',
  paddingY: '8px',
  fontFamily: "'Poppins', sans-serif",
} as const;

const BRANCH_MENU_ITEM_SX = {
  fontSize: '12px',
  minHeight: '36px',
  paddingY: '8px',
  fontFamily: "'Poppins', sans-serif",
} as const;

const MENU_PROPS = { PaperProps: { style: { maxHeight: 250 } } } as const;

const DIALOG_PAPER_PROPS = { className: 'dialog-paper-medium' } as const;

const INPUT_LABEL_PROPS = { className: 'custom-label' } as const;
const INPUT_PROPS_CLASS = { className: 'custom-input' } as const;
const TEXT_FIELD_INPUT_PROPS = { maxLength: 30 } as const;

const VEHICLE_NO_INPUT_PROPS = {
  style: { textTransform: 'uppercase' as const },
  maxLength: 10,
} as const;

// Shared sx for both Select FormControls — extracted once, reused twice
const SELECT_FORM_CONTROL_SX = {
  '& .MuiOutlinedInput-root': {
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: 'rgb(156, 163, 175)',
    },
  },
  '& .MuiInputLabel-root.Mui-focused': {
    color: 'rgb(156, 163, 175)',
  },
  '& .MuiInputBase-root': {
    height: 45,
    fontSize: '12px',
  },
  '& .MuiInputLabel-root': {
    fontSize: '13px',
    minHeight: '32px',
  },
} as const;

const ROW_STYLE = { gap: '0.75rem', marginBottom: '0.75rem' } as const;
const ROW_STYLE_LAST = { gap: '0.75rem' } as const;

const BRANCH_ERROR_SX = {
  fontSize: '0.75rem',
  color: '#d32f2f',
  ml: 1.75,
  mt: 0.5,
} as const;

// ─── Pure helpers (no React dependency) ───────────────────────────────────────

const hasLetterError = (value: string | undefined): boolean =>
  !!value && !HAS_LETTER_RE.test(value);

const getHelperText = (value: string | undefined, parentError: string): string => {
  if (value && !HAS_LETTER_RE.test(value)) return 'Must contain at least one letter';
  return parentError;
};

// ─── Component ────────────────────────────────────────────────────────────────

const VehicleDialog: React.FC<VehicleDialogProps> = ({
  open,
  onClose,
  onSubmit,
  vehicleData,
  onTextFieldChange,
  onSelectChange,
  validationErrors,
  mode,
  loading,
  branchOptions,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Focus management ───────────────────────────────────────────────────────
  // Single stable callback shared by useEffect (fast path) and onEntered (fallback)
  const focusInput = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.focus();
    if (vehicleData.id) el.select();
  }, [vehicleData.id]);

  useEffect(() => {
    if (!open) return;
    const id = setTimeout(focusInput, 80);
    return () => clearTimeout(id);
  }, [open, focusInput]);

  // ── Stable change handlers ─────────────────────────────────────────────────

  // Strips special chars (keeps letters, digits, spaces, - . ,), caps at 30
  const handleTextChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const filtered = e.target.value
        .replace(/[^a-zA-Z0-9\s\-.,]/g, '')
        .slice(0, 30);
      if (filtered === e.target.value) {
        onTextFieldChange(e);
        return;
      }
      const syntheticEvent = {
        ...e,
        target: { ...e.target, value: filtered, name: e.target.name },
      } as React.ChangeEvent<HTMLInputElement>;
      onTextFieldChange(syntheticEvent);
    },
    [onTextFieldChange],
  );

  // Uppercase alphanumeric only, max 10
  const handleVehicleNoChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
      onTextFieldChange(e);
    },
    [onTextFieldChange],
  );

  // ── Derived values ─────────────────────────────────────────────────────────

  const hasAnyLetterError =
    hasLetterError(vehicleData.vehicleName) ||
    hasLetterError(vehicleData.vehicleModel);

  const branchValue = Array.isArray(vehicleData.branchName)
    ? vehicleData.branchName[0] ?? ''
    : vehicleData.branchName ?? '';

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={DIALOG_PAPER_PROPS}
      TransitionProps={{ onEntered: focusInput }}
    >
      <DialogTitle className="dialog-title">
        {mode === 'edit' ? 'Edit Vehicle' : 'Add New Vehicle'}
      </DialogTitle>

      <DialogContent dividers className="dialog-content">
        <div className="form-section">

          {/* Row 1: Vehicle Name | Vehicle Model | Vehicle Number */}
          <div className="form-grid-manager" style={ROW_STYLE}>

            <div className="form-field">
              <TextField
                autoComplete="off"
                label="Vehicle Name"
                name="vehicleName"
                value={vehicleData.vehicleName}
                onChange={handleTextChange}
                error={!!validationErrors.vehicleName || hasLetterError(vehicleData.vehicleName)}
                helperText={getHelperText(vehicleData.vehicleName, validationErrors.vehicleName)}
                fullWidth
                inputRef={inputRef}
                required
                disabled={loading}
                className="custom-textfield"
                InputLabelProps={INPUT_LABEL_PROPS}
                InputProps={INPUT_PROPS_CLASS}
                inputProps={TEXT_FIELD_INPUT_PROPS}
              />
            </div>

            <div className="form-field">
              <TextField
                autoComplete="off"
                label="Vehicle Model"
                name="vehicleModel"
                value={vehicleData.vehicleModel}
                onChange={handleTextChange}
                error={!!validationErrors.vehicleModel || hasLetterError(vehicleData.vehicleModel)}
                helperText={getHelperText(vehicleData.vehicleModel, validationErrors.vehicleModel)}
                fullWidth
                required
                disabled={loading}
                className="custom-textfield"
                InputLabelProps={INPUT_LABEL_PROPS}
                InputProps={INPUT_PROPS_CLASS}
                inputProps={TEXT_FIELD_INPUT_PROPS}
              />
            </div>

            <div className="form-field">
              <TextField
                autoComplete="off"
                label="Vehicle Number"
                name="vehicleNo"
                value={vehicleData.vehicleNo}
                onChange={handleVehicleNoChange}
                error={!!validationErrors.vehicleNo}
                helperText={validationErrors.vehicleNo}
                fullWidth
                required
                disabled={loading}
                placeholder="TN 65 N 0657"
                className="custom-textfield"
                InputLabelProps={INPUT_LABEL_PROPS}
                InputProps={INPUT_PROPS_CLASS}
                inputProps={VEHICLE_NO_INPUT_PROPS}
              />
            </div>
          </div>

          {/* Row 2: Fuel Type | Branch Name */}
          <div className="form-grid-manager" style={ROW_STYLE_LAST}>

            <div className="form-field">
              <FormControl
                fullWidth
                required
                disabled={loading}
                className="custom-textfield"
                sx={SELECT_FORM_CONTROL_SX}
              >
                <InputLabel className="custom-label">Fuel Type *</InputLabel>
                <Select
                  name="fuelType"
                  value={vehicleData.fuelType}
                  label="Fuel Type *"
                  onChange={onSelectChange}
                  className="custom-input"
                  MenuProps={MENU_PROPS}
                >
                  {FUEL_TYPES.map((fuel) => (
                    <MenuItem key={fuel} value={fuel} sx={MENU_ITEM_SX}>
                      {fuel}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </div>

            <div className="form-field form-field-span-2">
              <FormControl
                fullWidth
                required
                disabled={loading}
                error={!!validationErrors.branchName}
                className="custom-textfield"
                sx={SELECT_FORM_CONTROL_SX}
              >
                <InputLabel className="custom-label">Branch Name *</InputLabel>
                <Select
                  name="branchName"
                  value={branchValue}
                  onChange={onSelectChange}
                  label="Branch Name *"
                  className="custom-input"
                  MenuProps={MENU_PROPS}
                >
                  {branchOptions.length > 0 ? (
                    branchOptions.map((opt) => (
                      <MenuItem
                        key={opt.branchName}
                        value={opt.branchName}
                        sx={BRANCH_MENU_ITEM_SX}
                      >
                        {opt.branchName}
                      </MenuItem>
                    ))
                  ) : (
                    <MenuItem disabled>No branches available</MenuItem>
                  )}
                </Select>
                {validationErrors.branchName && (
                  <Box sx={BRANCH_ERROR_SX}>{validationErrors.branchName}</Box>
                )}
              </FormControl>
            </div>

          </div>
        </div>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <button onClick={onClose} disabled={loading} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={loading || !vehicleData.vehicleNo || hasAnyLetterError}
          className="btn-primary"
        >
          {loading ? (
            <CircularProgress size={20} />
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

export default memo(VehicleDialog);