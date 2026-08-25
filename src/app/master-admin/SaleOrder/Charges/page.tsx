




'use client';
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../../redux/store";
import {
  fetchCharges,
  addCharge,
  updateCharge,
  setChargeData,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
} from "../Charges/Features/chargeSlice";
import { Charges } from "../Charges/Models/chargeModels";
import { Alert, Snackbar } from "@mui/material";
import ChargeTableComponent from "../Charges/Modules/chargeTable";
import CloseConfirmationDialog from "../../../Components/Dialogs/CloseConfirmationDialog";
import EditConfirmationDialog from "../../../Components/Dialogs/EditConfirmationDialog";
import ActivateDeactivateConfirmationDialog from "../../../Components/Dialogs/ActivateDeactivateConfirmationDialog";
import ChargeDialog from "../Charges/Modules/chargeDialog";
import MenuPage from "../page";

const ChargeTable: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    charge,
    loading,
    dialogOpen,
    snackbarOpen,
    snackbarMessage,
    chargeData,
  } = useSelector((state: RootState) => state.Charges);

  const [viewDeactivated, setViewDeactivated] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<Charges | null>(null);
  const [actionType, setActionType] = useState<"deactivate" | "activate" | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({ chargeType: "", });

  useEffect(() => {
    dispatch(fetchCharges());
  }, [dispatch]);

  const handleOpen = () => {
    dispatch(
      setChargeData({
        chargeId: "",
        chargeType: "",
        createdDate: null,
        updatedDate: null,
        createdBy: '',
        status: "active",
      })
    );
    setValidationErrors({ chargeType: "" });
    setUnsavedChanges(false);
    dispatch(setDialogOpen("add"));
  };

  const handleClose = () => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      setValidationErrors({ chargeType: "" });
      dispatch(setDialogOpen("none"));
    }
  };

  const handleConfirmClose = () => {
    dispatch(setDialogOpen("none"));
    setCloseConfirmationDialogOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch(setChargeData({ ...chargeData, [name]: value }));
    setValidationErrors({ ...validationErrors, [name]: "" });
    setUnsavedChanges(true);
  };

  const validateForm = () => {
    const errors = { chargeType: "" };
    let isValid = true;

    if (!chargeData.chargeType.trim()) {
      errors.chargeType = "Charge Type is required";
      isValid = false;
    } else if (!/^[A-Za-z\s]+$/.test(chargeData.chargeType)) {
      errors.chargeType = "Charge Name can only contain letters and spaces";
      isValid = false;
    } else if (chargeData.chargeType.length > 20) {
      errors.chargeType = "Name cannot exceed 20 characters";
      isValid = false;
    }

    // Check for duplicates (excluding current item if editing)
    const isDuplicate = charge.some(item =>
      item.chargeType.toLowerCase() === chargeData.chargeType.toLowerCase() &&
      (!chargeData.chargeId || item.chargeId !== chargeData.chargeId)
    );

    if (isDuplicate) {
      errors.chargeType = "This Charge Type already exists";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (chargeData.chargeId) {
      setEditConfirmationDialogOpen(true);
    } else {
      await dispatch(addCharge(chargeData));
      dispatch(fetchCharges());
      dispatch(setSnackbarMessage("Charge Type saved successfully!"));
      dispatch(setSnackbarOpen(true));
      setUnsavedChanges(false);
      dispatch(setDialogOpen("none"));
    }
  };

  const handleEditConfirmation = async () => {
    await dispatch(updateCharge(chargeData));
    dispatch(fetchCharges());
    dispatch(setSnackbarMessage("Charge Type updated successfully!"));
    dispatch(setSnackbarOpen(true));
    setUnsavedChanges(false);
    setEditConfirmationDialogOpen(false);
    dispatch(setDialogOpen("none"));
  };

  const handleEdit = (char: Charges) => {
    setSelectedCharge(char);
    dispatch(setChargeData(char));
    dispatch(setDialogOpen("edit"));
  };

  const handleDeactivate = (char: Charges) => {
    setSelectedCharge(char);
    setActionType("deactivate");
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (char: Charges) => {
    setSelectedCharge(char);
    setActionType("activate");
    setConfirmationDialogOpen(true);
  };


  const handleConfirmationDialogConfirm = async () => {
    if (selectedCharge && actionType) {
      const updatedData = {
        ...selectedCharge,
        status: actionType === "deactivate" ? "deactivated" : "active"
      };

      await dispatch(updateCharge(updatedData));
      dispatch(fetchCharges());
      dispatch(setSnackbarMessage(`Charge Type ${actionType} Successfully!`));
      dispatch(setSnackbarOpen(true));
    }
    setConfirmationDialogOpen(false);
    setSelectedCharge(null);
    setActionType(null);
  };

  return (
    <>
      {/* <MenuPage /> */}



      <ChargeTableComponent
        items={charge}
        loading={loading}
        viewDeactivated={viewDeactivated}
        setViewDeactivated={setViewDeactivated}
        handleOpen={handleOpen}
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
      />

      <ChargeDialog
        open={dialogOpen !== "none"}
        onClose={handleClose}
        onSubmit={handleSubmit}
        chargeData={chargeData}
        validationErrors={validationErrors}
        handleChange={handleChange}
        loading={false}
        mode={"Edit"}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedCharge?.chargeType}
        onClose={() => setConfirmationDialogOpen(false)}
        onConfirm={handleConfirmationDialogConfirm}
      />

      <EditConfirmationDialog
        open={editConfirmationDialogOpen}
        onClose={() => setEditConfirmationDialogOpen(false)}
        onConfirm={handleEditConfirmation}
      />

      <CloseConfirmationDialog
        open={closeConfirmationDialogOpen}
        onClose={() => setCloseConfirmationDialogOpen(false)}
        onConfirm={handleConfirmClose}
      />

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => dispatch(setSnackbarOpen(false))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert
          onClose={() => dispatch(setSnackbarOpen(false))}
          severity="info"
          sx={{ width: '100%', backgroundColor: '#1976d2', color: 'white' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ChargeTable;