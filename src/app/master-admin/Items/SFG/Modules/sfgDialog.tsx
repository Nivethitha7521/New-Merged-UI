
'use client';
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  SelectChangeEvent,
} from '@mui/material';
import { SFG } from '../Models/sfgModels';
import { RootState } from '@/redux/store';

interface SfgDialogProps {
  open: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
  sfgData: SFG;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void;
  mode: 'add' | 'edit';
  loading: boolean;
  validationErrors: {
    sfgName: string;
    price: string;
    uom: string;
    shelfLife: string;
  };
}

// ─── Validation helpers (applied to sfgName only) ─────────────────────────────

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
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => void
) => (e: React.ChangeEvent<HTMLInputElement>) => {
  const filtered = e.target.value
    .replace(/[^a-zA-Z0-9\s\-.,]/g, '') // strip special chars, allow - . ,
    .slice(0, 30);                        // enforce max 30 characters
  const syntheticEvent = {
    ...e,
    target: { ...e.target, value: filtered, name: e.target.name },
  } as React.ChangeEvent<HTMLInputElement>;
  handleChange(syntheticEvent);
};

// ─────────────────────────────────────────────────────────────────────────────

const SfgDialog: React.FC<SfgDialogProps> = ({
  open,
  handleClose,
  handleSubmit,
  sfgData,
  handleChange,
  validationErrors,
  mode,
  loading,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Filtered handler — only used for sfgName
  const handleTextChange = createTextHandler(handleChange);

  // Get UOMs from Redux store
  const { uoms, loading: loadingUom } = useSelector((state: RootState) => state.sfg);

  // Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (sfgData.id) {
            inputRef.current.select();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, sfgData.id]);

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
        onEntered: () => {
          if (inputRef.current) {
            inputRef.current.focus();
            if (sfgData.id) {
              inputRef.current.select();
            }
          }
        }
      }}
    >
      <DialogTitle className="dialog-title">
        {mode === 'edit' ? 'Edit' : 'Add'} SFG
      </DialogTitle>

      <DialogContent className="dialog-content">
        <div className="form-section">

          {/* SFG Name — no special chars, max 30, min 1 letter */}
          <div className="form-field">
            <TextField
              autoComplete='off'
              margin="dense"
              label="SFG Name"
              name="sfgName"
              value={sfgData.sfgName}
              onChange={handleTextChange}
              inputProps={{ maxLength: 30 }}
              fullWidth
              required
              inputRef={inputRef}
              error={!!validationErrors.sfgName || hasLetterError(sfgData.sfgName)}
              helperText={getHelperText(sfgData.sfgName, validationErrors.sfgName)}
              disabled={loading}
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              InputProps={{ className: "custom-input" }}
            />
          </div>

          {/* Price — unchanged */}
          <div className="form-field">
            <TextField
              autoComplete="off"
              margin="dense"
              label="Price"
              name="price"
              value={sfgData.price}
              onChange={(e) => {
                const value = e.target.value;
                const regex = /^\d{0,4}(\.\d{0,2})?$/;
                if (value === "" || regex.test(value)) {
                  handleChange(e);
                }
              }}
              fullWidth
              required
              error={!!validationErrors.price}
              helperText={validationErrors.price}
              disabled={loading}
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              InputProps={{ className: "custom-input" }}
              inputProps={{
                inputMode: "decimal",
              }}
            />
          </div>

          {/* UOM Dropdown — unchanged */}
          <div className="form-field">
            <FormControl
              fullWidth
              margin="dense"
              error={!!validationErrors.uom}
              className='custom-textfield'
              disabled={loading || loadingUom}
              required
            >
              <InputLabel className="custom-label">UOM</InputLabel>
              <Select
                name="uom"
                value={sfgData.uom || ''}
                onChange={handleChange}
                label="UOM"
                className="custom-select"
                sx={{
                  fontSize: '12px',
                  fontFamily: "'Poppins', sans-serif",
                  '& .MuiSelect-select': {
                    paddingY: '10px'
                  }
                }}
              >
                {loadingUom ? (
                  <MenuItem disabled>
                    <CircularProgress size={20} />
                    <span style={{ marginLeft: '8px' }}>Loading UOMs...</span>
                  </MenuItem>
                ) : (
                  uoms.map((uom) => (
                    <MenuItem
                      key={uom.uomId}
                      value={uom.uom}
                      sx={{
                        fontSize: '12px',
                        minHeight: '16px',
                        paddingY: '8px',
                        fontFamily: "'Poppins', sans-serif",
                      }}
                    >
                      {uom.uom}
                    </MenuItem>
                  ))
                )}
              </Select>
              {validationErrors.uom && (
                <Box sx={{ color: 'error.main', fontSize: '0.75rem', mt: 0.5 }}>
                  {validationErrors.uom}
                </Box>
              )}
            </FormControl>
          </div>

          {/* Shelf Life — numbers only */}
          <div className="form-field">
            <TextField
              autoComplete='off'
              margin="dense"
              label="Shelf Life (days)"
              name="shelfLife"
              value={sfgData.shelfLife}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, ''); // strip all non-digits
                const syntheticEvent = {
                  ...e,
                  target: { ...e.target, value, name: e.target.name },
                } as React.ChangeEvent<HTMLInputElement>;
                handleChange(syntheticEvent);
              }}
              fullWidth
              required
              error={!!validationErrors.shelfLife}
              helperText={validationErrors.shelfLife}
              disabled={loading}
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              InputProps={{ className: "custom-input" }}
              inputProps={{
                inputMode: 'numeric',
                maxLength: 2,
              }}
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
          disabled={
            loading ||
            !sfgData.sfgName ||
            !sfgData.price ||
            !sfgData.uom ||
            !sfgData.shelfLife ||
            hasLetterError(sfgData.sfgName) // block if sfgName has no letter
          }
          className='btn-primary'
        >
          {loading ? (
            <CircularProgress size={24} />
          ) : sfgData.id ? 'Update' : 'Create'}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default SfgDialog;