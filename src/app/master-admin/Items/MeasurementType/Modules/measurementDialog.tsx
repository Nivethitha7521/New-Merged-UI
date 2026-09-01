


"use Client";
import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { MeasurementType } from '../Models/measurementTypeModels';

interface MeasurementTypeDialogProps {
  open: boolean;
  handleClose: () => void;
  handleSubmit: () => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  measurementTypeData: MeasurementType;
  mode: 'add' | 'edit';
  isSubmitting: boolean;
  validationErrors: {
    measurementType: string;
  };
}

const MeasurementTypeDialog: React.FC<MeasurementTypeDialogProps> = ({
  open,
  handleClose,
  handleSubmit,
  handleChange,
  measurementTypeData,
  mode,
  isSubmitting,
  validationErrors,
}) => {


  const inputRef = useRef<HTMLInputElement>(null);

  // ← ADD THIS: Focus input when dialog opens
  useEffect(() => {
    if (open && inputRef.current) {
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Select text if editing existing record
          if (measurementTypeData.id) {
            inputRef.current.select();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, measurementTypeData.id]);



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
            if (measurementTypeData.id) {
              inputRef.current.select();
            }
          }
        }
      }}
    >
      <DialogTitle className='dialog-title'>{mode === 'edit' ? 'Edit' : 'Add'} Measurement Type</DialogTitle>
      <DialogContent className='dialog-content'>

        <div className="form-section">
          <div className="form-field">
            <TextField
              autoComplete="off"
              margin="dense"
              label="Measurement Type Name"
              name="measurementType"
              value={measurementTypeData.measurementType || ''}
              onChange={handleChange}
              fullWidth
              required
              inputRef={inputRef}
              error={!!validationErrors.measurementType}
              helperText={validationErrors.measurementType}
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
          ) : measurementTypeData.id ? 'Update' : 'Create'}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default MeasurementTypeDialog;