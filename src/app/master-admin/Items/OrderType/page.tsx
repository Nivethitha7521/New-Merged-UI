


'use client';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../../../redux/store';
import { Snackbar, Alert } from '@mui/material';
// import MasterAdminMenu from '../page';
import {
  activateOrderType,
  addOrderType,
  deactivateOrderType,
  fetchOrderTypes,
  updateOrderType,
  setOrderTypeData,
  setDialogOpen,
  setSnackbarMessage,
  setSnackbarOpen,
  resetOrderTypeData,
  setShowDeactivated,
} from '../OrderType/Features/orderTypeSlice';
import CloseConfirmationDialog from '../../../Components/Dialogs/CloseConfirmationDialog';
import EditConfirmationDialog from '../../../Components/Dialogs/EditConfirmationDialog';
import ActivateDeactivateConfirmationDialog from '../../../Components/Dialogs/ActivateDeactivateConfirmationDialog';
import OrderTypeTable from '../OrderType/Modules/ordertypeTable';
import OrderTypeDialog from '../OrderType/Modules/ordertypeDialog';
import { OrderType } from '../OrderType/Models/ordertypeModels';

const OrderTypeComponent: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const {
    items: orderTypes,
    orderTypeData,
    snackbarOpen,
    snackbarMessage,
    dialogOpen,
    showDeactivated,
  } = useSelector((state: RootState) => state.orderType);

  const [confirmationDialogOpen, setConfirmationDialogOpen] = useState(false);
  const [editConfirmationDialogOpen, setEditConfirmationDialogOpen] = useState(false);
  const [selectedOrderType, setSelectedOrderType] = useState<OrderType | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'activate' | null>(null);
  const [closeConfirmationDialogOpen, setCloseConfirmationDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [validationErrors, setValidationErrors] = useState({
    orderTypeName: '',
  });

  useEffect(() => {
    dispatch(fetchOrderTypes());
  }, [dispatch, showDeactivated]);

  const handleOpen = () => {
    dispatch(resetOrderTypeData());
    setValidationErrors({ orderTypeName: '' });
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
    dispatch(resetOrderTypeData());
    setValidationErrors({ orderTypeName: '' });
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
    dispatch(setOrderTypeData({ ...orderTypeData, [name]: value }));
    setValidationErrors({ ...validationErrors, [name]: '' });
    setUnsavedChanges(true);
  };

  const validateFields = () => {
    const errors = { orderTypeName: '' };
    let isValid = true;

    if (!orderTypeData.orderTypeName?.trim()) {
      errors.orderTypeName = 'Order Type name is required';
      isValid = false;
    }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async () => {
    if (!validateFields()) return;

    const isDuplicate = orderTypes.some(
      (item) =>
        item.orderTypeName?.toLowerCase() === orderTypeData.orderTypeName?.toLowerCase() &&
        item.id !== orderTypeData.id,
    );

    if (isDuplicate) {
      dispatch(setSnackbarMessage('Order Type with this name already exists.'));
      dispatch(setSnackbarOpen(true));
      return;
    }

    if (orderTypeData.id) {
      setEditConfirmationDialogOpen(true);
    } else {
      try {
        setIsSubmitting(true);
        await dispatch(addOrderType(orderTypeData));
        dispatch(setSnackbarMessage('Order Type created successfully!'));
        resetDialog();
        dispatch(fetchOrderTypes());
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
      await dispatch(updateOrderType(orderTypeData));
      dispatch(setSnackbarMessage('Order Type updated successfully!'));
      dispatch(fetchOrderTypes());
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

  const handleEdit = (orderType: OrderType) => {
    dispatch(setOrderTypeData(orderType));
    dispatch(setDialogOpen('edit'));
    setUnsavedChanges(false);
  };

  const handleDeactivate = (orderType: OrderType) => {
    setSelectedOrderType(orderType);
    setActionType('deactivate');
    setConfirmationDialogOpen(true);
  };

  const handleActivate = (orderType: OrderType) => {
    setSelectedOrderType(orderType);
    setActionType('activate');
    setConfirmationDialogOpen(true);
  };

  const handleConfirmationDialogClose = () => {
    setConfirmationDialogOpen(false);
    setSelectedOrderType(null);
    setActionType(null);
  };

  const handleConfirmationDialogConfirm = async () => {
    if (selectedOrderType && actionType) {
      try {
        if (actionType === 'deactivate') {
          await dispatch(deactivateOrderType(selectedOrderType.id));
        } else {
          await dispatch(activateOrderType(selectedOrderType.id));
        }
        dispatch(setSnackbarMessage(`Order Type ${actionType === 'deactivate' ? 'deactivated' : 'activated'}!`));
        dispatch(fetchOrderTypes());
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

      <OrderTypeTable
        handleOpen={handleOpen}
        handleEdit={handleEdit}
        handleActivate={handleActivate}
        handleDeactivate={handleDeactivate}
        showDeactivated={showDeactivated}
        setShowDeactivated={(value: boolean) => dispatch(setShowDeactivated(value))}
      />

      <OrderTypeDialog
        open={dialogOpen !== 'none'}
        handleClose={handleClose}
        handleSubmit={handleSubmit}
        handleChange={handleChange}
        orderTypeData={orderTypeData}
        validationErrors={validationErrors}
        mode={dialogOpen as 'add' | 'edit'}
        isSubmitting={isSubmitting}
      />

      <ActivateDeactivateConfirmationDialog
        open={confirmationDialogOpen}
        actionType={actionType}
        itemName={selectedOrderType?.orderTypeName}
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

export default OrderTypeComponent;