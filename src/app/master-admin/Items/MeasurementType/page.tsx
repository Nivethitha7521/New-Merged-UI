

'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store';
import { Snackbar, Alert } from '@mui/material';
// import MasterAdminMenu from '../page';
import {
  activateMeasurementType,
  addMeasurementType,
  deactivateMeasurementType,
  fetchMeasurementTypes,
  updateMeasurementType,
  setMeasurementTypeData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  resetMeasurementTypeData,
  setShowDeactivated,
} from '../MeasurementType/Features/measurementSlice';
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import MeasurementTypeTable from '../MeasurementType/Modules/measurementTable';
import MeasurementTypeDialog from '../MeasurementType/Modules/measurementDialog';
import { MeasurementType } from '../MeasurementType/Models/measurementTypeModels';

const MeasurementTypeComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: measurementTypes,
    measurementTypeData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated,
  } = useSelector((state: RootState) => state.measurementType);

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedMeasurementType, setSelectedMeasurementType] = useState<MeasurementType | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [validationErrors, setValidationErrors] = useState({
    measurementType: '',
  });

  useEffect(() => {
    dispatch(fetchMeasurementTypes());
  }, [dispatch, showDeactivated]);

  const handleOpen = () => {
    dispatch(resetMeasurementTypeData());
    setValidationErrors({ measurementType: '' });
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
    dispatch(resetMeasurementTypeData());
    setValidationErrors({ measurementType: '' });
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
    dispatch(setMeasurementTypeData({ ...measurementTypeData, [name]: value }));
    setValidationErrors({ ...validationErrors, [name]: '' });
    setUnsavedChanges(true);
  };

  const validateFields = () => {
    const errors = { measurementType: '' };
    let isValid = true;

    if (!measurementTypeData.measurementType?.trim()) {
      errors.measurementType = 'Measurement Type name is required';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    const isDuplicate = measurementTypes.some(
      (item) =>
        item.measurementType?.toLowerCase() === measurementTypeData.measurementType?.toLowerCase() &&
        item.id !== measurementTypeData.id,
    );

    if (isDuplicate) {
      dispatch(setSnackbarMessage('Measurement Type with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (measurementTypeData.id) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        await dispatch(addMeasurementType(measurementTypeData));
        dispatch(setSnackbarMessage('Measurement Type created successfully!'));
        resetDialog();
        dispatch(fetchMeasurementTypes());
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
      await dispatch(updateMeasurementType(measurementTypeData));
      dispatch(setSnackbarMessage('Measurement Type updated successfully!'));
      dispatch(fetchMeasurementTypes());
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

  const handleEdit = (measurementType: MeasurementType) => {
    dispatch(setMeasurementTypeData(measurementType));
    dispatch(setDialogOpen('edit'));
    setUnsavedChanges(false);
  };

  const handleDeactivate = (measurementType: MeasurementType) => {
    setSelectedMeasurementType(measurementType);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (measurementType: MeasurementType) => {
    setSelectedMeasurementType(measurementType);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedMeasurementType(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedMeasurementType && actionType) {
      try {
        if (actionType === 'deactivate') {
          await dispatch(deactivateMeasurementType(selectedMeasurementType.id));
        } else {
          await dispatch(activateMeasurementType(selectedMeasurementType.id));
        }
        dispatch(setSnackbarMessage(`Measurement Type ${actionType === 'deactivate' ? 'deactivated' : 'activated'}!`));
        dispatch(fetchMeasurementTypes());
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

      <MeasurementTypeTable
        handleOpen={handleOpen}
        handleEdit={handleEdit}
        handleActivate={handleActivate}
        handleDeactivate={handleDeactivate}
        showDeactivated={showDeactivated}
        setShowDeactivated={(value: boolean) => dispatch(setShowDeactivated(value))}
      />

      <MeasurementTypeDialog
        open={dialogOpen !== 'none'}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        measurementTypeData={measurementTypeData}
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

export default MeasurementTypeComponent;