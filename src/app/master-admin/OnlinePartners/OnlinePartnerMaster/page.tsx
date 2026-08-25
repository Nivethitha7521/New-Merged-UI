


'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store';
import { Snackbar, Alert, } from '@mui/material';
//import MasterAdminMenu from '../page';
import {
  fetchOnlinePartners,
  addOnlinePartner,
  updateOnlinePartner,
  deactivateOnlinePartner,
  activateOnlinePartner,
  setPartnerData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  // resetPartnerData,
  setShowDeactivated
} from '../OnlinePartnerMaster/Features/OnlinePartnerSlice';
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from "../../../Components/Dialogs/ActivateDeactivateConfirmationDialog";
import OnlinePartnerTable from '../OnlinePartnerMaster/Modules/OnlinePartnerMastertable';
import OnlinePartnerDialog from '../OnlinePartnerMaster/Modules/OnlinePartnerMasterDialog';
import { validatePartnerName } from '@/app/Components/validation';

interface OnlinePartner {
  onlinePartnersId: string;
  partnerName: string;
  createdDate: Date | null;
  updatedDate: Date | null;
  status: string;
}

const initialOnlinePartnerState: OnlinePartner = {
  onlinePartnersId: '',
  partnerName: '',
  createdDate: null,
  updatedDate: null,
  status: 'active',
};

const OnlinePartnersComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: partners,
    partnerData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated
  } = useSelector((state: RootState) => state.maOnlinePartners);

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<OnlinePartner | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [validationErrors, setValidationErrors] = useState({
    partnerName: ""
  });

  useEffect(() => {
    dispatch(fetchOnlinePartners());
  }, [dispatch]);

  const handleOpen = () => {
    dispatch(setPartnerData(initialOnlinePartnerState));
    setValidationErrors({ partnerName: '' });
    dispatch(setDialogOpen('add'));
  };

  const handleClose = () => {
    if (unsavedChanges) {
      setCloseConfirmationDialogOpen(true);
    } else {
      resetDialog();
    }
  };

  const resetDialog = () => {
    dispatch(setDialogOpen('none'));
    dispatch(setPartnerData(initialOnlinePartnerState));
    setValidationErrors({ partnerName: '' });
    setUnsavedChanges(false);
  };

  const handleConfirmClose = () => {
    resetDialog();
    setCloseConfirmationDialogOpen(false);
  };

  const handleCancelClose = () => {
    setCloseConfirmationDialogOpen(false);
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === "partnerName") {
      // ✅ Block special characters — only letters, numbers, and spaces allowed
      const sanitized = value.replace(/[^A-Za-z0-9\s]/g, "");

      // ✅ Max 30 characters
      if (sanitized.length <= 30) {
        const upperValue = sanitized.toUpperCase();
        dispatch(setPartnerData({ ...partnerData, [name]: upperValue }));
        setValidationErrors(prev => ({ ...prev, partnerName: "" }));
        setUnsavedChanges(true);
      }
    } else {
      dispatch(setPartnerData({ ...partnerData, [name]: value }));
      setUnsavedChanges(true);
    }
  };


  const validateFields = () => {
    const errors = { partnerName: "" };
    let isValid = true;

    const nameError = validatePartnerName(partnerData.partnerName, "Partner Name");
    if (nameError) {
      errors.partnerName = nameError;
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };


  const handleSubmit = async () => {
    if (!validateFields()) return;

    const isDuplicate = partners.some(
      (item) =>
        item.partnerName.toLowerCase() === partnerData.partnerName.toLowerCase() &&
        item.onlinePartnersId !== partnerData.onlinePartnersId
    );

    if (isDuplicate) {
      dispatch(setSnackbarMessage('Partner with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (partnerData.onlinePartnersId) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        const result = await dispatch(addOnlinePartner(partnerData));

        // ✅ Check if the action was rejected
        if (addOnlinePartner.rejected.match(result)) {
          const errorDetail = (result.payload as { detail?: string })?.detail;
          dispatch(setSnackbarMessage(errorDetail || 'Partner with this name already exists.'));
          dispatch(setSnackbarOpen(true));
          return;
        }

        dispatch(setSnackbarMessage('Partner created successfully!'));
        dispatch(setSnackbarOpen(true));
        resetDialog();
        dispatch(fetchOnlinePartners());
      } catch (error: unknown) {
        let errorMessage = 'An error occurred';
        if (error instanceof Error) errorMessage = error.message;
        dispatch(setSnackbarMessage(errorMessage));
        dispatch(setSnackbarOpen(true));
      } finally {
        setIsSubmitting(false);
      }
    }
  };


  const handleEditConfirmation = async () => {
    try {
      setIsSubmitting(true);
      await dispatch(updateOnlinePartner(partnerData));
      dispatch(setSnackbarMessage('Partner updated successfully!'));
      dispatch(fetchOnlinePartners());
      resetDialog();
    } catch (error: unknown) {
      let errorMessage = 'An error occurred';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      dispatch(setSnackbarMessage(errorMessage));
      dispatch(setSnackbarOpen(true));
    } finally {
      setIsSubmitting(false);
      setEditConfirmationDialogOpen(false);
    }
  };

  const handleEditConfirmationClose = () => {
    setEditConfirmationDialogOpen(false);
  };

  const handleEdit = (partner: OnlinePartner) => {
    dispatch(setPartnerData(partner));
    dispatch(setDialogOpen("edit"));
    setUnsavedChanges(false);
  };

  const handleDeactivate = (partner: OnlinePartner) => {
    setSelectedPartner(partner);
    setActionType("deactivate");
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (partner: OnlinePartner) => {
    setSelectedPartner(partner);
    setActionType("activate");
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedPartner(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedPartner && actionType) {
      try {
        if (actionType === "deactivate") {
          await dispatch(deactivateOnlinePartner(selectedPartner.onlinePartnersId));
        } else {
          await dispatch(activateOnlinePartner(selectedPartner.onlinePartnersId));
        }
        dispatch(setSnackbarMessage(`Partner ${actionType === "deactivate" ? "deactivated" : "activated"} Successfully!`));
        dispatch(fetchOnlinePartners());
      } catch (error: unknown) {
        let errorMessage = 'An error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        dispatch(setSnackbarMessage(errorMessage));
        dispatch(setSnackbarOpen(true));
      }
    }
    handleConfirmationDialogClose();
  };

  return (
    <>


      <OnlinePartnerTable
        handleOpen={handleOpen}
        handleEdit={handleEdit}
        handleActivate={handleActivate}
        handleDeactivate={handleDeactivate}
        showDeactivated={showDeactivated}
        setShowDeactivated={(value: boolean) => dispatch(setShowDeactivated(value))}
      />

      <OnlinePartnerDialog
        open={dialogOpen !== 'none'}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        partnerData={partnerData}
        validationErrors={validationErrors}
        mode={dialogOpen as 'add' | 'edit'}
        isSubmitting={isSubmitting}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
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

export default OnlinePartnersComponent;