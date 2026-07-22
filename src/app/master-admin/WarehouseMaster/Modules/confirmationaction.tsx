import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
} from "@mui/material";

interface ConfirmationDialogProps {
  open: boolean;
  title?: string;
  message: string;
  locationName?: string;        // ✅ NEW
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  open,
  title = "Confirm Action",
  message,
  locationName,                 // ✅ NEW
  onConfirm,
  onCancel,
  confirmText = "Yes",
  cancelText = "Cancel",
}) => {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!open) setIsLoading(false);
  }, [open]);

  const handleConfirm = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const result = onConfirm();
      if (result && typeof result.then === "function") {
        await result;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (!isLoading) onCancel();
  };

  // ✅ Appends bold blue name if provided
  const renderMessage = () => {
    if (!locationName) return message;
    return (
      <>
        {message}{" "}
        <strong>"{locationName}"</strong>?
      </>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      PaperProps={{ className: "dialog-paper" }}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title" className="dialog-title">
        {title}
      </DialogTitle>

      <DialogContent className="dialog-content">
        <DialogContentText id="confirmation-dialog-description">
          {renderMessage()}
        </DialogContentText>
      </DialogContent>

      <DialogActions className="dialog-actions">
        <button
          type="button"
          onClick={handleCancel}
          className="btn-secondary"
          disabled={isLoading}
        >
          {cancelText}
        </button>
        <button
          type="submit"
          className="btn-primary"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <CircularProgress size={16} color="inherit" sx={{ mr: 1 }} />
              Processing...
            </>
          ) : (
            confirmText
          )}
        </button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmationDialog;