
'use client';
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
} from '@mui/material';
import { AdvanceAmount } from '../Models/advanceamountModels';

interface AdvanceAmountDialogProps {
  open: boolean;
  onClose: (event: React.SyntheticEvent, reason: "backdropClick" | "escapeKeyDown") => void;
  onSubmit: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  advanceAmountData: AdvanceAmount;
  validationErrors: {
  //  name: string;
    percentage: string;
    branches: string;
    //remarks: string;
  };
  loading: boolean;
  isEditMode: boolean;
  unsavedChanges: boolean;
  handleClose: () => void;
}

export const AdvanceAmountDialog: React.FC<AdvanceAmountDialogProps> = ({
  open,
  onClose,
  onSubmit,
  onChange,
  advanceAmountData,
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
      <DialogTitle className='dialog-title'>{isEditMode ? "Edit" : "Add"} Advance Amount</DialogTitle>

      <DialogContent className='dialog-content'>

        {/* <div className="form-section"> */}
        <div className="form-grid">
          <div className="form-field ">
            <TextField
              label="Percentage"
              name="percentage"
              value={advanceAmountData.percentage || ''}
              onChange={(e) => {
                const val = e.target.value;
                //   if (val === '' || (Number(val) >= 0 && Number(val) <= 100)) {
                //     onChange(e as any);
                //   }
                // }}

                if (
                  val === '' ||
                  (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100)
                ) {
                  onChange(e as any);
                }
              }}
              inputProps={{
                min: 0,
                max: 100,
                step: "0.01",
              }}
              InputProps={{
                endAdornment: <span style={{ color: '#666', marginLeft: 8 }}>%</span>,
                className: "custom-input"
              }}
              error={!!validationErrors.percentage}
              helperText={validationErrors.percentage}
              fullWidth
              margin="normal"
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              style={{ width: 250, marginLeft: 25 }}
            />
          </div>
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