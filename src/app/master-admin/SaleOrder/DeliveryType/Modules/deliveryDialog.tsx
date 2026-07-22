"use client";
import React, { useEffect, useRef } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
  Button,
  Box,
} from "@mui/material";
import { DeliveryType } from "../Models/deliverytypeModels";


interface DeliveryTypeProps {
  open: boolean;
  editData: DeliveryType | null;
  isEditMode: boolean;
  handleChange: (
    field: keyof Omit<DeliveryType, "deliveryTypeId">,
    value: string
  ) => void;
  handleClose: () => void;
  handleSubmit: () => void;
  discardChangesOpen: boolean;
  setDiscardChangesOpen: React.Dispatch<React.SetStateAction<boolean>>;
  handleDiscardChanges: () => void;
  confirmationOpen: boolean;
  confirmationMessage: string;
  setConfirmationOpen: React.Dispatch<React.SetStateAction<boolean>>;
  confirmAction: () => void;
  errors: {
    deliveryType: string;
    remarks: string;
  };
  setErrors: React.Dispatch<
    React.SetStateAction<{
      deliveryType: string;
      remarks: string;
    }>
  >;
  formData: Omit<DeliveryType, "deliveryTypeId">;
}

const DeliveryDialogs: React.FC<DeliveryTypeProps> = ({
  open,
  editData,
  handleChange,
  handleClose,
  handleSubmit,
  discardChangesOpen,
  setDiscardChangesOpen,
  handleDiscardChanges,
  confirmationMessage,
  setConfirmationOpen,
  confirmationOpen,
  confirmAction,
  errors,
  setErrors,
  formData,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && inputRef.current) {
      // Small delay to ensure dialog is fully rendered
      const timer = setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Select all text if in edit mode
          if (editData) {
            inputRef.current.select();
          }
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [open, editData]);

  const isFormDirty = () => {
    if (editData) {
      return (
        editData.deliveryType !== formData.deliveryType ||
        (editData.remarks || "") !== (formData.remarks || "")
      );
    } else {
      return (
        formData.deliveryType.trim() !== "" ||
        (formData.remarks || "").trim() !== ""
      );
    }
  };

  const handleAttemptClose = () => {
    if (isFormDirty()) {
      setDiscardChangesOpen(true);
    } else {
      handleClose();
    }
  };

  const validateField = (
    field: keyof Omit<DeliveryType, "deliveryTypeId">,
    value: string
  ) => {
    let message = "";
    if (field === "deliveryType") {
      if (!value.trim()) {
        message = "Delivery type is required.";
      } else if (value.trim().length < 3) {
        message = "Delivery type must be at least 3 characters.";
      }
    }

    if (field === "remarks") {
      if (value && value.trim().length < 3) {
        message = "Remarks must be at least 3 characters if provided.";
      }
    }

    setErrors((prev) => ({ ...prev, [field]: message }));
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleAttemptClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: "dialog-paper-small",
        }}
        TransitionProps={{
          onEntered: () => {
            if (inputRef.current) {
              inputRef.current.focus();
              if (editData) {
                inputRef.current.select();
              }
            }
          }
        }}
      >
        <DialogTitle className="dialog-title">
          {editData ? "Edit Delivery Type" : "Add Delivery Type"}
        </DialogTitle>
        <DialogContent className="dialog-content">

          <div className="form-section">
            <TextField
              name="deliveryType"
              label="Delivery Type"
              fullWidth
              value={formData.deliveryType}
              onChange={(e) => {
                handleChange("deliveryType", e.target.value);
                validateField("deliveryType", e.target.value);
              }}
              margin="dense"
              required
              error={Boolean(errors.deliveryType)}
              helperText={errors.deliveryType}
              size="small"
              autoComplete="off"
              inputRef={inputRef}
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              InputProps={{ className: "custom-input" }}
            />
            <TextField
              name="remarks"
              label="Remarks"
              fullWidth
              value={formData.remarks || ""}
              onChange={(e) => {
                handleChange("remarks", e.target.value);
                validateField("remarks", e.target.value);
              }}
              margin="dense"
              error={Boolean(errors.remarks)}
              helperText={errors.remarks}
              size="small"
              autoComplete="off"
              className="custom-textfield"
              InputLabelProps={{ className: "custom-label" }}
              InputProps={{ className: "custom-input" }}
            />
          </div>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button onClick={handleAttemptClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSubmit} color="primary" className="btn-primary">
            {editData ? "Update" : "Create"}
          </button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmationOpen}
        onClose={() => setConfirmationOpen(false)}
      >
        <DialogTitle className="dialog-title">Confirm Action</DialogTitle>
        <DialogContent className="dialog-content">
          <label>{confirmationMessage}</label>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button onClick={() => setConfirmationOpen(false)} className="btn-secondary">No</button>
          <button onClick={confirmAction} color="primary" className="btn-primary">
            Yes
          </button>
        </DialogActions>
      </Dialog>

      {/* Unsaved Changes Dialog */}
      <Dialog
        open={discardChangesOpen}
        onClose={() => setDiscardChangesOpen(false)}
      >
        <DialogTitle className="dialog-title">Discard Changes?</DialogTitle>
        <DialogContent className="dialog-content">
          <label>
            You have unsaved changes. Are you sure you want to discard them?
          </label>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button onClick={() => setDiscardChangesOpen(false)} className="btn-secondary">Keep Editing</button>
          <button onClick={handleDiscardChanges} className="btn-primary">
            Discard Changes
          </button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default DeliveryDialogs;