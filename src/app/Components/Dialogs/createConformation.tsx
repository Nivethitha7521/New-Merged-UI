

'use client';
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";

interface CreateConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

const CreateConfirmationDialog: React.FC<CreateConfirmationDialogProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading) return; // prevent double click
    setLoading(true);

    try {
      await onConfirm(); // supports async or sync
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      PaperProps={{
        className: "dialog-paper",
      }}
    >
      <DialogTitle className="dialog-title">Confirmation</DialogTitle>

      <DialogContent className="dialog-content">
        <label>Are you sure you want to Create The Data?</label>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <button
          onClick={onClose}
          className="btn-secondary"
          disabled={loading}
        >
          Cancel
        </button>

        <button
          onClick={handleConfirm}
          className="btn-primary"
          disabled={loading}
        >
          {loading ? (
            <CircularProgress size={18} sx={{ color: "#fff" }} />
          ) : (
            "Confirm"
          )}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateConfirmationDialog;

