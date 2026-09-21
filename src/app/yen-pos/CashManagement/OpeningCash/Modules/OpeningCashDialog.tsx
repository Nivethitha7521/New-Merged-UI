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
import { OpeningCash } from '../Models/openingcashModels';

interface OpeningCashDialogProps {
  open: boolean;
  onClose: (event: React.SyntheticEvent, reason: "backdropClick" | "escapeKeyDown") => void;
  onSubmit: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openingCashData: OpeningCash;
  validationErrors: {
    systemOpenCash: string;
    branchName: string;
  };
  loading: boolean;
  isEditMode: boolean;
  unsavedChanges: boolean;
  handleClose: () => void;
}

export const OpeningCashDialog: React.FC<OpeningCashDialogProps> = ({
  open,
  onClose,
  onSubmit,
  onChange,
  openingCashData,
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
      <DialogTitle className='dialog-title'>{isEditMode ? "Edit" : "Add"} Opening Cash</DialogTitle>
      <DialogContent className='dialog-content'>

        <div className="form-field">
          <TextField
            autoComplete="off"
            label="Opening Cash"
            name="systemOpenCash"
            type='text'
            value={openingCashData.systemOpenCash}
            onChange={onChange}
            error={!!validationErrors.systemOpenCash}
            helperText={validationErrors.systemOpenCash}
            margin="normal"
            className="custom-textfield"
            InputLabelProps={{ className: "custom-label" }}
            InputProps={{ className: "custom-input" }}
          />
        </div>
      </DialogContent>
      <DialogActions className='dialog-actions'>
        <button 
          onClick={handleClose} 
          color="primary"
          className='btn-secondary'
          >
          Cancel
        </button>
        <button 
          onClick={onSubmit} 
          color="primary" 
          disabled={loading}
          className='btn-primary'
          >
          Confirm
        </button>
      </DialogActions>
    </Dialog>
  );
};