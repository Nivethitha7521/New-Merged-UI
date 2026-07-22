
'use client';
import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";

interface ActivateDeactivateConfirmationDialogProps {
  open: boolean;
  actionType: "deactivate" | "activate" | "delete" | null;
  itemName?: string;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
}

const ActivateDeactivateConfirmationDialog: React.FC<
  ActivateDeactivateConfirmationDialogProps
> = ({ open, actionType, itemName,  onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (loading) return;
    setLoading(true);

    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  const getMessage = () => {
    const name = itemName ? ` "${itemName}"` : "";

    switch (actionType) {
    case "deactivate":
      return `Are you sure you want to deactivate this${name}?`;
    case "activate":
      return `Are you sure you want to activate this${name}?`;
    case "delete":
      return `Are you sure you want to delete this${name}?`;
    default:
      return "";
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
        <label>{getMessage()}</label>
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

export default ActivateDeactivateConfirmationDialog;
