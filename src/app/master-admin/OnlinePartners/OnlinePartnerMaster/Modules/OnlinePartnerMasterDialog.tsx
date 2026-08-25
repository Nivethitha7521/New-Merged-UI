
import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
} from '@mui/material';

import { OnlinePartner } from '../Models/partnerModels';



interface OnlinePartnerProbs {
  open: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  partnerData: OnlinePartner;
  mode: 'add' | 'edit';
  isSubmitting: boolean;

  validationErrors: {
    partnerName: string;
  };
};

const OnlinePartnerDialog: React.FC<OnlinePartnerProbs> = ({
  open,
  handleClose,
  handleSubmit,
  handleChange,
  partnerData,
  mode,
  isSubmitting,
  validationErrors
}) => {


  const inputRef = useRef<HTMLInputElement>(null);

  // ← ADD THIS: Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Select text if editing existing record
          if (partnerData.onlinePartnersId) {
            inputRef.current.select();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, partnerData.onlinePartnersId]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
       className="ma-scope online-partner-form-dialog"
      PaperProps={{
       className: "dialog-paper-small online-partner-dialog-paper"
      }}
      TransitionProps={{
        // ← ADD THIS: Fallback focus on transition end
        onEntered: () => {
          if (inputRef.current) {
            inputRef.current.focus();
            if (partnerData.onlinePartnersId) {
              inputRef.current.select();
            }
          }
        }
      }}
    >
      <DialogTitle className='dialog-title'>{mode === 'edit' ? 'Edit' : 'Add'} Online Partner </DialogTitle>
      <DialogContent className='dialog-content'>

        <div className="form-section online-partner-dialog-section">
          <div className="form-field">
            <TextField
              autoComplete="off"
              margin="dense"
              label="Partner Name"
              name="partnerName"
              value={partnerData.partnerName}
              onChange={handleChange}
              fullWidth
              required
              inputRef={inputRef}
              error={!!validationErrors.partnerName}
              helperText={validationErrors.partnerName}
              disabled={isSubmitting}
              sx={{ textTransform: 'uppercase' }}
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
          disabled={isSubmitting || !partnerData.partnerName}
          className='btn-primary'
        >
          {isSubmitting ? <CircularProgress size={24} /> : partnerData.onlinePartnersId ? 'Update' : 'Create'}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default OnlinePartnerDialog;
