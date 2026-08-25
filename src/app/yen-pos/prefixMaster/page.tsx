








'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../redux/store';
import { Snackbar, Alert } from '@mui/material';
// import MasterAdminMenu from '../page';
import {
  activatePrefix,
  addPrefix,
  deactivatePrefix,
  fetchPrefix,
  updatePrefix,
  setPrefixData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  resetPrefixData,
  setShowDeactivated,
} from '../prefixMaster/Features/prefixSlice';
import CloseConfirmationDialog from '../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import InventoryTable from '../prefixMaster/Modules/prefixTable';
import InventoryDialog from '../prefixMaster/Modules/prefixDialog';
import { prefix } from '../prefixMaster/Models/prefixModel';

const PrefixComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: prefix,
    PrefixData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated,
  } = useSelector((state: RootState) => state.prefixType);

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<prefix | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [validationErrors, setValidationErrors] = useState({
    invoicePrefix: '',
  });

  useEffect(() => {
    dispatch(fetchPrefix());
  }, [dispatch, showDeactivated]);

  const handleOpen = () => {
    dispatch(resetPrefixData());
    setValidationErrors({ invoicePrefix: '' });
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
    dispatch(resetPrefixData());
    setValidationErrors({ invoicePrefix: '' });
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
    dispatch(setPrefixData({ ...PrefixData, [name]: value }));
    setValidationErrors({ ...validationErrors, [name]: '' });
    setUnsavedChanges(true);
  };

  const validateFields = () => {
    const errors = { invoicePrefix: '' };
    let isValid = true;

    if (!PrefixData.invoicePrefix?.trim()) {
      errors.invoicePrefix = 'Invoice Prefix name is required';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    const isDuplicate = prefix.some(
      (item) =>
        item.invoicePrefix?.toLowerCase() === PrefixData.invoicePrefix?.toLowerCase() &&
        item.id !== PrefixData.id,
    );

    if (isDuplicate) {
      dispatch(setSnackbarMessage('Inventory Type with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (PrefixData.id) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        await dispatch(addPrefix(PrefixData));
        dispatch(setSnackbarMessage('Invoice Prefix created successfully!'));
        resetDialog();
        dispatch(fetchPrefix());
      } catch (error: unknown) {
        let errorMessage = 'An error occurred';
        if (error instanceof Error) {
          errorMessage = error.message;
        }
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
      await dispatch(updatePrefix(PrefixData));
      dispatch(setSnackbarMessage('Invoice Prefix updated successfully!'));
      dispatch(fetchPrefix());
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

  const handleEdit = (prefix: prefix) => {
    dispatch(setPrefixData(prefix));
    dispatch(setDialogOpen('edit'));
    setUnsavedChanges(false);
  };

  const handleDeactivate = (prefix: prefix) => {
    setSelectedInventory(prefix);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (prefix: prefix) => {
    setSelectedInventory(prefix);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedInventory(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedInventory && actionType) {
      try {
        if (actionType === 'deactivate') {
          await dispatch(deactivatePrefix(selectedInventory.id));
        } else {
          await dispatch(activatePrefix(selectedInventory.id));
        }
        dispatch(setSnackbarMessage(`Inventory Type ${actionType === 'deactivate' ? 'deactivated' : 'activated'}!`));
        dispatch(fetchPrefix());
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
      {/* <MasterAdminMenu /> */}

      <InventoryTable
        handleOpen={handleOpen}
        handleEdit={handleEdit}
        handleActivate={handleActivate}
        handleDeactivate={handleDeactivate}
        showDeactivated={showDeactivated}
        setShowDeactivated={(value: boolean) => dispatch(setShowDeactivated(value))}
      />

      <InventoryDialog
        open={dialogOpen !== 'none'}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        prefixData={PrefixData}
        validationErrors={validationErrors}
        mode={dialogOpen as 'add' | 'edit'}
        isSubmitting={isSubmitting}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedInventory?.invoicePrefix}
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

export default PrefixComponent;