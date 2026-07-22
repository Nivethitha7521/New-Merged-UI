'use client';
import React, { useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../../redux/store";
import {
  setWhatsAppData,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
  addWhatsApp,
  updateWhatsApp,
  fetchWhatsApps,
} from "../Features/whatsAppSlice";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Snackbar,
  Alert,
} from "@mui/material";
import CloseConfirmationDialog from "../../../Components/Dialogs/CloseConfirmationDialog";
import EditConfirmationDialog from "../../../Components/Dialogs/EditConfirmationDialog";

interface WhatsAppDialogProps {
  handleClose: () => void;
}

const WhatsAppDialog: React.FC<WhatsAppDialogProps> = ({ handleClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { dialogOpen, snackbarOpen, snackbarMessage, whatsAppData } = useSelector(
    (state: RootState) => state.WhatsApp
  );

  const inputRef = useRef<HTMLInputElement>(null);

  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [, setUnsavedChanges] = useState(false);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "whatsAppRollName") {
      if (value === "" || /^[A-Za-z\s\W]*$/.test(value)) {
        if (value.length <= 20) {
          dispatch(setWhatsAppData({ ...whatsAppData, [name]: value }));
        }
      }
    } else if (name === "mobileNumber") {
      if (value === "" || /^\d*$/.test(value)) {
        if (value.length <= 10) {
          dispatch(setWhatsAppData({ ...whatsAppData, [name]: value }));
        }
      }
    } else {
      dispatch(setWhatsAppData({ ...whatsAppData, [name]: value }));
    }

    setValidationErrors({ ...validationErrors, [name]: "" });
    setUnsavedChanges(true);
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    const name = String(whatsAppData.whatsAppRollName || "");
    const mobile = String(whatsAppData.mobileNumber || "");

    if (!name) {
      errors.whatsAppRollName = "WhatsApp Role Name is required";
    } else if (!/^[A-Za-z\s\W]+$/.test(name)) {
      errors.whatsAppRollName = "Only letters, spaces, and special characters allowed";
    } else if (name.length > 20) {
      errors.whatsAppRollName = "Name cannot exceed 20 characters";
    }

    if (!mobile) {
      errors.mobileNumber = "Mobile Number is required";
    } else if (!/^\d+$/.test(mobile)) {
      errors.mobileNumber = "Only numbers are allowed";
    } else if (mobile.length !== 10) {
      errors.mobileNumber = "Mobile number must be 10 digits";
    } else if (!/^[6-9]\d{9}$/.test(mobile)) {
      errors.mobileNumber = "Please enter a valid Mobile number";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (whatsAppData.moduleAdminId) {
      setEditConfirmationDialogOpen(true);
    } else {
      // Add Logic
      await dispatch(addWhatsApp(whatsAppData));
      dispatch(fetchWhatsApps()); // Refresh list
      dispatch(setSnackbarMessage("WhatsApp role saved successfully!"));
      dispatch(setSnackbarOpen(true));
      setUnsavedChanges(false);
      setEditConfirmationDialogOpen(false);
      dispatch(setDialogOpen("none"));
    }
  };


  const handleEditConfirmation = async () => {
    await dispatch(updateWhatsApp(whatsAppData));
    dispatch(setSnackbarMessage("WhatsApp role updated successfully!"));
    dispatch(setSnackbarOpen(true));
    setUnsavedChanges(false);
    setEditConfirmationDialogOpen(false);
    dispatch(setDialogOpen("none"));
  };

  const handleEditConfirmationClose = () => {
    setEditConfirmationDialogOpen(false);
  };

  const handleConfirmClose = () => {
    dispatch(setDialogOpen("none"));
    setCloseConfirmationDialogOpen(false);
  };

  const handleCancelClose = () => {
    setCloseConfirmationDialogOpen(false);
  };

  return (
    <>
      <Dialog
        open={dialogOpen !== "none"}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: "dialog-paper-small"
        }}

        TransitionProps={{
          // ← ADD THIS: Fallback focus on transition end
          onEntered: () => {
            if (inputRef.current) {
              inputRef.current.focus();
              if (whatsAppData.moduleAdminId) {
                inputRef.current.select();
              }
            }
          }
        }}


      >
        <DialogTitle className="dialog-title">{whatsAppData.moduleAdminId ? "Edit" : "Add"} WhatsApp Role</DialogTitle>
        <DialogContent className="dialog-content">

          <div className="form-section">

            <div className="form-field">
              <TextField
                label="WhatsApp Role Name"
                name="whatsAppRollName"
                value={whatsAppData.whatsAppRollName}
                onChange={handleChange}
                margin="normal"
                fullWidth
                autoComplete="off"
                inputRef={inputRef}
                error={!!validationErrors.whatsAppRollName}
                helperText={validationErrors.whatsAppRollName}
                inputProps={{ maxLength: 20 }}
                className="custom-textfield"
                InputLabelProps={{ className: "custom-label" }}
                InputProps={{ className: "custom-input" }}
              />
            </div>

            <div className="form-field">
              <TextField
                label="Mobile Number"
                name="mobileNumber"
                value={whatsAppData.mobileNumber}
                onChange={handleChange}
                margin="normal"
                fullWidth
                autoComplete="off"
                error={!!validationErrors.mobileNumber}
                helperText={validationErrors.mobileNumber}
                inputProps={{ maxLength: 10 }}
                className="custom-textfield"
                InputLabelProps={{ className: "custom-label" }}
                InputProps={{ className: "custom-input" }}
              />
            </div>
          </div>
        </DialogContent>
        <DialogActions className="dialog-actions">
          <button className="btn-secondary" onClick={handleClose} color="primary">
            Cancel
          </button>
          <button className="btn-primary" onClick={handleSubmit} color="primary">
            Save
          </button>
        </DialogActions>
      </Dialog>

      <EditConfirmationDialog
        open={editConfirmationDialogOpen}
        onClose={handleEditConfirmationClose}
        onConfirm={handleEditConfirmation}
      />

      <CloseConfirmationDialog
        open={closeConfirmationDialogOpen}
        onClose={handleCancelClose}
        onConfirm={handleConfirmClose}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => dispatch(setSnackbarOpen(false))}
      >
        <Alert
          severity="info"
          sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default WhatsAppDialog;