


'use client';
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../redux/store";
import {
  fetchReasons,
  addReason,
  updateReason,
  setReasonData,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
} from "../reasons/Features/reasonSlice";
import { Reasons } from "../reasons/Models/reasonModels";
import { Alert, Snackbar } from "@mui/material";
import ReasonTableComponent from "../reasons/Modules/reasonTable";
import CloseConfirmationDialog from "../../Components/Dialogs/CloseConfirmationDialog";
import EditConfirmationDialog from "../../Components/Dialogs/EditConfirmationDialog";
import ActivateDeactivateConfirmationDialog from "../../Components/Dialogs/ActivateDeactivateConfirmationDialog";
import ReasonDialog from "../reasons/Modules/reasonDialog";
import MenuPage from "../page";

const ReasonPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { reasons, loading, dialogOpen, snackbarOpen, snackbarMessage, reasonData } = useSelector(
    (state: RootState) => state.Reasons
  );

  const [viewDeactivated, setViewDeactivated] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<Reasons | null>(null);
  const [actionType, setActionType] = useState<"deactivate" | "activate" | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState({ module: "", reason: "" });

  useEffect(() => {
    dispatch(fetchReasons());
  }, [dispatch]);

  const handleOpen = () => {
    dispatch(
      setReasonData({
        id: "",
        module: "",
        reason: [],
        createdDate: null,
        updatedDate: null,
        creatBy: "",
        status: "active",
      })
    );
    setValidationErrors({ module: "", reason: "" });
    setUnsavedChanges(false);
    dispatch(setDialogOpen("add"));
  };

  const handleClose = () => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      setValidationErrors({ module: "", reason: "" });
      dispatch(setDialogOpen("none"));
    }
  };

  const handleConfirmClose = () => {
    dispatch(setDialogOpen("none"));
    setCloseConfirmationDialogOpen(false);
  };

  // "Reason Name" text field
  const handleModuleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch(setReasonData({ ...reasonData, [name]: value }));
    setValidationErrors({ ...validationErrors, module: "" });
    setUnsavedChanges(true);
  };

  // Full replacement of the reasons[] list, called by the dialog after +/tick/edit actions
  const handleReasonListChange = (list: string[]) => {
    dispatch(setReasonData({ ...reasonData, reason: list }));
    setValidationErrors({ ...validationErrors, reason: "" });
    setUnsavedChanges(true);
  };

  const validateForm = () => {
    const errors = { module: "", reason: "" };
    let isValid = true;

    if (!reasonData.module.trim()) {
      errors.module = "Reason Name is required";
      isValid = false;
    } else if (!/^[A-Za-z\s]+$/.test(reasonData.module)) {
      errors.module = "Reason Name can only contain letters and spaces";
      isValid = false;
    } else if (reasonData.module.length > 30) {
      errors.module = "Name cannot exceed 30 characters";
      isValid = false;
    }

    const isDuplicate = reasons.some(
      (item) =>
        item.module.toLowerCase() === reasonData.module.toLowerCase() &&
        (!reasonData.id || item.id !== reasonData.id)
    );
    if (isDuplicate) {
      errors.module = "This Reason Name already exists";
      isValid = false;
    }

    if (!reasonData.reason || reasonData.reason.length === 0) {
      errors.reason = "Please add at least one reason";
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (reasonData.id) {
      setEditConfirmationDialogOpen(true);
    } else {
      await dispatch(addReason(reasonData));
      dispatch(fetchReasons());
      dispatch(setSnackbarMessage("Reason saved successfully!"));
      dispatch(setSnackbarOpen(true));
      setUnsavedChanges(false);
      dispatch(setDialogOpen("none"));
    }
  };

  const handleEditConfirmation = async () => {
    await dispatch(updateReason(reasonData));
    dispatch(fetchReasons());
    dispatch(setSnackbarMessage("Reason updated successfully!"));
    dispatch(setSnackbarOpen(true));
    setUnsavedChanges(false);
    setEditConfirmationDialogOpen(false);
    dispatch(setDialogOpen("none"));
  };

  const handleEdit = (r: Reasons) => {
    setSelectedReason(r);
    dispatch(setReasonData(r));
    dispatch(setDialogOpen("edit"));
  };

  const handleDeactivate = (r: Reasons) => {
    setSelectedReason(r);
    setActionType("deactivate");
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (r: Reasons) => {
    setSelectedReason(r);
    setActionType("activate");
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedReason && actionType) {
      const updatedData = {
        ...selectedReason,
        status: actionType === "deactivate" ? "deactivated" : "active",
      };
      await dispatch(updateReason(updatedData));
      dispatch(fetchReasons());
      dispatch(setSnackbarMessage(`Reason ${actionType}d Successfully!`));
      dispatch(setSnackbarOpen(true));
    }
    setConfirmationDialogOpen(false);
    setSelectedReason(null);
    setActionType(null);
  };

  return (
    <>
      {/* <MenuPage /> */}

      <ReasonTableComponent
        items={reasons}
        loading={loading}
        viewDeactivated={viewDeactivated}
        setViewDeactivated={setViewDeactivated}
        handleOpen={handleOpen}
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
      />

      <ReasonDialog
        open={dialogOpen !== "none"}
        onClose={handleClose}
        onSubmit={handleSubmit}
        reasonData={reasonData}
        validationErrors={validationErrors}
        handleModuleChange={handleModuleChange}
        handleReasonListChange={handleReasonListChange}
        loading={false}
        mode={"Edit"}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedReason?.module}
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
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={() => dispatch(setSnackbarOpen(false))}
          severity="info"
          sx={{ width: "100%", backgroundColor: "#1976d2", color: "white" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ReasonPage;