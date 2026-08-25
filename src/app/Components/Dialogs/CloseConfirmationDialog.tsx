'use client';
import React from "react";
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography } from "@mui/material";

interface CloseConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const   CloseConfirmationDialog: React.FC<CloseConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog 
    open={open} 
    onClose={onClose}
     PaperProps={{
          className: "dialog-paper",
        }}
    >
      <DialogTitle className="dialog-title">Confirmation</DialogTitle>
      <DialogContent className="dialog-content">
        <label> Are you sure you want to close the form? Any unsaved changes will be lost. </label>
        
      </DialogContent>
      <DialogActions className="dialog-actions">
        <button onClick={onClose} color="primary" className="btn-secondary">
          Keep Editing
        </button>
        <button onClick={onConfirm} color="primary" className="btn-primary">
          Confirm
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default CloseConfirmationDialog;