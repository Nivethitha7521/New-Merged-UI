

'use client';
import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../../../redux/store";
import {
  fetchPayments,
  addPayment,
  updatePayment,
  deactivatePayment,
  activatePayment,
  setPaymentData,
  setDialogOpen,
  setSnackbarOpen,
  setSnackbarMessage,
} from "../PaymentType/Features/PaymentTypeSlice";
import { PaymentType } from '../PaymentType/Models/paymenttypeModels';
import { Snackbar, Alert } from "@mui/material";
import PaymentTable from '../PaymentType/Modules/PaymentTable';
import PaymentDialog from '../PaymentType/Modules/paymentDialog';
import ActivateDeactivateConfirmationDialog from '../../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import CloseConfirmationDialog from "../../../Components/Dialogs/CloseConfirmationDialog";
import MenuPage from "../page";

const PaymentPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items,
    deactivatedItems,
    loading,
    dialogOpen,
    snackbarOpen,
    snackbarMessage,
    paymentData
  } = useSelector((state: RootState) => state.maPaymentType);

  const [viewDeactivated, setViewDeactivated] = useState(false);
  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentType | null>(null);
  const [actionType, setActionType] = useState<"deactivate" | "activate" | null>(null);
  const [validationErrors, setValidationErrors] = useState({ paymentType: "" });
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);


  useEffect(() => {
    dispatch(fetchPayments());
  }, [dispatch]);

  const handleOpen = () => {
    dispatch(setPaymentData({
      paymentTypeId: "",
      paymentType: "",
      description: "",
      createdDate: null,
      updatedDate: null,
      status: "active",
      editStatus: false,
    }));
    setValidationErrors({ paymentType: "" });
    setUnsavedChanges(false);
    dispatch(setDialogOpen("add"));
  };

  const handleClose = () => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      setValidationErrors({ paymentType: "" });
      dispatch(setDialogOpen("none"));
    }
  };

  const handleConfirmClose = () => {
    dispatch(setDialogOpen("none"));
    setCloseConfirmationDialogOpen(false);
  };

  const handleCancelClose = () => {
    setCloseConfirmationDialogOpen(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    dispatch(setPaymentData({ ...paymentData, [name]: value }));
    setValidationErrors({ ...validationErrors, [name]: "" });
    setUnsavedChanges(true);
  };

  const validateForm = () => {
    const errors = { paymentType: "" };

    if (!paymentData.paymentType.trim()) {
      errors.paymentType = "Payment Type is required";
    } else if (!/^[A-Za-z]+$/.test(paymentData.paymentType)) {
      errors.paymentType = "Payment Type can only contain letters";
    } else {
      const itemsToCheck = viewDeactivated ? [...items, ...deactivatedItems] : items;
      const isDuplicate = itemsToCheck.some(item =>
        item.paymentType.toLowerCase() === paymentData.paymentType.toLowerCase() &&
        item.paymentTypeId !== paymentData.paymentTypeId
      );
      if (isDuplicate) {
        errors.paymentType = "This payment type already exists";
      }
    }

    setValidationErrors(errors);
    return Object.values(errors).every(error => !error);
  };
  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (paymentData.paymentTypeId) {
        // For edit mode, open confirmation dialog
        setEditConfirmationDialogOpen(true);
      } else {
        // For add mode, submit directly
        await dispatch(addPayment(paymentData));
        dispatch(fetchPayments());
        dispatch(setSnackbarMessage("Payment added successfully!"));
        dispatch(setSnackbarOpen(true));
        setUnsavedChanges(false);
        dispatch(setDialogOpen("none"));
      }
    } catch (error: unknown) {
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch(setSnackbarMessage(errorMessage));
      dispatch(setSnackbarOpen(true));
    }
  };


  const handleEditConfirmation = async () => {
    await dispatch(updatePayment(paymentData));
    dispatch(fetchPayments());
    dispatch(setSnackbarMessage("Payment updated successfully!"));
    dispatch(setSnackbarOpen(true));
    // setUnsavedChanges(false);
    setEditConfirmationDialogOpen(false);
    dispatch(setDialogOpen("none"));
  };

  const handleEditConfirmationClose = () => {
    setEditConfirmationDialogOpen(false);
  };

  const handleEdit = (payment: PaymentType) => {
    dispatch(setPaymentData(payment));
    dispatch(setDialogOpen("edit"));
  };

  const handleDeactivate = (payment: PaymentType) => {
    setSelectedPayment(payment);
    setActionType("deactivate");
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (payment: PaymentType) => {
    setSelectedPayment(payment);
    setActionType("activate");
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedPayment && actionType) {
      if (actionType === "deactivate") {
        await dispatch(deactivatePayment(selectedPayment.paymentTypeId));
        dispatch(setSnackbarMessage("Payment deactivated successfully!"));
      } else if (actionType === "activate") {
        await dispatch(activatePayment(selectedPayment.paymentTypeId));
        dispatch(setSnackbarMessage("Payment activated successfully!"));
      }
      dispatch(fetchPayments());
      dispatch(setSnackbarOpen(true));
    }
    handleConfirmationDialogClose();
  };
  return (
    <>
      {/* <MenuPage /> */}


      <PaymentTable
        handleEdit={handleEdit}
        handleDeactivate={handleDeactivate}
        handleActivate={handleActivate}
        handleOpen={handleOpen}
        viewDeactivated={viewDeactivated}
        setViewDeactivated={setViewDeactivated}
      />


      <PaymentDialog
        open={dialogOpen !== "none"}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        paymentData={paymentData}
        validationErrors={validationErrors}
        mode={paymentData.paymentTypeId ? "Edit" : "Add"}
        loading={loading}
      />


      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedPayment?.paymentType}
        onClose={handleConfirmationDialogClose}
        onConfirm={handleConfirmationDialogConfirm}
      />

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


export default PaymentPage;