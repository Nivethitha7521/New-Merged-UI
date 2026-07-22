'use client';
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';
import { PettyCash } from '../Models/pettycashModels';   // adjust path

interface PettyCashDialogProps {
  open: boolean;
  onClose: (event: React.SyntheticEvent, reason: 'backdropClick' | 'escapeKeyDown') => void;
  onSubmit: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pettyCashData: PettyCash;
  validationErrors: { pettyCash: string; branches: string };
  loading: boolean;
  isEditMode: boolean;
  handleClose: () => void;          // used only for the Cancel button
}

export const PettyCashDialog: React.FC<PettyCashDialogProps> = ({
  open,
  onClose,
  onSubmit,
  onChange,
  pettyCashData,
  validationErrors,
  loading,
  isEditMode,
  handleClose,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        className: "dialog-paper-small",
      }}
    >
      <DialogTitle className='dialog-title'>{isEditMode ? 'Edit' : 'Add'} Petty Cash</DialogTitle>

      <DialogContent className='dialog-content'>

        <div className="form-field">
          <TextField
            autoComplete="off"
            label="Petty Cash"
            name="pettyCash"
            type="text"
            value={pettyCashData.pettyCash}
            onChange={onChange}
            error={!!validationErrors.pettyCash}
            helperText={validationErrors.pettyCash}
            margin="normal"
            className="custom-textfield"
            InputLabelProps={{ className: "custom-label" }}
            InputProps={{ className: "custom-input" }}
          />
        </div>
      </DialogContent>

      <DialogActions className='dialog-actions'>
        <button onClick={handleClose} color="primary" className='btn-secondary'>
          Cancel
        </button>
        <button onClick={onSubmit} color="primary" disabled={loading} className='btn-primary'>
          Confirm
        </button>
      </DialogActions>
    </Dialog>
  );
};